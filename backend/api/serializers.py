from datetime import timedelta
import time

from django.utils import timezone
import requests
from api.models import ChildProfile, Classroom, Lesson, User, TeacherProfile, ParentProfile
from rest_framework import serializers
from django.core.validators import RegexValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from agora_token_builder import RtcTokenBuilder, RtmTokenBuilder

import os


class UserSerializer(serializers.ModelSerializer):    
  
    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be in format: '+999999999'. Up to 15 digits."
            )
        ]
    )
    
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "min_length": "Password must be at least 8 characters."
        }
    )

    description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    teaching_module = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "password", "email", "role", "phone_number", "description", "teaching_module"]
        extra_kwargs = {
            "role": {"required": False}, 
        }

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.PARENT)
    
        request = self.context.get('request')
        if role == User.Role.ADMIN and not (request and request.user.is_superuser):
            role = User.Role.PARENT

        phone_number = validated_data.pop('phone_number', None)
        description = validated_data.pop('description', None)
        teaching_module = validated_data.pop('teaching_module', None)
    
        validated_data['role'] = role  #
        
        if phone_number:
            validated_data['phone_number'] = phone_number

        user = User.objects.create_user(**validated_data)  # create user with phone_number

        if role == User.Role.TEACHER:
            TeacherProfile.objects.create(user=user, teaching_module=teaching_module, description=description)
        else:
            ParentProfile.objects.create(user=user) # No phone_number field here anymore

        return user
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if 'role' in validated_data and not request.user.is_superuser:
            validated_data.pop('role')

        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        
        if password:
            instance.set_password(password)
            instance.save()
        
        return instance  

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already in use.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_password(self, value):
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        return value
    
    def validate_phone_number(self, value):
        if value and User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token
    
class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = "__all__"
        ordering = ["date_time"]

class LessonJoinSerializer(serializers.ModelSerializer):
    agora_data = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'channel_name', 'date_time', 'agora_data', 'is_test_active',]

    def get_agora_data(self, obj):

        app_id = os.getenv("AGORA_APP_ID")
        app_certificate = os.getenv("AGORA_APP_CERTIFICATE")
        
        user = self.context['request'].user
        uid = user.id 
        
        if not app_id or not app_certificate:
            raise ValueError("AGORA_APP_ID sau CERTIFICATE lipsesc! Verifică fișierul .env și setările Docker.")
        

        role = 1 if str(user.role).lower() == "teacher" else 2

        expiration_time = 3600
        current_timestamp = int(time.time())
        privilege_expired_ts = current_timestamp + expiration_time
        channel_name = obj.channel_name

        if not channel_name:
            channel_name = f"lesson_{obj.id}"
            obj.channel_name = channel_name
            obj.save()
        video_token = RtcTokenBuilder.buildTokenWithUid(
            app_id, app_certificate, channel_name, 0, role, privilege_expired_ts
        )
        rtm_token = RtmTokenBuilder.buildToken(
            app_id, 
            app_certificate, 
            str(uid), 
            1,        
            privilege_expired_ts
        )
        whiteboard_sdk_token = os.getenv("AGORA_WHITEBOARD_SDK_TOKEN") 
        whiteboard_region = "eu" 

        headers = {
            "token": whiteboard_sdk_token,
            "Content-Type": "application/json",
            "region": whiteboard_region
        }
        
        room_uuid = getattr(obj, 'whiteboard_uuid', None)
        
        if not room_uuid:
            room_response = requests.post(
                "https://api.netless.link/v5/rooms", 
                headers=headers,
                json={"isRecord": False}
            )
            if room_response.status_code == 201:
                room_uuid = room_response.json().get('uuid')
                obj.whiteboard_uuid = room_uuid 
                obj.save()
                
        board_token = None
        if room_uuid:
            token_response = requests.post(
                f"https://api.netless.link/v5/tokens/rooms/{room_uuid}",
                headers=headers,
                json={"lifespan": 0, "role": "admin" if role == 1 else "writer"}
            )
            if token_response.status_code == 201:
                board_token = token_response.json()
                
            participants = {}
            for student in obj.classroom.students.all():
                participants[str(student.parent.user.id)] = student.full_name
                
        return {
            "token": video_token,
            "rtm_token": rtm_token,
            "uid": uid,
            "appId": app_id,
            "channel": channel_name,
            "teacherUid": obj.classroom.teacher.user.id,
            "teacherName": f"{obj.classroom.teacher.user.first_name} {obj.classroom.teacher.user.last_name}",
            "participants": participants,
            "whiteboard": {
                "uuid": room_uuid,
                "token": board_token,
                "appIdentifier": os.getenv("AGORA_WHITEBOARD_APP_IDENTIFIER"),
                "region": whiteboard_region
            }}

class ChildProfileBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildProfile
        fields = ["id", "full_name", "credits", "parent"]
                
class TeacherProfileBasicSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = ["first_name", "last_name", "description", "teaching_module"]

class ClassroomBasicSerializer(serializers.ModelSerializer):
    # Schimbăm de la LessonSerializer la SerializerMethodField
    lessons = serializers.SerializerMethodField()
    students = ChildProfileBasicSerializer(many=True, read_only=True)
    teacher = TeacherProfileBasicSerializer(read_only=True)

    class Meta:
        model = Classroom
        fields = ["id", "titlu","teacher" , "students", "schedule_day", "schedule_time", "is_canceled", "lessons", "classroom_type"]

    def get_lessons(self, obj):
        buffer_time = timezone.now() - timedelta(hours=1)
        
        active_lessons = obj.lessons.filter(
            is_canceled=False,
            date_time__gte=buffer_time
        ).order_by("date_time")

        return LessonSerializer(active_lessons, many=True).data


class ChildProfileSerializer(serializers.ModelSerializer):
    classroom = ClassroomBasicSerializer(read_only=True)
    def get_classroom(self, obj):
        if not obj.classroom:
            return None
        return ClassroomSerializer(
            obj.classroom,
            context=self.context  
        ).data

    class Meta:
        model = ChildProfile
        fields = ["id", "full_name", "credits", "parent", "classroom", "age"]
        read_only_fields = ["id", "parent"]


class ClassroomSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()
    students = ChildProfileBasicSerializer(many=True, read_only=True)

    def get_lessons(self, obj):
        child_id = self.context.get("child_id")
        buffer_time = timezone.now() - timedelta(hours=1)
        lessons = obj.lessons.filter(
            is_canceled=False,
            date_time__gte=buffer_time
        ).order_by("date_time")

        if child_id:
            lessons = lessons.exclude(skipped_by__id=child_id)  # ← filter skipped

        return LessonSerializer(lessons, many=True).data

    class Meta:
        model = Classroom
        fields = ["id", "titlu", "students", "schedule_day", "schedule_time", "is_canceled", "lessons", "classroom_type"]


class TeacherProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    classrooms = ClassroomSerializer(many=True, read_only=True)

    class Meta:
        model = TeacherProfile
        fields = ["first_name", "last_name", "description", "teaching_module", "classrooms"]


class ParentProfileSerializer(serializers.ModelSerializer):
    children = ChildProfileSerializer(many=True, read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)

    class Meta:
        model = ParentProfile
        fields = "__all__"


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token