"""
Test Quest Invitation Features - Phase 7
Tests for:
- POST /api/quests/{id}/invite - invite friend to quest
- GET /api/quests/invitations - get pending invitations
- POST /api/quests/invitations/{id}/accept - accept invitation
- POST /api/quests/invitations/{id}/decline - decline invitation
- Quest model fields: isShared, ownerId, originalQuestId
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestQuestInvitations:
    """Quest invitation system tests"""
    
    @pytest.fixture(scope="class")
    def user1(self):
        """Create first test user (quest owner)"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"quest_owner_{unique_id}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "characterName": f"QuestOwner_{unique_id}"
        })
        assert response.status_code == 200, f"Failed to register user1: {response.text}"
        data = response.json()
        return {
            "id": data["user"]["id"],
            "email": email,
            "token": data["token"],
            "name": data["user"]["character"]["name"]
        }
    
    @pytest.fixture(scope="class")
    def user2(self):
        """Create second test user (friend to invite)"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"quest_friend_{unique_id}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "characterName": f"QuestFriend_{unique_id}"
        })
        assert response.status_code == 200, f"Failed to register user2: {response.text}"
        data = response.json()
        return {
            "id": data["user"]["id"],
            "email": email,
            "token": data["token"],
            "name": data["user"]["character"]["name"]
        }
    
    @pytest.fixture(scope="class")
    def friendship(self, user1, user2):
        """Create friendship between user1 and user2"""
        # User1 adds User2 as friend
        response = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"friendEmail": user2["email"]},
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 200, f"Failed to add friend: {response.text}"
        friend_record = response.json()
        
        # User2 accepts friend request
        response = requests.post(
            f"{BASE_URL}/api/friends/{friend_record['id']}/accept",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        assert response.status_code == 200, f"Failed to accept friend: {response.text}"
        
        return friend_record
    
    @pytest.fixture(scope="class")
    def quest(self, user1):
        """Create a quest for user1"""
        response = requests.post(
            f"{BASE_URL}/api/quests",
            json={
                "title": "Test Quest for Invitation",
                "description": "A quest to test invitation system",
                "difficulty": "medium",
                "reward": "100 XP",
                "steps": [
                    {"title": "Step 1: Start"},
                    {"title": "Step 2: Progress"},
                    {"title": "Step 3: Complete"}
                ]
            },
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 200, f"Failed to create quest: {response.text}"
        return response.json()
    
    def test_invite_friend_to_quest(self, user1, user2, friendship, quest):
        """Test POST /api/quests/{id}/invite - invite friend to quest"""
        response = requests.post(
            f"{BASE_URL}/api/quests/{quest['id']}/invite",
            json={"friendId": user2["id"]},
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        
        assert response.status_code == 200, f"Failed to invite friend: {response.text}"
        data = response.json()
        assert "message" in data
        assert user2["name"] in data["message"]
        print(f"✓ Invitation sent successfully: {data['message']}")
    
    def test_invite_already_invited_returns_400(self, user1, user2, friendship, quest):
        """Test that inviting same friend twice returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/quests/{quest['id']}/invite",
            json={"friendId": user2["id"]},
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "Already invited" in data.get("detail", "")
        print("✓ Duplicate invitation correctly returns 400")
    
    def test_get_invitations_for_user(self, user2):
        """Test GET /api/quests/invitations - get pending invitations"""
        response = requests.get(
            f"{BASE_URL}/api/quests/invitations",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        assert response.status_code == 200, f"Failed to get invitations: {response.text}"
        invitations = response.json()
        assert isinstance(invitations, list)
        assert len(invitations) >= 1
        
        # Check invitation structure
        invitation = invitations[0]
        assert "id" in invitation
        assert "questId" in invitation
        assert "questTitle" in invitation
        assert "fromUserId" in invitation
        assert "fromUserName" in invitation
        assert "toUserId" in invitation
        assert invitation["status"] == "pending"
        
        print(f"✓ Found {len(invitations)} pending invitation(s)")
        return invitation
    
    def test_accept_invitation(self, user1, user2, quest):
        """Test POST /api/quests/invitations/{id}/accept - accept invitation"""
        # First get the invitation
        response = requests.get(
            f"{BASE_URL}/api/quests/invitations",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        invitations = response.json()
        invitation = next((i for i in invitations if i["questId"] == quest["id"]), None)
        assert invitation is not None, "Invitation not found"
        
        # Accept the invitation
        response = requests.post(
            f"{BASE_URL}/api/quests/invitations/{invitation['id']}/accept",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        assert response.status_code == 200, f"Failed to accept invitation: {response.text}"
        data = response.json()
        assert "message" in data
        assert "quest" in data
        
        # Verify the new quest has isShared=True
        new_quest = data["quest"]
        assert new_quest["isShared"] == True, "Quest should be marked as shared"
        assert new_quest["ownerId"] == user1["id"], "ownerId should be original owner"
        assert new_quest["originalQuestId"] == quest["id"], "originalQuestId should reference original"
        assert new_quest["userId"] == user2["id"], "userId should be the accepting user"
        
        print(f"✓ Invitation accepted, quest copied with isShared=True")
        return new_quest
    
    def test_accepted_quest_appears_in_user_quests(self, user2, quest):
        """Test that accepted quest appears in user's quest list"""
        response = requests.get(
            f"{BASE_URL}/api/quests",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        assert response.status_code == 200
        quests = response.json()
        
        # Find the shared quest
        shared_quest = next((q for q in quests if q.get("originalQuestId") == quest["id"]), None)
        assert shared_quest is not None, "Shared quest not found in user's quests"
        assert shared_quest["isShared"] == True
        assert shared_quest["title"] == quest["title"]
        
        print(f"✓ Shared quest appears in user's quest list")
    
    def test_decline_invitation(self, user1, user2):
        """Test POST /api/quests/invitations/{id}/decline - decline invitation"""
        # Create a new quest to invite
        response = requests.post(
            f"{BASE_URL}/api/quests",
            json={
                "title": "Quest to Decline",
                "description": "This invitation will be declined",
                "difficulty": "easy",
                "reward": "50 XP",
                "steps": [{"title": "Step 1"}]
            },
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        new_quest = response.json()
        
        # Invite user2
        response = requests.post(
            f"{BASE_URL}/api/quests/{new_quest['id']}/invite",
            json={"friendId": user2["id"]},
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        assert response.status_code == 200
        
        # Get the invitation
        response = requests.get(
            f"{BASE_URL}/api/quests/invitations",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        invitations = response.json()
        invitation = next((i for i in invitations if i["questId"] == new_quest["id"]), None)
        assert invitation is not None
        
        # Decline the invitation
        response = requests.post(
            f"{BASE_URL}/api/quests/invitations/{invitation['id']}/decline",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        assert response.status_code == 200, f"Failed to decline: {response.text}"
        data = response.json()
        assert "message" in data
        
        print("✓ Invitation declined successfully")
    
    def test_declined_invitation_not_in_pending(self, user2):
        """Test that declined invitation is not in pending list"""
        response = requests.get(
            f"{BASE_URL}/api/quests/invitations",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        invitations = response.json()
        declined = [i for i in invitations if i.get("questTitle") == "Quest to Decline"]
        assert len(declined) == 0, "Declined invitation should not appear in pending"
        
        print("✓ Declined invitation not in pending list")
    
    def test_invite_nonexistent_quest_returns_404(self, user1, user2, friendship):
        """Test inviting to nonexistent quest returns 404"""
        fake_quest_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/quests/{fake_quest_id}/invite",
            json={"friendId": user2["id"]},
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        
        assert response.status_code == 404
        print("✓ Nonexistent quest returns 404")
    
    def test_invite_nonexistent_friend_returns_404(self, user1, quest):
        """Test inviting nonexistent friend returns 404"""
        fake_friend_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/quests/{quest['id']}/invite",
            json={"friendId": fake_friend_id},
            headers={"Authorization": f"Bearer {user1['token']}"}
        )
        
        assert response.status_code == 404
        print("✓ Nonexistent friend returns 404")
    
    def test_accept_nonexistent_invitation_returns_404(self, user2):
        """Test accepting nonexistent invitation returns 404"""
        fake_invitation_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/quests/invitations/{fake_invitation_id}/accept",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        assert response.status_code == 404
        print("✓ Nonexistent invitation returns 404")
    
    def test_decline_nonexistent_invitation_returns_404(self, user2):
        """Test declining nonexistent invitation returns 404"""
        fake_invitation_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/quests/invitations/{fake_invitation_id}/decline",
            headers={"Authorization": f"Bearer {user2['token']}"}
        )
        
        assert response.status_code == 404
        print("✓ Decline nonexistent invitation returns 404")


class TestQuestModelFields:
    """Test Quest model fields: isShared, ownerId, originalQuestId"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create test user"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"quest_model_test_{unique_id}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "characterName": f"ModelTest_{unique_id}"
        })
        assert response.status_code == 200
        data = response.json()
        return {"token": data["token"], "id": data["user"]["id"]}
    
    def test_new_quest_has_default_shared_fields(self, test_user):
        """Test that new quest has isShared=False by default"""
        response = requests.post(
            f"{BASE_URL}/api/quests",
            json={
                "title": "Regular Quest",
                "description": "Not shared",
                "difficulty": "easy",
                "reward": "Test",
                "steps": [{"title": "Step 1"}]
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
        
        assert response.status_code == 200
        quest = response.json()
        
        # Check default values
        assert quest.get("isShared") == False, "New quest should have isShared=False"
        assert quest.get("ownerId") is None, "New quest should have ownerId=None"
        assert quest.get("originalQuestId") is None, "New quest should have originalQuestId=None"
        
        print("✓ New quest has correct default shared fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
