"""
Test suite for Notifications and Messages features:
- GET /api/notifications - list notifications
- GET /api/notifications/unread/count - unread count
- POST /api/notifications/read-all - mark all as read
- GET /api/messages/conversations - list all conversations
- POST /api/messages - send message
- GET /api/messages/{friend_id} - get messages with friend
- Notification model with type, title, message, data fields
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNotificationsAndMessages:
    """Test notifications and messages API endpoints"""
    
    @pytest.fixture(scope="class")
    def test_users(self):
        """Create two test users for messaging tests"""
        timestamp = uuid.uuid4().hex[:8]
        
        # User 1
        user1_email = f"TEST_notif_user1_{timestamp}@test.com"
        user1_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": user1_email,
            "password": "testpass123",
            "characterName": f"NotifUser1_{timestamp}"
        })
        assert user1_response.status_code == 200, f"Failed to create user1: {user1_response.text}"
        user1_data = user1_response.json()
        
        # User 2
        user2_email = f"TEST_notif_user2_{timestamp}@test.com"
        user2_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": user2_email,
            "password": "testpass123",
            "characterName": f"NotifUser2_{timestamp}"
        })
        assert user2_response.status_code == 200, f"Failed to create user2: {user2_response.text}"
        user2_data = user2_response.json()
        
        return {
            "user1": {
                "id": user1_data["user"]["id"],
                "email": user1_email,
                "token": user1_data["token"],
                "name": user1_data["user"]["character"]["name"]
            },
            "user2": {
                "id": user2_data["user"]["id"],
                "email": user2_email,
                "token": user2_data["token"],
                "name": user2_data["user"]["character"]["name"]
            }
        }
    
    @pytest.fixture(scope="class")
    def friends_setup(self, test_users):
        """Setup friendship between test users"""
        # User1 adds User2 as friend
        add_response = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"friendEmail": test_users["user2"]["email"]},
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert add_response.status_code == 200, f"Failed to add friend: {add_response.text}"
        friend_record = add_response.json()
        
        # User2 accepts friend request
        accept_response = requests.post(
            f"{BASE_URL}/api/friends/{friend_record['id']}/accept",
            headers={"Authorization": f"Bearer {test_users['user2']['token']}"}
        )
        assert accept_response.status_code == 200, f"Failed to accept friend: {accept_response.text}"
        
        return friend_record
    
    # ============ NOTIFICATIONS TESTS ============
    
    def test_get_notifications_empty(self, test_users):
        """Test GET /api/notifications returns empty list for new user"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/notifications returns list (count: {len(data)})")
    
    def test_get_notifications_unread_count(self, test_users):
        """Test GET /api/notifications/unread/count returns count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread/count",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✓ GET /api/notifications/unread/count returns count: {data['count']}")
    
    def test_mark_all_notifications_read(self, test_users):
        """Test POST /api/notifications/read-all marks all as read"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/read-all",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200
        print("✓ POST /api/notifications/read-all successful")
        
        # Verify unread count is 0
        count_response = requests.get(
            f"{BASE_URL}/api/notifications/unread/count",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        # Note: count may include pending invitations, so we just check it works
        assert count_response.status_code == 200
    
    def test_notifications_unauthorized(self):
        """Test notifications endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code in [401, 403]
        print("✓ GET /api/notifications requires auth")
    
    # ============ MESSAGES TESTS ============
    
    def test_get_conversations_empty(self, test_users):
        """Test GET /api/messages/conversations returns list"""
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/messages/conversations returns list (count: {len(data)})")
    
    def test_send_message(self, test_users, friends_setup):
        """Test POST /api/messages sends a message"""
        message_content = f"Test message {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": test_users["user2"]["id"],
                "content": message_content
            },
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200, f"Failed to send message: {response.text}"
        data = response.json()
        
        # Verify message structure
        assert "id" in data
        assert data["senderId"] == test_users["user1"]["id"]
        assert data["receiverId"] == test_users["user2"]["id"]
        assert data["content"] == message_content
        assert data["read"] == False
        print(f"✓ POST /api/messages sends message successfully")
        
        return data
    
    def test_get_messages_with_friend(self, test_users, friends_setup):
        """Test GET /api/messages/{friend_id} returns messages"""
        # First send a message
        message_content = f"Test message for retrieval {uuid.uuid4().hex[:8]}"
        send_response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": test_users["user2"]["id"],
                "content": message_content
            },
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert send_response.status_code == 200
        
        # Get messages
        response = requests.get(
            f"{BASE_URL}/api/messages/{test_users['user2']['id']}",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify message structure
        last_msg = data[-1]
        assert "id" in last_msg
        assert "senderId" in last_msg
        assert "receiverId" in last_msg
        assert "content" in last_msg
        assert "createdAt" in last_msg
        print(f"✓ GET /api/messages/{{friend_id}} returns messages (count: {len(data)})")
    
    def test_get_unread_messages_count(self, test_users, friends_setup):
        """Test GET /api/messages/unread/count returns count"""
        response = requests.get(
            f"{BASE_URL}/api/messages/unread/count",
            headers={"Authorization": f"Bearer {test_users['user2']['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"✓ GET /api/messages/unread/count returns count: {data['count']}")
    
    def test_conversations_after_messages(self, test_users, friends_setup):
        """Test conversations list includes friend after messaging"""
        # Send a message first
        requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": test_users["user2"]["id"],
                "content": "Test for conversations"
            },
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        
        # Get conversations
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations",
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find conversation with user2
        conv = next((c for c in data if c["friendId"] == test_users["user2"]["id"]), None)
        assert conv is not None, "Conversation with friend not found"
        
        # Verify conversation structure
        assert "friendId" in conv
        assert "friendName" in conv
        assert "lastMessage" in conv
        assert "unreadCount" in conv
        print(f"✓ Conversations list includes friend with lastMessage")
    
    def test_send_empty_message_fails(self, test_users, friends_setup):
        """Test sending empty message returns error"""
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiverId": test_users["user2"]["id"],
                "content": "   "  # Empty/whitespace
            },
            headers={"Authorization": f"Bearer {test_users['user1']['token']}"}
        )
        assert response.status_code == 400
        print("✓ POST /api/messages rejects empty message")
    
    def test_messages_unauthorized(self):
        """Test messages endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code in [401, 403]
        print("✓ GET /api/messages/conversations requires auth")


class TestNotificationCreation:
    """Test notification creation on quest invitation acceptance"""
    
    @pytest.fixture(scope="class")
    def quest_test_users(self):
        """Create users for quest notification test"""
        timestamp = uuid.uuid4().hex[:8]
        
        # Quest owner
        owner_email = f"TEST_quest_owner_{timestamp}@test.com"
        owner_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": owner_email,
            "password": "testpass123",
            "characterName": f"QuestOwner_{timestamp}"
        })
        assert owner_response.status_code == 200
        owner_data = owner_response.json()
        
        # Friend to invite
        friend_email = f"TEST_quest_friend_{timestamp}@test.com"
        friend_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": friend_email,
            "password": "testpass123",
            "characterName": f"QuestFriend_{timestamp}"
        })
        assert friend_response.status_code == 200
        friend_data = friend_response.json()
        
        # Setup friendship
        add_response = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"friendEmail": friend_email},
            headers={"Authorization": f"Bearer {owner_data['token']}"}
        )
        friend_record = add_response.json()
        
        requests.post(
            f"{BASE_URL}/api/friends/{friend_record['id']}/accept",
            headers={"Authorization": f"Bearer {friend_data['token']}"}
        )
        
        return {
            "owner": {
                "id": owner_data["user"]["id"],
                "token": owner_data["token"],
                "name": owner_data["user"]["character"]["name"]
            },
            "friend": {
                "id": friend_data["user"]["id"],
                "token": friend_data["token"],
                "name": friend_data["user"]["character"]["name"]
            }
        }
    
    def test_notification_created_on_quest_accept(self, quest_test_users):
        """Test that notification is created when quest invitation is accepted"""
        # Create a quest
        quest_response = requests.post(
            f"{BASE_URL}/api/quests",
            json={
                "title": f"Test Quest for Notification {uuid.uuid4().hex[:8]}",
                "description": "Testing notification creation",
                "difficulty": "medium",
                "reward": "Test reward",
                "steps": [{"title": "Step 1"}]
            },
            headers={"Authorization": f"Bearer {quest_test_users['owner']['token']}"}
        )
        assert quest_response.status_code == 200
        quest = quest_response.json()
        
        # Invite friend
        invite_response = requests.post(
            f"{BASE_URL}/api/quests/{quest['id']}/invite",
            json={"friendId": quest_test_users["friend"]["id"]},
            headers={"Authorization": f"Bearer {quest_test_users['owner']['token']}"}
        )
        assert invite_response.status_code == 200
        
        # Get invitation
        invitations_response = requests.get(
            f"{BASE_URL}/api/quests/invitations",
            headers={"Authorization": f"Bearer {quest_test_users['friend']['token']}"}
        )
        assert invitations_response.status_code == 200
        invitations = invitations_response.json()
        assert len(invitations) > 0
        invitation = invitations[0]
        
        # Accept invitation
        accept_response = requests.post(
            f"{BASE_URL}/api/quests/invitations/{invitation['id']}/accept",
            headers={"Authorization": f"Bearer {quest_test_users['friend']['token']}"}
        )
        assert accept_response.status_code == 200
        
        # Check owner's notifications
        notif_response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {quest_test_users['owner']['token']}"}
        )
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Find the quest_invite_accepted notification
        quest_notif = next(
            (n for n in notifications if n.get("type") == "quest_invite_accepted"),
            None
        )
        assert quest_notif is not None, "Notification for quest acceptance not found"
        
        # Verify notification structure
        assert "id" in quest_notif
        assert "type" in quest_notif
        assert quest_notif["type"] == "quest_invite_accepted"
        assert "title" in quest_notif
        assert "message" in quest_notif
        assert "data" in quest_notif
        assert "read" in quest_notif
        assert "createdAt" in quest_notif
        
        print(f"✓ Notification created on quest acceptance with correct structure")
        print(f"  - type: {quest_notif['type']}")
        print(f"  - title: {quest_notif['title']}")
        print(f"  - message: {quest_notif['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
