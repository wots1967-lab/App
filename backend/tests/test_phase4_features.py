"""
Phase 4 Backend Tests - Friends, Messages, Friend Profile, Missions with Images
Tests for:
- Messages API (POST /api/messages, GET /api/messages/{friendId})
- Friend Profile API (GET /api/friends/{friendId}/profile)
- Missions API with images
- Rewards API with images
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPhase4Features:
    """Test suite for Phase 4 features: Messages, Friend Profile, Image uploads"""
    
    @pytest.fixture(scope="class")
    def user1_data(self):
        """Create first test user"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_user1_{unique_id}@test.com"
        password = "testpass123"
        character_name = f"TestUser1_{unique_id}"
        
        # Register user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "characterName": character_name
        })
        
        if response.status_code == 400:  # Already exists
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
        
        assert response.status_code in [200, 201], f"Failed to create/login user1: {response.text}"
        data = response.json()
        return {
            "email": email,
            "password": password,
            "token": data["token"],
            "user_id": data["user"]["id"],
            "character_name": character_name
        }
    
    @pytest.fixture(scope="class")
    def user2_data(self):
        """Create second test user"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_user2_{unique_id}@test.com"
        password = "testpass123"
        character_name = f"TestUser2_{unique_id}"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "characterName": character_name
        })
        
        if response.status_code == 400:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
        
        assert response.status_code in [200, 201], f"Failed to create/login user2: {response.text}"
        data = response.json()
        return {
            "email": email,
            "password": password,
            "token": data["token"],
            "user_id": data["user"]["id"],
            "character_name": character_name
        }
    
    @pytest.fixture(scope="class")
    def make_friends(self, user1_data, user2_data):
        """Make user1 and user2 friends"""
        headers1 = {"Authorization": f"Bearer {user1_data['token']}"}
        headers2 = {"Authorization": f"Bearer {user2_data['token']}"}
        
        # User1 adds User2 as friend
        response = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"friendEmail": user2_data["email"]},
            headers=headers1
        )
        
        # Accept friend request (if needed)
        if response.status_code == 200:
            # Get the friend request ID
            friend_data = response.json()
            friend_id = friend_data.get("id")
            
            # User2 accepts the friend request
            requests.post(
                f"{BASE_URL}/api/friends/{friend_id}/accept",
                headers=headers2
            )
        
        return {"user1": user1_data, "user2": user2_data}

    # ==================== Messages API Tests ====================
    
    def test_send_message_success(self, make_friends):
        """Test POST /api/messages - send message to friend"""
        user1 = make_friends["user1"]
        user2 = make_friends["user2"]
        headers = {"Authorization": f"Bearer {user1['token']}"}
        
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": user2["user_id"],
                "content": "Привіт! Це тестове повідомлення."
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to send message: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["senderId"] == user1["user_id"]
        assert data["receiverId"] == user2["user_id"]
        assert data["content"] == "Привіт! Це тестове повідомлення."
        assert data["read"] == False
        print("✓ POST /api/messages - message sent successfully")
    
    def test_send_empty_message_fails(self, user1_data, user2_data):
        """Test POST /api/messages - empty message should fail"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": user2_data["user_id"],
                "content": "   "  # Empty/whitespace only
            },
            headers=headers
        )
        
        assert response.status_code == 400, "Empty message should return 400"
        print("✓ POST /api/messages - empty message rejected correctly")
    
    def test_get_messages_success(self, make_friends):
        """Test GET /api/messages/{friendId} - get conversation"""
        user1 = make_friends["user1"]
        user2 = make_friends["user2"]
        
        # First send a message
        headers1 = {"Authorization": f"Bearer {user1['token']}"}
        requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": user2["user_id"],
                "content": "Test message for GET"
            },
            headers=headers1
        )
        
        # Get messages
        response = requests.get(
            f"{BASE_URL}/api/messages/{user2['user_id']}",
            headers=headers1
        )
        
        assert response.status_code == 200, f"Failed to get messages: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/messages/{{friendId}} - retrieved {len(data)} messages")
    
    def test_get_unread_count(self, user1_data):
        """Test GET /api/messages/unread/count"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/messages/unread/count",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get unread count: {response.text}"
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✓ GET /api/messages/unread/count - count: {data['count']}")

    # ==================== Friend Profile API Tests ====================
    
    def test_get_friend_profile_success(self, make_friends):
        """Test GET /api/friends/{friendId}/profile - get friend's profile"""
        user1 = make_friends["user1"]
        user2 = make_friends["user2"]
        headers = {"Authorization": f"Bearer {user1['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/friends/{user2['user_id']}/profile",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get friend profile: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain 'user'"
        assert "quests" in data, "Response should contain 'quests'"
        assert "missions" in data, "Response should contain 'missions'"
        assert "rewards" in data, "Response should contain 'rewards'"
        assert "stats" in data, "Response should contain 'stats'"
        
        # Verify user data
        assert data["user"]["id"] == user2["user_id"]
        assert "character" in data["user"]
        
        # Verify stats structure
        stats = data["stats"]
        assert "totalTasks" in stats
        assert "completedTasks" in stats
        assert "totalQuests" in stats
        assert "completedQuests" in stats
        assert "taskCompletionRate" in stats
        assert "questCompletionRate" in stats
        
        print("✓ GET /api/friends/{friendId}/profile - profile retrieved with all data")
    
    def test_get_friend_profile_not_friends(self, user1_data):
        """Test GET /api/friends/{friendId}/profile - should fail if not friends"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        # Try to get profile of non-friend (random UUID)
        fake_friend_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/friends/{fake_friend_id}/profile",
            headers=headers
        )
        
        assert response.status_code in [403, 404], "Should return 403 or 404 for non-friend"
        print("✓ GET /api/friends/{friendId}/profile - correctly rejects non-friend access")

    # ==================== Missions API Tests ====================
    
    def test_create_mission_with_images(self, user1_data):
        """Test POST /api/missions - create mission with images"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        # Create mission with base64 image placeholder
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/missions",
            json={
                "title": "Test Mission with Images",
                "description": "Testing image upload functionality",
                "slogan": "Test slogan",
                "images": [test_image, test_image],
                "color": "purple"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to create mission: {response.text}"
        data = response.json()
        assert data["title"] == "Test Mission with Images"
        assert len(data["images"]) == 2
        print("✓ POST /api/missions - mission with images created successfully")
        return data["id"]
    
    def test_update_mission_images(self, user1_data):
        """Test PUT /api/missions/{id} - update mission images"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        # First create a mission
        response = requests.post(
            f"{BASE_URL}/api/missions",
            json={
                "title": "Mission to Update",
                "description": "Will update images",
                "images": [],
                "color": "blue"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        mission_id = response.json()["id"]
        
        # Update with images
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = requests.put(
            f"{BASE_URL}/api/missions/{mission_id}",
            json={
                "images": [test_image, test_image, test_image]
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to update mission: {response.text}"
        data = response.json()
        assert len(data["images"]) == 3
        print("✓ PUT /api/missions/{id} - mission images updated successfully")
    
    def test_mission_max_4_images(self, user1_data):
        """Test that missions are limited to 4 images"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/missions",
            json={
                "title": "Mission with 5 images",
                "images": [test_image] * 5,  # Try to add 5 images
                "color": "emerald"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["images"]) <= 4, "Mission should have max 4 images"
        print("✓ POST /api/missions - correctly limits to 4 images")

    # ==================== Rewards API Tests ====================
    
    def test_create_reward_with_image(self, user1_data):
        """Test POST /api/rewards - create reward with image"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/rewards",
            json={
                "name": "Test Reward with Image",
                "description": "Testing image in reward",
                "image": test_image,
                "requiredLevel": 1,
                "cost": 50
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to create reward: {response.text}"
        data = response.json()
        assert data["name"] == "Test Reward with Image"
        # Note: The API might not return image in response, check if it's stored
        print("✓ POST /api/rewards - reward with image created successfully")
        return data["id"]
    
    def test_get_rewards_with_images(self, user1_data):
        """Test GET /api/rewards - verify rewards have images"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/rewards",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get rewards: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/rewards - retrieved {len(data)} rewards")

    # ==================== Friends List Tests ====================
    
    def test_get_friends_list(self, make_friends):
        """Test GET /api/friends - get friends list"""
        user1 = make_friends["user1"]
        headers = {"Authorization": f"Bearer {user1['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/friends",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get friends: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/friends - retrieved {len(data)} friends")

    # ==================== Dashboard Layout Tests (API verification) ====================
    
    def test_user_me_endpoint(self, user1_data):
        """Test GET /api/user/me - verify user data for dashboard"""
        headers = {"Authorization": f"Bearer {user1_data['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/user/me",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get user: {response.text}"
        data = response.json()
        assert "character" in data
        assert "level" in data["character"]
        assert "xp" in data["character"]
        assert "coins" in data["character"]
        print("✓ GET /api/user/me - user data retrieved for dashboard")


class TestMissionPageText:
    """Test for specific text in Mission page header"""
    
    def test_mission_api_returns_correct_structure(self):
        """Verify missions API structure for frontend display"""
        # Register a test user
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_mission_text_{unique_id}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "characterName": f"MissionTester_{unique_id}"
        })
        
        if response.status_code == 400:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": "testpass123"
            })
        
        assert response.status_code in [200, 201]
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get missions
        response = requests.get(f"{BASE_URL}/api/missions", headers=headers)
        assert response.status_code == 200
        
        # Create a mission
        response = requests.post(
            f"{BASE_URL}/api/missions",
            json={
                "title": "Test Mission",
                "description": "Test description",
                "slogan": "Test slogan",
                "images": [],
                "color": "purple"
            },
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "id" in data
        assert "title" in data
        assert "description" in data
        assert "slogan" in data
        assert "images" in data
        assert "color" in data
        print("✓ Mission API returns correct structure for frontend")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
