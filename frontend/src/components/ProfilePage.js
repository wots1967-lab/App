import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { User, Camera, Target, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from './ui/progress';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user, token, updateUser } = useAuth();
  const [age, setAge] = useState(user?.character?.age || '');
  const [bio, setBio] = useState(user?.character?.bio || '');
  const [globalGoals, setGlobalGoals] = useState(user?.character?.globalGoals || []);
  const [newGoal, setNewGoal] = useState('');
  const [avatar, setAvatar] = useState(user?.character?.avatar || '');

  const handleSaveProfile = async () => {
    try {
      const response = await axios.post(
        `${API}/user/profile`,
        { age: parseInt(age) || null, bio, globalGoals },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(response.data);
      toast.success('Профіль оновлено!');
    } catch (error) {
      toast.error('Помилка при збереженні');
    }
  };

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setGlobalGoals([...globalGoals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index) => {
    setGlobalGoals(globalGoals.filter((_, i) => i !== index));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        setAvatar(base64);
        try {
          await axios.post(
            `${API}/user/avatar`,
            { avatar: base64 },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const updatedUser = { ...user };
          updatedUser.character.avatar = base64;
          updateUser(updatedUser);
          toast.success('Аватар оновлено!');
        } catch (error) {
          toast.error('Помилка при завантаженні');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const hp = user?.character?.hp || 100;
  const maxHp = user?.character?.maxHp || 100;
  const hpPercentage = (hp / maxHp) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-text-dark-primary mb-6">Профіль користувача</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Avatar Card */}
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <Camera size={20} className="text-primary-main" />
              Аватар
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-4xl text-white">
                  {user?.character?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-primary-main text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors">
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <p className="text-text-dark-secondary text-sm">Клікніть щоб змінити</p>
          </CardContent>
        </Card>

        {/* HP Card */}
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <Heart size={20} className="text-red-400" />
              Здоров'я
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-dark-secondary">HP</span>
              <span className="text-text-dark-primary font-bold">{hp} / {maxHp}</span>
            </div>
            <Progress value={hpPercentage} className="h-4" />
            <p className="text-xs text-text-dark-secondary">
              ⚠️ Провалені шкідливі звички знижують HP на 15%
            </p>
            <p className="text-xs text-accent-red">
              При 0 HP: -2 рівні та -1000 монет
            </p>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <User size={20} className="text-primary-main" />
              Основна інформація
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-text-dark-secondary mb-1 block">Вік</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Введіть ваш вік..."
                className="bg-bg-dark border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-text-dark-secondary mb-1 block">Про себе</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Розкажіть про себе..."
                className="bg-bg-dark border-white/10 text-white min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Goals */}
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <Target size={20} className="text-accent-gold" />
              Глобальні цілі
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Нова глобальна ціль..."
                className="bg-bg-dark border-white/10 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <Button onClick={handleAddGoal} className="bg-gradient-to-r from-primary-main to-primary-dark">
                Додати
              </Button>
            </div>
            <div className="space-y-2">
              {globalGoals.length === 0 ? (
                <p className="text-text-dark-secondary text-sm text-center py-4">
                  Додайте свої найважливіші життєві цілі
                </p>
              ) : (
                globalGoals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between bg-bg-dark p-3 rounded-lg border border-white/10">
                    <span className="text-text-dark-primary">{goal}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveGoal(index)} className="text-red-400">
                      Видалити
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-secondary-main to-green-600">
            Зберегти профіль
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;