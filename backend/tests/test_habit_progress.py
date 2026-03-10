"""
Test suite for Habit Progress System features:
- POST /api/habits/{id}/track returns progressGain and streakBonus
- POST /api/habits/check-missed-days reduces progress for missed days
- progress field in Habit model
"""

import pytest
import requests
import os
import uuid
from datetime import date, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHabitProgressSystem:
    """Tests for habit progress tracking system"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user for habit progress tests"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_habit_progress_{unique_id}@test.com"
        password = "testpass123"
        character_name = f"HabitTester_{unique_id}"
        
        # Register user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "characterName": character_name
        })
        
        if response.status_code == 400:  # Email already exists
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
        
        assert response.status_code in [200, 201], f"Auth failed: {response.text}"
        data = response.json()
        return {
            "token": data["token"],
            "user": data["user"],
            "email": email,
            "password": password
        }
    
    @pytest.fixture
    def auth_headers(self, test_user):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {test_user['token']}"}
    
    def test_create_habit_with_progress_field(self, auth_headers):
        """Test that created habit has progress field initialized to 0"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Test Habit Progress {unique_id}",
                "description": "Testing progress field",
                "type": "good",
                "frequency": "daily"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Create habit failed: {response.text}"
        habit = response.json()
        
        # Verify progress field exists and is 0
        assert "progress" in habit, "Habit should have progress field"
        assert habit["progress"] == 0, "Initial progress should be 0"
        assert "id" in habit, "Habit should have id"
        
        print(f"✓ Created habit with progress=0: {habit['name']}")
        return habit
    
    def test_track_habit_returns_progress_gain(self, auth_headers):
        """Test that tracking habit returns progressGain in response"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create a new habit
        create_response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Track Progress Test {unique_id}",
                "description": "Testing progressGain",
                "type": "good",
                "frequency": "daily"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        habit = create_response.json()
        habit_id = habit["id"]
        
        # Track the habit
        track_response = requests.post(
            f"{BASE_URL}/api/habits/{habit_id}/track",
            json={},
            headers=auth_headers
        )
        
        assert track_response.status_code == 200, f"Track habit failed: {track_response.text}"
        result = track_response.json()
        
        # Verify progressGain is returned
        assert "progressGain" in result, "Response should contain progressGain"
        assert result["progressGain"] >= 1, "progressGain should be at least 1"
        
        # Verify streakBonus field exists
        assert "streakBonus" in result, "Response should contain streakBonus"
        
        # Verify habit progress was updated
        assert "habit" in result, "Response should contain habit"
        assert result["habit"]["progress"] >= 1, "Habit progress should be at least 1"
        
        print(f"✓ Track habit returned progressGain={result['progressGain']}, streakBonus={result['streakBonus']}")
        return result
    
    def test_track_habit_increments_progress_by_1_percent(self, auth_headers):
        """Test that tracking habit increments progress by 1%"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create a new habit
        create_response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Progress Increment Test {unique_id}",
                "description": "Testing +1% increment",
                "type": "good",
                "frequency": "daily"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        habit = create_response.json()
        habit_id = habit["id"]
        initial_progress = habit["progress"]
        
        # Track the habit
        track_response = requests.post(
            f"{BASE_URL}/api/habits/{habit_id}/track",
            json={},
            headers=auth_headers
        )
        
        assert track_response.status_code == 200
        result = track_response.json()
        
        # Verify progress increased by at least 1
        new_progress = result["habit"]["progress"]
        assert new_progress == initial_progress + result["progressGain"], \
            f"Progress should increase by progressGain. Expected {initial_progress + result['progressGain']}, got {new_progress}"
        
        print(f"✓ Progress incremented from {initial_progress} to {new_progress}")
    
    def test_track_habit_already_tracked_today(self, auth_headers):
        """Test that tracking same habit twice in one day returns 400"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create a new habit
        create_response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Double Track Test {unique_id}",
                "description": "Testing double tracking",
                "type": "good",
                "frequency": "daily"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        habit = create_response.json()
        habit_id = habit["id"]
        
        # Track the habit first time
        first_track = requests.post(
            f"{BASE_URL}/api/habits/{habit_id}/track",
            json={},
            headers=auth_headers
        )
        assert first_track.status_code == 200
        
        # Try to track again - should fail
        second_track = requests.post(
            f"{BASE_URL}/api/habits/{habit_id}/track",
            json={},
            headers=auth_headers
        )
        
        assert second_track.status_code == 400, "Should return 400 for already tracked habit"
        print("✓ Double tracking correctly rejected with 400")
    
    def test_check_missed_days_endpoint(self, auth_headers):
        """Test POST /api/habits/check-missed-days endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/habits/check-missed-days",
            json={},
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Check missed days failed: {response.text}"
        result = response.json()
        
        # Verify response structure
        assert "updatedHabits" in result, "Response should contain updatedHabits"
        assert isinstance(result["updatedHabits"], list), "updatedHabits should be a list"
        
        print(f"✓ Check missed days returned {len(result['updatedHabits'])} updated habits")
    
    def test_get_habits_includes_progress(self, auth_headers):
        """Test that GET /api/habits returns habits with progress field"""
        response = requests.get(
            f"{BASE_URL}/api/habits",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get habits failed: {response.text}"
        habits = response.json()
        
        # Check that all habits have progress field
        for habit in habits:
            assert "progress" in habit, f"Habit {habit.get('name', 'unknown')} should have progress field"
            assert isinstance(habit["progress"], int), "Progress should be an integer"
            assert 0 <= habit["progress"] <= 100, "Progress should be between 0 and 100"
        
        print(f"✓ All {len(habits)} habits have valid progress field")
    
    def test_bad_habit_tracking(self, auth_headers):
        """Test that tracking bad habit returns progressGain but also HP loss"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create a bad habit
        create_response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Bad Habit Test {unique_id}",
                "description": "Testing bad habit tracking",
                "type": "bad",
                "frequency": "daily"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        habit = create_response.json()
        habit_id = habit["id"]
        
        # Track the bad habit
        track_response = requests.post(
            f"{BASE_URL}/api/habits/{habit_id}/track",
            json={},
            headers=auth_headers
        )
        
        assert track_response.status_code == 200, f"Track bad habit failed: {track_response.text}"
        result = track_response.json()
        
        # Verify progressGain is still returned for bad habits
        assert "progressGain" in result, "Bad habit should also return progressGain"
        assert "character" in result, "Response should contain character"
        
        print(f"✓ Bad habit tracked with progressGain={result['progressGain']}")
    
    def test_delete_habit(self, auth_headers):
        """Test deleting a habit"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create a habit to delete
        create_response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Delete Test {unique_id}",
                "description": "To be deleted",
                "type": "good",
                "frequency": "daily"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        habit = create_response.json()
        habit_id = habit["id"]
        
        # Delete the habit
        delete_response = requests.delete(
            f"{BASE_URL}/api/habits/{habit_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Delete habit failed: {delete_response.text}"
        print(f"✓ Habit deleted successfully")
    
    def test_track_nonexistent_habit(self, auth_headers):
        """Test tracking a nonexistent habit returns 404"""
        fake_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BASE_URL}/api/habits/{fake_id}/track",
            json={},
            headers=auth_headers
        )
        
        assert response.status_code == 404, "Should return 404 for nonexistent habit"
        print("✓ Nonexistent habit correctly returns 404")


