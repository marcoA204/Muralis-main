import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

s3_client = None
if settings.STORAGE_DRIVER == "s3":
    try:
        s3_config = Config(
            s3={'addressing_style': 'path'} if settings.S3_FORCE_PATH_STYLE else {},
            signature_version='s3v4'
        )
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=s3_config
        )
    except Exception as e:
        print(f"S3 client initialization warning: {e}")

def ensure_bucket_exists():
    if settings.STORAGE_DRIVER == "s3" and s3_client:
        try:
            s3_client.head_bucket(Bucket=settings.S3_BUCKET)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code in ('404', 'NoSuchBucket', 'NotFound'):
                try:
                    s3_client.create_bucket(Bucket=settings.S3_BUCKET)
                except Exception as create_err:
                    print(f"Failed to create bucket: {create_err}")
        except Exception as e:
            print(f"Error checking bucket: {e}")
    else:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

def upload_file(file_bytes: bytes, storage_key: str, content_type: str):
    if settings.STORAGE_DRIVER == "s3" and s3_client:
        s3_client.put_object(
            Bucket=settings.S3_BUCKET,
            Key=storage_key,
            Body=file_bytes,
            ContentType=content_type
        )
    else:
        file_path = os.path.join(settings.UPLOAD_DIR, storage_key.replace("/", "_"))
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_bytes)

def generate_presigned_url(storage_key: str, expires_in: int = 86400, asset_id: str = "") -> str:
    if settings.STORAGE_DRIVER == "s3" and s3_client:
        try:
            return s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.S3_BUCKET, 'Key': storage_key},
                ExpiresIn=expires_in
            )
        except Exception as e:
            print(f"Error generating presigned url: {e}")
    
    if asset_id:
        return f"http://localhost:{settings.PORT}/assets/{asset_id}/stream"
    return f"http://localhost:{settings.PORT}/uploads/{storage_key.replace('/', '_')}"

def get_file_bytes_or_stream(storage_key: str):
    if settings.STORAGE_DRIVER == "s3" and s3_client:
        s3_obj = s3_client.get_object(Bucket=settings.S3_BUCKET, Key=storage_key)
        return s3_obj["Body"]
    else:
        file_path = os.path.join(settings.UPLOAD_DIR, storage_key.replace("/", "_"))
        if os.path.exists(file_path):
            return open(file_path, "rb")
        raise FileNotFoundError(f"File {storage_key} not found")
