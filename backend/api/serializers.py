from api.models import Classroom, Lesson, User, TeacherProfile, ParentProfile
from rest_framework import serializers
from django.core.validators import RegexValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


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

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "password", "email", "role", "phone_number"]
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
    
        validated_data['role'] = role  # enforce the corrected role before creation

        user = User.objects.create_user(**validated_data)  # create user FIRST

        if role == User.Role.TEACHER:
            TeacherProfile.objects.create(user=user, teaching_module= teaching_module, description= description)

        else:
            ParentProfile.objects.create(user=user, phone_number=phone_number)

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
        if value and ParentProfile.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value


# serializers.py

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "date_time", "is_canceled"]


class ClassroomSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Classroom
        fields = ["id", "schedule_day", "schedule_time", "is_canceled", "lessons"]


class TeacherProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    classrooms = ClassroomSerializer(many=True, read_only=True)
    

    class Meta:
        model = TeacherProfile
        fields = ["first_name", "last_name", "description", "teaching_module", "classrooms"]
    
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role  
        return token