from api.models import User, Teacher, Parent
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    teaching_module = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "username", "password", "email", "role", "phone_number", "description", "teaching_module"]
        extra_kwargs = {
            "password": {"write_only": True},
            "role": {"required": False} 
        }

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.PARENT)
        
        request = self.context.get('request')
        if role == User.Role.ADMIN and not (request and request.user.is_superuser):
            role = User.Role.PARENT

        phone_number = validated_data.pop('phone_number', None)
        description = validated_data.pop('description', None)
        teaching_module = validated_data.pop('teaching_module', None)

        if role == User.Role.TEACHER:
            return Teacher.objects.create_user(
                description=description, 
                teaching_module=teaching_module, 
                **validated_data
            )
        elif role == User.Role.PARENT:
            return Parent.objects.create_user(
                phone_number=phone_number, 
                **validated_data
            )
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if 'role' in validated_data:
            if not request.user.is_superuser:
                validated_data.pop('role')
        
        return super().update(instance, validated_data)    