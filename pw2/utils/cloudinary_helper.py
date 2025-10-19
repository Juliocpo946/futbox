import cloudinary.uploader
from ..models import Multimedia

def upload_image(file):
    if not file:
        raise ValueError("No se proporciono ningun archivo.")

    upload_result = cloudinary.uploader.upload(
        file,
        folder="futbox_multimedia",
        resource_type="auto"
    )

    if 'secure_url' not in upload_result:
        raise ConnectionError("No se pudo subir la imagen a Cloudinary.")

    multimedia_obj = Multimedia.objects.create(path=upload_result['secure_url'])
    return multimedia_obj

def delete_image(public_id):
    cloudinary.uploader.destroy(public_id)