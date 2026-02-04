import requests
import sys
import json
from datetime import datetime

class Phase2APITester:
    def __init__(self, base_url="https://emergent-quest-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                details = f"Expected {expected_status}, got {response.status_code}"
                if response.text:
                    details += f" - {response.text[:200]}"
                self.log_test(name, False, details)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def setup_user(self):
        """Register and login a test user"""
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"phase2_test_{timestamp}@example.com",
            "password": "TestPass123!",
            "characterName": f"Phase2Hero{timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained for: {response['user']['character']['name']}")
            return True
        return False

    def test_habits_api(self):
        """Test habits CRUD operations"""
        print("\n=== TESTING HABITS API ===")
        
        # Get habits (should be empty initially)
        success, habits = self.run_test("Get Habits", "GET", "habits", 200)
        if success:
            print(f"   Found {len(habits)} habits")
        
        # Create a habit
        habit_data = {
            "name": "Тестова звичка",
            "description": "Опис тестової звички",
            "frequency": "daily"
        }
        
        success, habit = self.run_test("Create Habit", "POST", "habits", 200, data=habit_data)
        habit_id = None
        if success and 'id' in habit:
            habit_id = habit['id']
            print(f"   Habit created: {habit['name']}")
        
        # Track habit
        if habit_id:
            success, response = self.run_test("Track Habit", "POST", f"habits/{habit_id}/track", 200)
            if success:
                print(f"   Habit tracked successfully")
        
        # Delete habit
        if habit_id:
            success, response = self.run_test("Delete Habit", "DELETE", f"habits/{habit_id}", 200)

    def test_quests_api(self):
        """Test quests CRUD operations"""
        print("\n=== TESTING QUESTS API ===")
        
        # Get quests (should be empty initially)
        success, quests = self.run_test("Get Quests", "GET", "quests", 200)
        if success:
            print(f"   Found {len(quests)} quests")
        
        # Create a quest
        quest_data = {
            "title": "Тестовий квест",
            "description": "Опис тестового квесту",
            "difficulty": "medium",
            "steps": [
                {"title": "Крок 1"},
                {"title": "Крок 2"},
                {"title": "Крок 3"}
            ]
        }
        
        success, quest = self.run_test("Create Quest", "POST", "quests", 200, data=quest_data)
        quest_id = None
        if success and 'id' in quest:
            quest_id = quest['id']
            print(f"   Quest created: {quest['title']} with {len(quest['steps'])} steps")
        
        # Complete quest step
        if quest_id:
            success, response = self.run_test("Complete Quest Step", "POST", f"quests/{quest_id}/next-step", 200)
            if success:
                print(f"   Quest step completed")
        
        # Delete quest
        if quest_id:
            success, response = self.run_test("Delete Quest", "DELETE", f"quests/{quest_id}", 200)

    def test_achievements_api(self):
        """Test achievements API"""
        print("\n=== TESTING ACHIEVEMENTS API ===")
        
        success, achievements = self.run_test("Get Achievements", "GET", "achievements", 200)
        if success:
            print(f"   Found {len(achievements)} achievements")

    def test_stats_allocation(self):
        """Test character stats allocation"""
        print("\n=== TESTING STATS ALLOCATION ===")
        
        # First, let's level up the character to get stat points
        # Create and complete a few tasks to gain XP
        for i in range(3):
            task_data = {
                "title": f"XP Task {i+1}",
                "difficulty": "hard",  # 75 XP
                "skills": ["strength"]
            }
            
            success, task = self.run_test(f"Create XP Task {i+1}", "POST", "tasks", 200, data=task_data)
            if success and 'id' in task:
                success, response = self.run_test(f"Complete XP Task {i+1}", "POST", f"tasks/{task['id']}/complete", 200)
        
        # Get current user to check available stat points
        success, user = self.run_test("Get User Info", "GET", "user/me", 200)
        if success:
            available_points = user['character']['availableStatPoints']
            print(f"   Available stat points: {available_points}")
            
            if available_points > 0:
                # Allocate some stats
                stats_data = {
                    "stats": {
                        "strength": 2,
                        "intelligence": 1
                    }
                }
                
                success, response = self.run_test("Allocate Stats", "POST", "user/allocate-stats", 200, data=stats_data)
                if success:
                    print(f"   Stats allocated successfully")

    def test_goals_api(self):
        """Test goals API"""
        print("\n=== TESTING GOALS API ===")
        
        success, goals = self.run_test("Get Goals", "GET", "goals", 200)
        if success:
            print(f"   Found {len(goals)} goals")
        
        # Create a goal
        goal_data = {
            "title": "Тестова ціль",
            "description": "Опис тестової цілі",
            "type": "short_term",
            "target": 100
        }
        
        success, goal = self.run_test("Create Goal", "POST", "goals", 200, data=goal_data)
        goal_id = None
        if success and 'id' in goal:
            goal_id = goal['id']
            print(f"   Goal created: {goal['title']}")

    def run_phase2_tests(self):
        """Run all Phase 2 API tests"""
        print("🚀 Starting Phase 2 API Tests")
        print("=" * 50)
        
        if not self.setup_user():
            print("❌ User setup failed - stopping tests")
            return False
        
        # Test all Phase 2 features
        self.test_habits_api()
        self.test_quests_api()
        self.test_achievements_api()
        self.test_stats_allocation()
        self.test_goals_api()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Phase 2 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Phase 2 tests passed!")
            return True
        else:
            print("⚠️  Some Phase 2 tests failed")
            return False

def main():
    tester = Phase2APITester()
    success = tester.run_phase2_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())