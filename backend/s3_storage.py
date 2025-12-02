import os
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class S3Storage:
    def __init__(self):
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.bucket_name = os.getenv("S3_BUCKET_NAME")

        if not all([self.aws_access_key_id, self.aws_secret_access_key, self.bucket_name]):
            raise ValueError("AWS credentials and S3 bucket name must be set in environment variables")

        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.aws_region
        )

    def _generate_s3_key(self, user_id: int, document_id: int, file_type: str) -> str:
        """
        Generate S3 object key following the pattern: {user_id}/{document_id}/{type}

        Args:
            user_id: User ID
            document_id: Document ID
            file_type: Type of file (e.g., 'original', 'translated')

        Returns:
            S3 object key string
        """
        return f"{user_id}/{document_id}/{file_type}"

    async def upload_file(self, file: UploadFile, user_id: int, document_id: int, file_type: str) -> str:
        """
        Upload a file to S3.

        Args:
            file: FastAPI UploadFile object
            user_id: User ID
            document_id: Document ID
            file_type: Type of file (e.g., 'original', 'translated')

        Returns:
            S3 object key (path) where the file was stored

        Raises:
            ClientError: If upload fails
        """
        s3_key = self._generate_s3_key(user_id, document_id, file_type)

        try:
            content = await file.read()

            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type or 'application/octet-stream'
            )

            logger.info(f"Successfully uploaded file to S3: {s3_key}")
            return s3_key

        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            raise

    def download_file(self, s3_key: str) -> bytes:
        """
        Download a file from S3.

        Args:
            s3_key: S3 object key (path)

        Returns:
            File content as bytes

        Raises:
            ClientError: If download fails
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            content = response['Body'].read()
            logger.info(f"Successfully downloaded file from S3: {s3_key}")
            return content

        except ClientError as e:
            logger.error(f"Error downloading file from S3: {e}")
            raise

    def delete_file(self, s3_key: str) -> bool:
        """
        Delete a file from S3.

        Args:
            s3_key: S3 object key (path)

        Returns:
            True if deletion was successful

        Raises:
            ClientError: If deletion fails
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Successfully deleted file from S3: {s3_key}")
            return True

        except ClientError as e:
            logger.error(f"Error deleting file from S3: {e}")
            raise

    def delete_document_files(self, user_id: int, document_id: int) -> bool:
        """
        Delete all files associated with a document (original and translated).

        Args:
            user_id: User ID
            document_id: Document ID

        Returns:
            True if deletion was successful
        """
        prefix = f"{user_id}/{document_id}/"

        try:
            # List all objects with this prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )

            if 'Contents' not in response:
                logger.info(f"No files found for document {document_id}")
                return True

            # Delete all objects
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]

            self.s3_client.delete_objects(
                Bucket=self.bucket_name,
                Delete={'Objects': objects_to_delete}
            )

            logger.info(f"Successfully deleted all files for document {document_id}")
            return True

        except ClientError as e:
            logger.error(f"Error deleting document files from S3: {e}")
            raise

# Global instance
s3_storage = None

def get_s3_storage() -> S3Storage:
    """
    Get or create the global S3Storage instance.

    Returns:
        S3Storage instance
    """
    global s3_storage
    if s3_storage is None:
        s3_storage = S3Storage()
    return s3_storage
