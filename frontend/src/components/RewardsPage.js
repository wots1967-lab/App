import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Gift, Plus, Trash2, ShoppingBag, Lock, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RewardsPage = () => {
  const { user, token, updateUser } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    image: '',
    requiredLevel: 1,
    cost: 100
  });

  useEffect(() => {
    if (token) {
      fetchRewards();
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchRewards = async () => {
    try {
      const response = await axios.get(`${API}/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRewards(response.data);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!newReward.name.trim()) return;

    try {
      await axios.post(
        `${API}/rewards`,
        { ...newReward, image: selectedImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Винагороду створено!');
      setNewReward({ name: '', description: '', image: '', requiredLevel: 1, cost: 100 });
      setSelectedImage('');
      setShowAdd(false);
      fetchRewards();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const availableRewards = rewards.filter(r => !r.purchased);
  const purchasedRewards = rewards.filter(r => r.purchased);

  const handlePurchase = async (rewardId) => {
    try {
      const response = await axios.post(
        `${API}/rewards/${rewardId}/purchase`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, character: response.data.character };
      updateUser(updatedUser);
      toast.success('Винагороду придбано! 🎉');
      fetchRewards();
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail === 'Level too low' ? 'Рівень замалий' : 
                   error.response.data.detail === 'Not enough coins' ? 'Недостатньо монет' : 
                   'Помилка');
      } else {
        toast.error('Помилка');
      }
    }
  };

  const handleDelete = async (rewardId) => {
    try {
      await axios.delete(`${API}/rewards/${rewardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Винагороду видалено');
      fetchRewards();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-dark-primary flex items-center gap-2">
          <Gift className="text-accent-gold" />
          Мої Винагороди
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            className="bg-bg-dark-card border-white/10"
          >
            {showHistory ? 'Доступні' : 'Історія'}
          </Button>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-gradient-to-r from-primary-main to-primary-dark"
          >
            <Plus size={16} className="mr-2" />
            Створити
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary">Нова винагорода</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddReward} className="space-y-4">
              <Input
                placeholder="Назва винагороди..."
                value={newReward.name}
                onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                className="bg-bg-dark border-white/10 text-white"
                required
              />
              <Textarea
                placeholder="Опис (опціонально)..."
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                className="bg-bg-dark border-white/10 text-white"
              />
              <div>
                <label className="text-sm text-text-dark-secondary mb-2 block">Зображення (опціонально)</label>
                <div className="flex gap-3 items-center">
                  {selectedImage && (
                    <img src={selectedImage} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="bg-bg-dark border border-white/10 rounded-lg p-3 text-center hover:border-primary-main transition-colors">
                      <span className="text-text-dark-secondary text-sm">
                        {selectedImage ? 'Змінити зображення' : 'Завантажити зображення'}
                      </span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-dark-secondary mb-1 block">Необхідний рівень</label>
                  <Input
                    type="number"
                    min="1"
                    value={newReward.requiredLevel}
                    onChange={(e) => setNewReward({ ...newReward, requiredLevel: parseInt(e.target.value) })}
                    className="bg-bg-dark border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-text-dark-secondary mb-1 block">Вартість (монети)</label>
                  <Input
                    type="number"
                    min="1"
                    value={newReward.cost}
                    onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) })}
                    className="bg-bg-dark border-white/10 text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-secondary-main to-green-600">
                  Створити
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                  Скасувати
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-text-dark-secondary">Завантаження...</div>
      ) : rewards.length === 0 ? (
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
          <CardContent className="py-12 text-center">
            <Gift size={48} className="mx-auto mb-4 text-text-dark-secondary" />
            <p className="text-text-dark-primary mb-2">Створіть свої кастомні винагороди</p>
            <p className="text-sm text-text-dark-secondary">
              Визначте власні цілі та винагороди за досягнення
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const canPurchase = user?.character?.level >= reward.requiredLevel && 
                               user?.character?.coins >= reward.cost;
            const isPurchased = reward.purchased;
            
            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className={`bg-bg-dark-card/80 backdrop-blur-md border-white/10 hover:border-primary-main/50 transition-all h-full ${
                  isPurchased ? 'opacity-60' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-text-dark-primary mb-1">{reward.name}</h3>
                        {reward.description && (
                          <p className="text-sm text-text-dark-secondary mb-3">{reward.description}</p>
                        )}
                      </div>
                      {!isPurchased && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reward.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Lock size={14} className="text-primary-main" />
                        <span className="text-text-dark-secondary">
                          Рівень: <span className="text-text-dark-primary font-medium">{reward.requiredLevel}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins size={14} className="text-accent-gold" />
                        <span className="text-text-dark-secondary">
                          Вартість: <span className="text-accent-gold font-medium">{reward.cost}</span>
                        </span>
                      </div>
                    </div>
                    
                    {isPurchased ? (
                      <div className="bg-secondary-main/20 text-secondary-main px-4 py-2 rounded-lg text-center font-medium">
                        ✓ Придбано
                      </div>
                    ) : canPurchase ? (
                      <Button
                        onClick={() => handlePurchase(reward.id)}
                        className="w-full bg-gradient-to-r from-accent-gold to-accent-orange"
                      >
                        <ShoppingBag size={16} className="mr-2" />
                        Купити
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full"
                      >
                        Недоступно
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RewardsPage;