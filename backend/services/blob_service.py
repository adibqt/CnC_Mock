"""
Vercel Blob Storage Service
Handles all file uploads to Vercel Blob Storage
"""
import os
from typing import Optional
import aiohttp
import uuid
from pathlib import Path

class VercelBlobService:
    def __init__(self):
        # Vercel Blob token from environment
        self.blob_token = os.getenv('BLOB_READ_WRITE_TOKEN', '')
        self.base_url = "https://blob.vercel-storage.com"
        
        # Use Vercel Blob if token is available (works on any platform)
        self.use_blob_storage = bool(self.blob_token)
        
        # Log configuration
        if self.use_blob_storage:
            print("✅ Vercel Blob Storage enabled - files will be stored in cloud")
        else:
            print("⚠️  Vercel Blob Storage disabled - using local storage (files will be lost on redeployment)")
        
        # Fallback to local storage for development
        self.local_upload_dir = Path("uploads")
        if not self.use_blob_storage:
            self.local_upload_dir.mkdir(exist_ok=True)
    
    async def upload_file(
        self, 
        file_content: bytes, 
        filename: str, 
        folder: str = "",
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a file to Vercel Blob Storage or local storage
        
        Args:
            file_content: The file bytes
            filename: Original filename
            folder: Optional folder/prefix (e.g., 'profile_pictures', 'certificates/mbbs')
            content_type: MIME type of the file
            
        Returns:
            URL of the uploaded file
        """
        # Generate unique filename
        file_extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        if folder:
            blob_path = f"{folder}/{unique_filename}"
        else:
            blob_path = unique_filename
        
        if self.use_blob_storage:
            # Upload to Vercel Blob
            return await self._upload_to_vercel_blob(
                file_content, 
                blob_path, 
                content_type
            )
        else:
            # Fallback to local storage for development
            return self._save_local(file_content, blob_path)
    
    async def _upload_to_vercel_blob(
        self, 
        file_content: bytes, 
        path: str, 
        content_type: str
    ) -> str:
        """Upload file to Vercel Blob Storage"""
        url = f"{self.base_url}/{path}"
        
        headers = {
            "Authorization": f"Bearer {self.blob_token}",
            "Content-Type": content_type,
            "x-vercel-blob-add": "true"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.put(url, data=file_content, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('url', url)
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to upload to Vercel Blob: {error_text}")
    
    def _save_local(self, file_content: bytes, path: str) -> str:
        """Save file locally for development"""
        file_path = self.local_upload_dir / path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return f"/uploads/{path}"
    
    async def delete_file(self, url: str) -> bool:
        """
        Delete a file from Vercel Blob Storage
        
        Args:
            url: The blob URL to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self.use_blob_storage:
            # For local files, just return True
            # You could implement local file deletion here
            return True
        
        try:
            headers = {
                "Authorization": f"Bearer {self.blob_token}"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, headers=headers) as response:
                    return response.status == 200
        except Exception as e:
            print(f"Error deleting blob: {e}")
            return False

# Global instance
blob_service = VercelBlobService()
