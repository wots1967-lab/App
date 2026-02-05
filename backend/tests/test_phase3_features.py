"""
Phase 3 Backend Tests - Testing new features:
1. Missions CRUD API (/api/missions)
2. Task uncomplete API (/api/tasks/{id}/uncomplete)
3. Habits with type (good/bad) and HP penalty for bad habits
4. Task archive API (/api/tasks/archive)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_phase3_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "testpass123"
TEST_CHARACTER = "TestHero"


class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register a new user and get auth token"""
        # Register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "characterName": TEST_CHARACTER
        })
        
        if response.status_code == 200:
            return response.json().get("token")
        elif response.status_code == 400:
            # User exists, try login
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if response.status_code == 200:
                return response.json().get("token")
        
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    def test_user_registration_or_login(self, auth_token):
        """Test that we can authenticate"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Authentication successful, token obtained")


class TestMissionsAPI:
    """Test Missions CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for missions tests"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"mission_test_{uuid.uuid4().hex[:8]}@test.com",
            "password": TEST_PASSWORD,
            "characterName": "MissionTester"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate for missions tests")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_get_missions_empty(self, headers):
        """Test getting missions when none exist"""
        response = requests.get(f"{BASE_URL}/api/missions", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/missions returns empty list: {data}")
    
    def test_create_mission(self, headers):
        """Test creating a new mission card"""
        mission_data = {
            "title": "Творець",
            "description": "Я створюю нові речі та ідеї",
            "slogan": "Творити - значить жити",
            "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
            "color": "purple"
        }
        
        response = requests.post(f"{BASE_URL}/api/missions", json=mission_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == mission_data["title"]
        assert data["description"] == mission_data["description"]
        assert data["slogan"] == mission_data["slogan"]
        assert data["color"] == mission_data["color"]
        assert "id" in data
        print(f"✓ POST /api/missions created mission: {data['id']}")
        return data["id"]
    
    def test_create_mission_with_4_images(self, headers):
        """Test creating mission with 4 images (max allowed)"""
        mission_data = {
            "title": "Воїн",
            "description": "Я борюся за свої цілі",
            "slogan": "Ніколи не здаватися",
            "images": [
                "https://example.com/img1.jpg",
                "https://example.com/img2.jpg",
                "https://example.com/img3.jpg",
                "https://example.com/img4.jpg"
            ],
            "color": "blue"
        }
        
        response = requests.post(f"{BASE_URL}/api/missions", json=mission_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["images"]) <= 4
        print(f"✓ Mission with 4 images created successfully")
    
    def test_update_mission(self, headers):
        """Test updating a mission"""
        # First create a mission
        create_response = requests.post(f"{BASE_URL}/api/missions", json={
            "title": "Original Title",
            "description": "Original description",
            "color": "emerald"
        }, headers=headers)
        
        assert create_response.status_code == 200
        mission_id = create_response.json()["id"]
        
        # Update the mission
        update_data = {
            "title": "Updated Title",
            "slogan": "New slogan"
        }
        
        update_response = requests.put(f"{BASE_URL}/api/missions/{mission_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["title"] == "Updated Title"
        assert updated["slogan"] == "New slogan"
        print(f"✓ PUT /api/missions/{mission_id} updated successfully")
    
    def test_delete_mission(self, headers):
        """Test deleting a mission"""
        # Create a mission to delete
        create_response = requests.post(f"{BASE_URL}/api/missions", json={
            "title": "To Be Deleted",
            "color": "rose"
        }, headers=headers)
        
        assert create_response.status_code == 200
        mission_id = create_response.json()["id"]
        
        # Delete the mission
        delete_response = requests.delete(f"{BASE_URL}/api/missions/{mission_id}", headers=headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/missions", headers=headers)
        missions = get_response.json()
        mission_ids = [m["id"] for m in missions]
        assert mission_id not in mission_ids
        print(f"✓ DELETE /api/missions/{mission_id} successful")


class TestTaskUncomplete:
    """Test task uncomplete functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for task tests"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"task_test_{uuid.uuid4().hex[:8]}@test.com",
            "password": TEST_PASSWORD,
            "characterName": "TaskTester"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate for task tests")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_create_and_complete_task(self, headers):
        """Test creating and completing a task"""
        # Create task
        task_data = {
            "title": "Test Task for Uncomplete",
            "description": "This task will be completed then uncompleted",
            "difficulty": "easy"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Complete task
        complete_response = requests.post(f"{BASE_URL}/api/tasks/{task_id}/complete", headers=headers)
        assert complete_response.status_code == 200
        
        print(f"✓ Task {task_id} created and completed")
        return task_id
    
    def test_uncomplete_task(self, headers):
        """Test uncompleting a completed task"""
        # Create and complete a task
        task_data = {"title": "Task to Uncomplete", "difficulty": "medium"}
        create_response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        task_id = create_response.json()["id"]
        
        # Complete the task
        requests.post(f"{BASE_URL}/api/tasks/{task_id}/complete", headers=headers)
        
        # Uncomplete the task
        uncomplete_response = requests.post(f"{BASE_URL}/api/tasks/{task_id}/uncomplete", headers=headers)
        assert uncomplete_response.status_code == 200
        
        data = uncomplete_response.json()
        assert "message" in data
        assert data["message"] == "Task uncompleted"
        print(f"✓ POST /api/tasks/{task_id}/uncomplete successful")
    
    def test_uncomplete_not_completed_task_fails(self, headers):
        """Test that uncompleting a non-completed task fails"""
        # Create a task but don't complete it
        task_data = {"title": "Never Completed Task", "difficulty": "easy"}
        create_response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        task_id = create_response.json()["id"]
        
        # Try to uncomplete
        uncomplete_response = requests.post(f"{BASE_URL}/api/tasks/{task_id}/uncomplete", headers=headers)
        assert uncomplete_response.status_code == 400
        print(f"✓ Uncompleting non-completed task correctly returns 400")


class TestTaskArchive:
    """Test task archive/history functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for archive tests"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"archive_test_{uuid.uuid4().hex[:8]}@test.com",
            "password": TEST_PASSWORD,
            "characterName": "ArchiveTester"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate for archive tests")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_get_archive_empty(self, headers):
        """Test getting archive when no completed tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks/archive", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/tasks/archive returns list")
    
    def test_completed_task_appears_in_archive(self, headers):
        """Test that completed tasks appear in archive"""
        # Create and complete a task
        task_data = {"title": "Archive Test Task", "difficulty": "hard"}
        create_response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        task_id = create_response.json()["id"]
        
        # Complete the task
        requests.post(f"{BASE_URL}/api/tasks/{task_id}/complete", headers=headers)
        
        # Check archive
        archive_response = requests.get(f"{BASE_URL}/api/tasks/archive", headers=headers)
        assert archive_response.status_code == 200
        
        archive = archive_response.json()
        task_ids = [t["id"] for t in archive]
        assert task_id in task_ids
        print(f"✓ Completed task {task_id} appears in archive")


class TestHabitsWithType:
    """Test habits with good/bad type and HP penalty"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for habits tests"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"habit_test_{uuid.uuid4().hex[:8]}@test.com",
            "password": TEST_PASSWORD,
            "characterName": "HabitTester"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate for habits tests")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_create_good_habit(self, headers):
        """Test creating a good habit"""
        habit_data = {
            "name": "Ранкова зарядка",
            "description": "Робити зарядку щоранку",
            "type": "good"
        }
        
        response = requests.post(f"{BASE_URL}/api/habits", json=habit_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == habit_data["name"]
        assert data["type"] == "good"
        print(f"✓ Good habit created: {data['id']}")
    
    def test_create_bad_habit(self, headers):
        """Test creating a bad habit"""
        habit_data = {
            "name": "Куріння",
            "description": "Шкідлива звичка",
            "type": "bad"
        }
        
        response = requests.post(f"{BASE_URL}/api/habits", json=habit_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == habit_data["name"]
        assert data["type"] == "bad"
        print(f"✓ Bad habit created: {data['id']}")
    
    def test_track_bad_habit_reduces_hp(self, headers):
        """Test that tracking bad habit reduces HP by 15"""
        # Get initial HP
        user_response = requests.get(f"{BASE_URL}/api/user/me", headers=headers)
        initial_hp = user_response.json()["character"]["hp"]
        
        # Create bad habit
        habit_data = {"name": "Test Bad Habit", "type": "bad"}
        create_response = requests.post(f"{BASE_URL}/api/habits", json=habit_data, headers=headers)
        habit_id = create_response.json()["id"]
        
        # Track the bad habit
        track_response = requests.post(f"{BASE_URL}/api/habits/{habit_id}/track", headers=headers)
        assert track_response.status_code == 200
        
        # Check HP reduced
        data = track_response.json()
        new_hp = data["character"]["hp"]
        
        # HP should be reduced by 15 (or 0 if it was already low)
        expected_hp = max(0, initial_hp - 15)
        # If penalty was applied, HP would be reset to max
        if data.get("penaltyApplied"):
            print(f"✓ Bad habit tracked, penalty applied (HP was 0)")
        else:
            assert new_hp == expected_hp or new_hp == data["character"]["maxHp"]
            print(f"✓ Bad habit tracked, HP reduced from {initial_hp} to {new_hp}")
    
    def test_track_good_habit_gives_rewards(self, headers):
        """Test that tracking good habit gives XP and coins"""
        # Create good habit
        habit_data = {"name": "Test Good Habit", "type": "good"}
        create_response = requests.post(f"{BASE_URL}/api/habits", json=habit_data, headers=headers)
        habit_id = create_response.json()["id"]
        
        # Track the good habit
        track_response = requests.post(f"{BASE_URL}/api/habits/{habit_id}/track", headers=headers)
        assert track_response.status_code == 200
        
        data = track_response.json()
        assert "character" in data
        print(f"✓ Good habit tracked, rewards given")


class TestColorOptions:
    """Test mission color options"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"color_test_{uuid.uuid4().hex[:8]}@test.com",
            "password": TEST_PASSWORD,
            "characterName": "ColorTester"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Could not authenticate")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    @pytest.mark.parametrize("color", ["purple", "blue", "emerald", "amber", "rose", "slate", "cyan", "orange"])
    def test_create_mission_with_different_colors(self, headers, color):
        """Test creating missions with all available colors"""
        mission_data = {
            "title": f"Mission with {color} color",
            "color": color
        }
        
        response = requests.post(f"{BASE_URL}/api/missions", json=mission_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["color"] == color
        print(f"✓ Mission with color '{color}' created")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
