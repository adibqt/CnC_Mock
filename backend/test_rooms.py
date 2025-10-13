import asyncio
from services.livekit_service import livekit_service

async def test_room():
    try:
        # List all rooms
        async with __import__('aiohttp').ClientSession() as session:
            from livekit.api import room_service
            room_client = room_service.RoomService(
                session,
                livekit_service.livekit_url,
                livekit_service.api_key,
                livekit_service.api_secret
            )
            rooms = await room_client.list_rooms(room_service.ListRoomsRequest())
            
            print(f"\n{'='*60}")
            print("ALL ACTIVE ROOMS ON LIVEKIT SERVER:")
            print(f"{'='*60}")
            
            if rooms.rooms:
                for room in rooms.rooms:
                    print(f"\n📍 Room: {room.name}")
                    print(f"   Participants: {room.num_participants}")
                    print(f"   Created: {room.creation_time}")
                    print(f"   Max Participants: {room.max_participants}")
            else:
                print("\n⚠️  No active rooms found!")
                print("   This means no one is currently connected to any video calls.")
            
            print(f"\n{'='*60}\n")
            
    except Exception as e:
        print(f"\n❌ Error listing rooms: {e}\n")

if __name__ == "__main__":
    asyncio.run(test_room())
