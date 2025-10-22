"""
LiveKit service for generating access tokens and managing video rooms
"""
import os
from datetime import timedelta
import logging

# Import LiveKit Server SDK components
from livekit.api import AccessToken, VideoGrants, RoomServiceClient

logger = logging.getLogger(__name__)

class LiveKitService:
    def __init__(self):
        # Import here to avoid circular dependencies
        from config import settings
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.livekit_url = settings.LIVEKIT_URL
        
        # Initialize RoomServiceClient for room management
        try:
            self.room_service = RoomServiceClient(
                self.livekit_url,
                self.api_key,
                self.api_secret
            )
        except Exception as e:
            logger.warning(f"Could not initialize RoomServiceClient: {e}")
            self.room_service = None
        
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
        Note: Rooms are created automatically when first participant joins
        """
        logger.info(f"Room creation requested for {room_name} - will be auto-created on first join")
        return {
            'room_name': room_name,
            'creation_time': None,
            'max_participants': max_participants,
            'note': 'Room will be created automatically when first participant joins'
        }
    
    async def end_room(self, room_name: str):
        """
        End a LiveKit room session
        Note: Rooms are automatically cleaned up when empty
        """
        logger.info(f"Room end requested for {room_name} - will be auto-cleaned when empty")
        return {'message': f'Room {room_name} will end automatically when all participants leave'}
    
    async def get_room_info(self, room_name: str):
        """
        Get information about a LiveKit room
        """
        if not self.room_service:
            logger.warning("RoomServiceClient not available, returning default inactive status")
            return {
                'name': room_name,
                'num_participants': 0,
                'is_active': False
            }
        
        try:
            # List rooms and find the specified room
            rooms = await self.room_service.list_rooms()
            
            for room in rooms:
                if room.name == room_name:
                    logger.info(f"Room {room_name} found with {room.num_participants} participants")
                    return {
                        'name': room.name,
                        'num_participants': room.num_participants,
                        'is_active': True,
                        'creation_time': room.creation_time,
                        'max_participants': room.max_participants
                    }
            
            # Room not found means it's not active
            logger.info(f"Room {room_name} not found (inactive)")
            return {
                'name': room_name,
                'num_participants': 0,
                'is_active': False
            }
            
        except Exception as e:
            logger.error(f"Error getting room info for {room_name}: {str(e)}")
            # Return inactive status on error
            return {
                'name': room_name,
                'num_participants': 0,
                'is_active': False
            }

# Global instance
livekit_service = LiveKitService()