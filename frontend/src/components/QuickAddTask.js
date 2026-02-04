import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuickAddTask = ({ onTaskAdded }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API}/tasks`,
        {
          title: title.trim(),
          type: 'daily',
          difficulty,
          skills: [],
          tags,
          priority: 'medium'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Завдання додано!');
      setTitle('');
      setDifficulty('medium');
      setTags([]);
      if (onTaskAdded) onTaskAdded();
    } catch (error) {
      toast.error('Помилка при додаванні завдання');
      console.error('Failed to add task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  return (
    <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10" data-testid="quick-add-task">
      <CardHeader>
        <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
          <Plus size={20} className="text-primary-main" />
          Швидке додавання
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="Нове завдання..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-bg-dark border-white/10 text-white focus:border-primary-main"
            data-testid="task-title-input"
          />
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-bg-dark border-white/10 text-white" data-testid="difficulty-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Легко (15 XP)</SelectItem>
              <SelectItem value="medium">Середньо (35 XP)</SelectItem>
              <SelectItem value="hard">Важко (75 XP)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-main to-primary-dark hover:shadow-primary-glow"
            disabled={loading || !title.trim()}
            data-testid="add-task-button"
          >
            {loading ? 'Додавання...' : 'Додати завдання'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickAddTask;