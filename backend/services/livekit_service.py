"""
LiveKit service for generating access tokens and managing video rooms
"""
import os
from datetime import datetime, timedelta
try:
    # Try new import structure (livekit >= 0.11.0)
    from livekit.api import AccessToken, VideoGrants, RoomServiceClient
except ImportError:
    # Fallback to old import structure (livekit < 0.11.0)
    from livekit import api
    AccessToken = api.AccessToken
    VideoGrants = api.VideoGrants
import logging

logger = logging.getLogger(__name__)

class LiveKitService:
    def __init__(self):
        # Import here to avoid circular dependencies
        from config import settings
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.livekit_url = settings.LIVEKIT_URL
        
    def generate_access_token(self, room_name: str, participant_identity: str, participant_name: str = None):
        """
        Generate access token for a participant to join a room
        """
        try:
            # Create access token
            token = AccessToken(self.api_key, self.api_secret)
            
            # Set token identity and name
            token = token.with_identity(participant_identity)
            if participant_name:
                token = token.with_name(participant_name)
            
            # Grant permissions
            token = token.with_grants(VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True
            ))
            
            # Generate JWT token
            jwt_token = token.to_jwt()
            
            return {
                'token': jwt_token,
                'url': self.livekit_url,
                'room_name': room_name
            }
            
        except Exception as e:
            logger.error(f"Error generating LiveKit token: {str(e)}")
            raise Exception(f"Failed to generate access token: {str(e)}")
    
    async def create_room(self, room_name: str, max_participants: int = 10):
        """
        Create a new LiveKit room
        """
        try:
            # Use RoomServiceClient for room management
            room_client = RoomServiceClient(self.livekit_url, self.api_key, self.api_secret)
            
            # Create room
            room = await room_client.create_room(
                name=room_name,
                max_participants=max_participants
            )
            
            return {
                'room_name': room.name,
                'creation_time': room.creation_time,
                'max_participants': room.max_participants
            }
            
        except Exception as e:
            logger.error(f"Error creating LiveKit room: {str(e)}")
            raise Exception(f"Failed to create room: {str(e)}")
    
    async def end_room(self, room_name: str):
        """
        End a LiveKit room session
        """
        try:
            room_client = RoomServiceClient(self.livekit_url, self.api_key, self.api_secret)
            await room_client.delete_room(room=room_name)
            
            return {'message': f'Room {room_name} ended successfully'}
            
        except Exception as e:
            logger.error(f"Error ending LiveKit room: {str(e)}")
            raise Exception(f"Failed to end room: {str(e)}")
    
    async def get_room_info(self, room_name: str):
        """
        Get information about a LiveKit room
        """
        try:
            room_client = RoomServiceClient(self.livekit_url, self.api_key, self.api_secret)
            rooms = await room_client.list_rooms()
            
            # Find the specific room
            for room in rooms:
                if room.name == room_name:
                    return {
                        'name': room.name,
                        'num_participants': room.num_participants,
                        'creation_time': room.creation_time,
                        'empty_timeout': room.empty_timeout,
                        'max_participants': room.max_participants
                    }
            
            # Room not found - this is normal when no one is in the call
            raise Exception(f"Room {room_name} not found")
            
        except Exception as e:
            # Only log as error if it's not the expected "room not found" scenario
            if "not found" not in str(e).lower():
                logger.error(f"Error getting room info: {str(e)}")
            raise Exception(f"Failed to get room info: {str(e)}")

# Global instance
livekit_service = LiveKitService()