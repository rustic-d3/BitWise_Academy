"""Profile picture storage on Supabase Storage."""

from django.conf import settings
import requests

AVATAR_BUCKET = "profile_avatars"


class StorageUploadError(Exception):
    pass


def upload_profile_picture(file, filename: str) -> str:
    """Upload (or overwrite) `filename` in the avatars bucket and return its public URL."""
    base_url = settings.SUPABASE_URL
    service_key = settings.SUPABASE_SERVICE_KEY

    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": file.content_type or "image/jpeg",
    }
    url = f"{base_url}/storage/v1/object/{AVATAR_BUCKET}/{filename}"
    file_bytes = file.read()

    # PUT overwrites an existing object; POST creates it the first time.
    response = requests.put(url, headers=headers, data=file_bytes, timeout=30)
    if response.status_code == 404:
        response = requests.post(url, headers=headers, data=file_bytes, timeout=30)

    if response.status_code not in (200, 201):
        raise StorageUploadError(f"Upload failed: {response.text}")

    return f"{base_url}/storage/v1/object/public/{AVATAR_BUCKET}/{filename}"


def avatar_filename(prefix: str, user_id: int, uploaded_name: str) -> str:
    extension = uploaded_name.rsplit(".", 1)[-1]
    return f"{prefix}_{user_id}.{extension}"
