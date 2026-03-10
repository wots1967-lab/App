"""
Phase 5 Backend Tests - Custom Stats, Task Steps, LinkedStats
Tests for:
- POST /api/user/custom-stats - create custom stat
- DELETE /api/user/custom-stats/{id} - delete with points return
- PUT /api/user/custom-stats/{id} - edit custom stat
- POST /api/tasks with linkedStats and steps fields
- POST /api/tasks/{id}/steps - add step to task
- POST /api/tasks/{id}/steps/{stepId}/toggle - toggle step completion
- DELETE /api/tasks/{id}/steps/{stepId} - delete step
- Task completion with linkedStats bonus
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPhase5Features:
    """Test custom stats, task steps, and linkedStats features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test user for each test"""
        self.test_email = f"test_phase5_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "testpass123"
        self.test_name = "TestHero"
        
        # Register user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "characterName": self.test_name
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        self.token = data['token']
        self.user = data['user']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
    # --- Custom Stats Tests ---
    
    def test_create_custom_stat(self):
        """Test POST /api/user/custom-stats - create custom stat"""
        response = requests.post(
            f"{BASE_URL}/api/user/custom-stats",
            json={"label": "Фокус", "icon": "🎯", "color": "text-blue-400"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["label"] == "Фокус"
        assert data["icon"] == "🎯"
        assert data["color"] == "text-blue-400"
        assert data["value"] == 0
        assert "key" in data
        print(f"✓ Custom stat created: {data['label']} with id {data['id']}")
        
    def test_get_custom_stats(self):
        """Test GET /api/user/custom-stats"""
        # First create a stat
        requests.post(
            f"{BASE_URL}/api/user/custom-stats",
            json={"label": "Тест", "icon": "⭐"},
            headers=self.headers
        )
        
        response = requests.get(
            f"{BASE_URL}/api/user/custom-stats",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"✓ Got {len(data)} custom stats")
        
    def test_update_custom_stat(self):
        """Test PUT /api/user/custom-stats/{id} - edit custom stat"""
        # Create stat first
        create_resp = requests.post(
            f"{BASE_URL}/api/user/custom-stats",
            json={"label": "Оригінал", "icon": "⭐"},
            headers=self.headers
        )
        stat_id = create_resp.json()["id"]
        
        # Update it
        response = requests.put(
            f"{BASE_URL}/api/user/custom-stats/{stat_id}",
            json={"label": "Оновлено", "icon": "🔥"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["label"] == "Оновлено"
        assert data["icon"] == "🔥"
        print(f"✓ Custom stat updated: {data['label']}")
        
    def test_delete_custom_stat_returns_points(self):
        """Test DELETE /api/user/custom-stats/{id} - delete with points return"""
        # Create stat
        create_resp = requests.post(
            f"{BASE_URL}/api/user/custom-stats",
            json={"label": "ToDelete", "icon": "🗑️"},
            headers=self.headers
        )
        stat_id = create_resp.json()["id"]
        
        # Get initial available points
        user_resp = requests.get(f"{BASE_URL}/api/user/me", headers=self.headers)
        initial_points = user_resp.json()["character"]["availableStatPoints"]
        
        # Delete stat
        response = requests.delete(
            f"{BASE_URL}/api/user/custom-stats/{stat_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "pointsReturned" in data
        assert "availableStatPoints" in data
        print(f"✓ Custom stat deleted, {data['pointsReturned']} points returned")
        
    def test_delete_nonexistent_custom_stat(self):
        """Test DELETE /api/user/custom-stats/{id} - 404 for nonexistent"""
        response = requests.delete(
            f"{BASE_URL}/api/user/custom-stats/nonexistent-id",
            headers=self.headers
        )
        assert response.status_code == 404
        print("✓ 404 returned for nonexistent custom stat")
        
    # --- Task with Steps and LinkedStats Tests ---
    
    def test_create_task_with_steps_and_linkedstats(self):
        """Test POST /api/tasks with linkedStats and steps fields"""
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={
                "title": "Завдання з кроками",
                "description": "Тестове завдання",
                "type": "daily",
                "difficulty": "medium",
                "linkedStats": ["strength", "intelligence"],
                "steps": [
                    {"title": "Крок 1"},
                    {"title": "Крок 2"},
                    {"title": "Крок 3"}
                ],
                "priority": "high"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["title"] == "Завдання з кроками"
        assert "linkedStats" in data
        assert "strength" in data["linkedStats"]
        assert "intelligence" in data["linkedStats"]
        assert "steps" in data
        assert len(data["steps"]) == 3
        
        # Verify steps structure
        for step in data["steps"]:
            assert "id" in step
            assert "title" in step
            assert step["completed"] == False
            
        print(f"✓ Task created with {len(data['steps'])} steps and {len(data['linkedStats'])} linked stats")
        return data
        
    def test_add_step_to_task(self):
        """Test POST /api/tasks/{id}/steps - add step to task"""
        # Create task first
        task_resp = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": "Task for steps", "difficulty": "easy"},
            headers=self.headers
        )
        task_id = task_resp.json()["id"]
        
        # Add step
        response = requests.post(
            f"{BASE_URL}/api/tasks/{task_id}/steps",
            json={"title": "Новий крок"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["title"] == "Новий крок"
        assert data["completed"] == False
        print(f"✓ Step added to task: {data['title']}")
        return task_id, data["id"]
        
    def test_toggle_step_completion(self):
        """Test POST /api/tasks/{id}/steps/{stepId}/toggle"""
        # Create task with step
        task_resp = requests.post(
            f"{BASE_URL}/api/tasks",
            json={
                "title": "Task for toggle",
                "steps": [{"title": "Toggle me"}]
            },
            headers=self.headers
        )
        task = task_resp.json()
        task_id = task["id"]
        step_id = task["steps"][0]["id"]
        
        # Toggle step (should become completed)
        response = requests.post(
            f"{BASE_URL}/api/tasks/{task_id}/steps/{step_id}/toggle",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "steps" in data
        toggled_step = next(s for s in data["steps"] if s["id"] == step_id)
        assert toggled_step["completed"] == True
        print("✓ Step toggled to completed")
        
        # Toggle again (should become uncompleted)
        response2 = requests.post(
            f"{BASE_URL}/api/tasks/{task_id}/steps/{step_id}/toggle",
            headers=self.headers
        )
        data2 = response2.json()
        toggled_step2 = next(s for s in data2["steps"] if s["id"] == step_id)
        assert toggled_step2["completed"] == False
        print("✓ Step toggled back to uncompleted")
        
    def test_delete_step_from_task(self):
        """Test DELETE /api/tasks/{id}/steps/{stepId}"""
        # Create task with steps
        task_resp = requests.post(
            f"{BASE_URL}/api/tasks",
            json={
                "title": "Task for delete step",
                "steps": [{"title": "Step to delete"}, {"title": "Step to keep"}]
            },
            headers=self.headers
        )
        task = task_resp.json()
        task_id = task["id"]
        step_to_delete = task["steps"][0]["id"]
        
        # Delete step
        response = requests.delete(
            f"{BASE_URL}/api/tasks/{task_id}/steps/{step_to_delete}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify step is deleted
        tasks_resp = requests.get(f"{BASE_URL}/api/tasks", headers=self.headers)
        updated_task = next(t for t in tasks_resp.json() if t["id"] == task_id)
        assert len(updated_task["steps"]) == 1
        assert updated_task["steps"][0]["title"] == "Step to keep"
        print("✓ Step deleted from task")
        
    def test_task_completion_with_linkedstats_bonus(self):
        """Test that completing task with linkedStats gives stat bonus"""
        # First create a custom stat
        custom_stat_resp = requests.post(
            f"{BASE_URL}/api/user/custom-stats",
            json={"label": "Тестова характеристика", "icon": "🧪"},
            headers=self.headers
        )
        custom_stat_id = custom_stat_resp.json()["id"]
        
        # Get initial stats
        user_before = requests.get(f"{BASE_URL}/api/user/me", headers=self.headers).json()
        initial_strength = user_before["character"]["stats"]["strength"]
        
        # Create task with linkedStats (standard + custom)
        task_resp = requests.post(
            f"{BASE_URL}/api/tasks",
            json={
                "title": "Task with linked stats",
                "difficulty": "medium",
                "linkedStats": ["strength", custom_stat_id]
            },
            headers=self.headers
        )
        task_id = task_resp.json()["id"]
        
        # Complete the task
        complete_resp = requests.post(
            f"{BASE_URL}/api/tasks/{task_id}/complete",
            headers=self.headers
        )
        assert complete_resp.status_code == 200, f"Failed: {complete_resp.text}"
        
        # Verify stats increased
        user_after = requests.get(f"{BASE_URL}/api/user/me", headers=self.headers).json()
        final_strength = user_after["character"]["stats"]["strength"]
        
        assert final_strength > initial_strength, f"Strength should increase: {initial_strength} -> {final_strength}"
        print(f"✓ Task completion increased strength: {initial_strength} -> {final_strength}")
        
        # Check custom stat also increased
        custom_stats = user_after["character"].get("customStats", [])
        custom_stat = next((s for s in custom_stats if s["id"] == custom_stat_id), None)
        if custom_stat:
            assert custom_stat["value"] >= 1, f"Custom stat should have value >= 1"
            print(f"✓ Custom stat value: {custom_stat['value']}")
            
    def test_allocate_custom_stats(self):
        """Test POST /api/user/allocate-custom-stats"""
        # Create custom stat
        stat_resp = requests.post(
            f"{BASE_URL}/api/user/custom-stats",
            json={"label": "Allocate Test", "icon": "📊"},
            headers=self.headers
        )
        stat_id = stat_resp.json()["id"]
        
        # Give user some stat points by completing tasks
        for i in range(3):
            task_resp = requests.post(
                f"{BASE_URL}/api/tasks",
                json={"title": f"XP Task {i}", "difficulty": "hard"},
                headers=self.headers
            )
            requests.post(
                f"{BASE_URL}/api/tasks/{task_resp.json()['id']}/complete",
                headers=self.headers
            )
        
        # Check if user has available points
        user_resp = requests.get(f"{BASE_URL}/api/user/me", headers=self.headers)
        available_points = user_resp.json()["character"]["availableStatPoints"]
        
        if available_points > 0:
            # Allocate points to custom stat
            response = requests.post(
                f"{BASE_URL}/api/user/allocate-custom-stats",
                json={stat_id: 1},
                headers=self.headers
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            print(f"✓ Allocated 1 point to custom stat")
        else:
            print("⚠ No available stat points to allocate (user hasn't leveled up)")
            
    # --- Edge Cases ---
    
    def test_add_step_to_nonexistent_task(self):
        """Test adding step to nonexistent task returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/tasks/nonexistent-task-id/steps",
            json={"title": "Step"},
            headers=self.headers
        )
        assert response.status_code == 404
        print("✓ 404 returned for nonexistent task")
        
    def test_toggle_nonexistent_step(self):
        """Test toggling nonexistent step"""
        # Create task
        task_resp = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": "Task"},
            headers=self.headers
        )
        task_id = task_resp.json()["id"]
        
        # Try to toggle nonexistent step
        response = requests.post(
            f"{BASE_URL}/api/tasks/{task_id}/steps/nonexistent-step/toggle",
            headers=self.headers
        )
        # Should return 200 but step won't be found (no error thrown)
        assert response.status_code == 200
        print("✓ Toggle nonexistent step handled gracefully")


class TestTaskListAddButton:
    """Test the 'Додати' button in TaskList header"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"test_addbutton_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": "testpass123",
            "characterName": "AddButtonTest"
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data['token']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
    def test_tasks_endpoint_works(self):
        """Verify tasks endpoint is working for the add button"""
        # Create a task
        response = requests.post(
            f"{BASE_URL}/api/tasks",
            json={"title": "Test task from add button", "difficulty": "easy"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Get tasks
        get_resp = requests.get(f"{BASE_URL}/api/tasks", headers=self.headers)
        assert get_resp.status_code == 200
        tasks = get_resp.json()
        assert len(tasks) >= 1
        print(f"✓ Tasks endpoint working, {len(tasks)} tasks found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
