import os
import requests

def upload_profile_picture(file, filename: str) -> str:
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    bucket = "profile_avatars"

    file_bytes = file.read()
    content_type = file.content_type or "image/jpeg"

    headers_auth = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }

    url = f"{supabase_url}/storage/v1/object/{bucket}/{filename}"

    # update (PUT) — dacă fișierul există îl suprascrie
    response = requests.put(
        url,
        headers={**headers_auth, "Content-Type": content_type},
        data=file_bytes,
    )

    # Dacă nu există încă, creează (POST)
    if response.status_code == 404:
        response = requests.post(
            url,
            headers={**headers_auth, "Content-Type": content_type},
            data=file_bytes,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Upload failed: {response.text}")

    return f"{supabase_url}/storage/v1/object/public/{bucket}/{filename}"