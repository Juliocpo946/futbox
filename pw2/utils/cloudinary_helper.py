import cloudinary.uploader
from ..models import Multimedia
import os

def get_file_type(file_extension):
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    video_extensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv']
    if file_extension in image_extensions:
        return 'image'
    elif file_extension in video_extensions:
        return 'video'
    else:
        return 'unknown'

def upload_image(file):
    if not file:
        raise ValueError("No se proporciono ningun archivo.")

    try:
        upload_result = cloudinary.uploader.upload(
            file,
            folder="futbox_multimedia",
            resource_type="auto"
        )
    except Exception as e:
         raise ConnectionError(f"Error al subir a Cloudinary: {str(e)}")


    if 'secure_url' not in upload_result or 'resource_type' not in upload_result:
        raise ConnectionError("Respuesta inesperada de Cloudinary.")

    file_name, file_extension = os.path.splitext(upload_result.get('original_filename', ''))
    media_type = upload_result.get('resource_type', get_file_type(file_extension.lower()))
    if media_type not in ['image', 'video']:
        media_type = get_file_type(file_extension.lower())


    multimedia_obj = Multimedia.objects.create(
        path=upload_result['secure_url'],
        media_type=media_type
     )
    return multimedia_obj

def delete_image(public_id):
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"Error deleting from Cloudinary: {e}")