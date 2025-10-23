"""
LiveKit service for generating access tokens and managing video rooms
"""
import os
from datetime import timedelta
import logging
import aiohttp
import time
from jose import jwt

# Import LiveKit Server SDK components
from livekit.api import AccessToken, VideoGrants

logger = logging.getLogger(__name__)

class LiveKitService:
    def __init__(self):
        # Import here to avoid circular dependencies
        from config import settings
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.livekit_url = settings.LIVEKIT_URL
        
        # We'll use HTTP API directly for room management instead of RoomServiceClient
        logger.info(f"LiveKit Service initialized with URL: {self.livekit_url}")
        self.room_service = None  # Not needed, we'll use HTTP API directly
        
    def generate_access_token(self, room_name: str, participant_identity: str, participant_name: str = None):
        """
        Generate access token for a participant to join a room
        """
        try:
            print(f"\n🎫 GENERATING TOKEN:")
            print(f"   Room: {room_name}")
            print(f"   Identity: {participant_identity}")
            print(f"   Name: {participant_name}")
            
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
            
            print(f"   ✅ Token generated successfully")
            
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
        Get information about a LiveKit room using HTTP API
        """
        print(f"\n🔍 GET_ROOM_INFO CALLED for: {room_name}")
        try:
            # Prepare API request
            api_url = self.livekit_url.replace('wss://', 'https://').replace('ws://', 'http://')
            print(f"   API URL: {api_url}")
            
            # Create JWT token for API authorization
            now = int(time.time())
            payload = {
                'iss': self.api_key,
                'sub': self.api_key,
                'iat': now,
                'exp': now + 3600,
                'video': {'roomList': True}
            }
            
            token = jwt.encode(payload, self.api_secret, algorithm='HS256')
            print(f"   Token created: {token[:50]}...")
            
            # Make HTTP request to list rooms (LiveKit API uses POST, not GET)
            logger.info(f"🔗 Calling LiveKit API for room: {room_name}")
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f'{api_url}/twirp/livekit.RoomService/ListRooms',
                    headers={
                        'Authorization': f'Bearer {token}',
                        'Content-Type': 'application/json'
                    },
                    json={},  # Empty body for ListRooms
                    timeout=aiohttp.ClientTimeout(total=5.0)
                ) as response:
                    logger.info(f"📡 LiveKit API response status: {response.status}")
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"📦 LiveKit API data: {data}")
                        rooms = data.get('rooms', [])
                        logger.info(f"🏠 Found {len(rooms)} rooms total")
                        
                        # Find the specified room
                        for room in rooms:
                            if room.get('name') == room_name:
                                # LiveKit API returns 'num_participants' (snake_case), not 'numParticipants' (camelCase)
                                num_participants = room.get('num_participants', 0)
                                num_publishers = room.get('num_publishers', 0)
                                print(f"\n📦 ROOM FOUND: {room_name}")
                                print(f"   Participants: {num_participants}, Publishers: {num_publishers}")
                                logger.info(f"✅ Room {room_name} found with {num_participants} participants ({num_publishers} publishers)")
                                return {
                                    'name': room_name,
                                    'num_participants': num_participants,
                                    'num_publishers': num_publishers,
                                    'is_active': True
                                }
                        
                        # Room not found
                        logger.info(f"Room {room_name} not found (inactive)")
                        return {
                            'name': room_name,
                            'num_participants': 0,
                            'is_active': False
                        }
                    else:
                        text = await response.text()
                        logger.error(f"LiveKit API error: {response.status} - {text}")
                        return {
                            'name': room_name,
                            'num_participants': 0,
                            'is_active': False
                        }
                    
        except Exception as e:
            logger.error(f"Error getting room info for {room_name}: {str(e)}")
            return {
                'name': room_name,
                'num_participants': 0,
                'is_active': False
            }

# Global instance
livekit_service = LiveKitService()