import requests
import sys
import json
from datetime import datetime

class GameAPITester:
    def __init__(self, base_url="https://emergent-quest-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

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

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_hero_{timestamp}@example.com",
            "password": "TestPass123!",
            "characterName": f"TestHero{timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   Character: {response['user']['character']['name']}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "LoginTest123!",
            "characterName": f"LoginHero{timestamp}"
        }
        
        # Register first
        reg_success, reg_response = self.run_test(
            "Pre-Login Registration",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not reg_success:
            return False
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            print(f"   Login successful for: {response['user']['character']['name']}")
            return True
        return False

    def test_get_user_info(self):
        """Test getting current user info"""
        if not self.token:
            self.log_test("Get User Info", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Get User Info",
            "GET",
            "user/me",
            200
        )
        
        if success and 'character' in response:
            character = response['character']
            print(f"   Character: {character['name']}, Level: {character['level']}")
            print(f"   XP: {character['xp']}/{character['xpToNextLevel']}")
            print(f"   Coins: {character['coins']}")
            return True
        return False

    def test_create_task(self):
        """Test task creation"""
        if not self.token:
            self.log_test("Create Task", False, "No token available")
            return False, None
            
        task_data = {
            "title": "Тестове завдання",
            "description": "Опис тестового завдання",
            "type": "daily",
            "difficulty": "medium",
            "skills": ["strength"],
            "priority": "medium"
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        
        if success and 'id' in response:
            print(f"   Task created: {response['title']}")
            print(f"   Rewards: {response['xpReward']} XP, {response['coinReward']} coins")
            return True, response['id']
        return False, None

    def test_get_tasks(self):
        """Test getting user tasks"""
        if not self.token:
            self.log_test("Get Tasks", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Get Tasks",
            "GET",
            "tasks",
            200
        )
        
        if success:
            print(f"   Found {len(response)} tasks")
            return True
        return False

    def test_complete_task(self, task_id):
        """Test task completion"""
        if not self.token or not task_id:
            self.log_test("Complete Task", False, "No token or task ID available")
            return False
            
        success, response = self.run_test(
            "Complete Task",
            "POST",
            f"tasks/{task_id}/complete",
            200
        )
        
        if success and 'character' in response:
            character = response['character']
            print(f"   Task completed! New XP: {character['xp']}")
            print(f"   Coins: {character['coins']}")
            if response.get('leveledUp'):
                print(f"   🎉 LEVEL UP! New level: {character['level']}")
            return True
        return False

    def test_delete_task(self, task_id):
        """Test task deletion"""
        if not self.token or not task_id:
            self.log_test("Delete Task", False, "No token or task ID available")
            return False
            
        success, response = self.run_test(
            "Delete Task",
            "DELETE",
            f"tasks/{task_id}",
            200
        )
        
        return success

    def test_stats_overview(self):
        """Test stats overview"""
        if not self.token:
            self.log_test("Stats Overview", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Stats Overview",
            "GET",
            "stats/overview",
            200
        )
        
        if success:
            print(f"   Total tasks: {response.get('totalTasks', 0)}")
            print(f"   Completed: {response.get('completedTasks', 0)}")
            print(f"   Level: {response.get('level', 0)}")
            return True
        return False

    def test_theme_update(self):
        """Test theme update"""
        if not self.token:
            self.log_test("Update Theme", False, "No token available")
            return False
            
        theme_data = {"theme": "light"}
        
        success, response = self.run_test(
            "Update Theme",
            "POST",
            "user/theme",
            200,
            data=theme_data
        )
        
        if success and response.get('theme') == 'light':
            print(f"   Theme updated to: {response['theme']}")
            return True
        return False

    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting Gamified Task Manager API Tests")
        print("=" * 50)
        
        # Test registration and authentication
        if not self.test_register():
            print("❌ Registration failed - stopping tests")
            return False
            
        # Test login separately
        self.test_login()
        
        # Test user info
        self.test_get_user_info()
        
        # Test task operations
        self.test_get_tasks()
        task_created, task_id = self.test_create_task()
        
        if task_created and task_id:
            self.test_complete_task(task_id)
            # Create another task for deletion test
            _, delete_task_id = self.test_create_task()
            if delete_task_id:
                self.test_delete_task(delete_task_id)
        
        # Test stats and theme
        self.test_stats_overview()
        self.test_theme_update()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            failed_tests = [r for r in self.test_results if not r['success']]
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            return False

def main():
    tester = GameAPITester()
    success = tester.run_full_test_suite()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())