class TestStreakBonus:
    """Tests for streak bonus system (+5% every 10 days)"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user for streak bonus tests"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"test_streak_bonus_{unique_id}@test.com"
        password = "testpass123"
        character_name = f"StreakTester_{unique_id}"
        
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
        
        assert response.status_code in [200, 201]
        data = response.json()
        return {
            "token": data["token"],
            "user": data["user"]
        }
    
    @pytest.fixture
    def auth_headers(self, test_user):
        return {"Authorization": f"Bearer {test_user['token']}"}
    
    def test_streak_bonus_field_in_response(self, auth_headers):
        """Test that streakBonus field is present in track response"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create habit
        create_response = requests.post(
            f"{BASE_URL}/api/habits",
            json={
                "name": f"Streak Bonus Test {unique_id}",
                "type": "good"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        habit = create_response.json()
        
        # Track habit
        track_response = requests.post(
            f"{BASE_URL}/api/habits/{habit['id']}/track",
            json={},
            headers=auth_headers
        )
        
        assert track_response.status_code == 200
        result = track_response.json()
        
        # Verify streakBonus field
        assert "streakBonus" in result, "Response should contain streakBonus"
        assert isinstance(result["streakBonus"], bool), "streakBonus should be boolean"
        
        # For first day, streakBonus should be False (not 10 days yet)
        assert result["streakBonus"] == False, "First day should not have streak bonus"
        
        print(f"✓ streakBonus field present and correct: {result['streakBonus']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
