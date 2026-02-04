import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import axios from 'axios';
import { ShoppingBag, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShopPage = () => {
  const { user, token, updateUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API}/shop/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId) => {
    try {
      const response = await axios.post(
        `${API}/shop/purchase/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, character: response.data.character, inventory: response.data.inventory };
      updateUser(updatedUser);
      toast.success('Мантру придбано!');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Недостатньо монет');
      } else {
        toast.error('Помилка при покупці');
      }
    }
  };

  const strengthMantras = items.filter(i => i.category === 'strength');
  const wealthMantras = items.filter(i => i.category === 'wealth');
  const experienceMantras = items.filter(i => i.category === 'experience');

  const MantraCard = ({ item }) => {
    const isOwned = user?.inventory?.includes(item.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className={`bg-bg-dark-card/80 backdrop-blur-md border-white/10 hover:border-primary-main/50 transition-all ${isOwned ? 'opacity-60' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{item.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-dark-primary mb-2">{item.name}</h3>
                <p className="text-sm text-text-dark-secondary mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-primary-main font-medium">
                      Ефект: +{item.effectValue}% до {
                        item.effect === 'stats' ? 'характеристик' :
                        item.effect === 'coins' ? 'монет' :
                        item.effect === 'xp' ? 'досвіду' : item.effect
                      }
                    </p>
                    <div className="flex items-center gap-1 text-accent-gold">
                      <Coins size={14} />
                      <span className="font-bold">{item.price}</span>
                    </div>
                  </div>
                  {isOwned ? (
                    <span className="text-secondary-main text-sm font-medium">✓ Придбано</span>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(item.id)}
                      className="bg-gradient-to-r from-primary-main to-primary-dark"
                      size="sm"
                    >
                      Купити
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-dark-primary flex items-center gap-2">
          <ShoppingBag className="text-primary-main" />
          Магазин Мантр
        </h1>
        <div className="flex items-center gap-2 bg-bg-dark-card/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg">
          <Coins className="text-accent-gold" />
          <span className="text-text-dark-primary font-bold">{user?.character?.coins || 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-dark-secondary">Завантаження...</div>
      ) : (
        <Tabs defaultValue="strength" className="space-y-6">
          <TabsList className="bg-bg-dark-card border border-white/10">
            <TabsTrigger value="strength">🧠 Мантри Сили</TabsTrigger>
            <TabsTrigger value="wealth">🪙 Мантри Достатку</TabsTrigger>
            <TabsTrigger value="experience">✨ Мантри Досвіду</TabsTrigger>
          </TabsList>

          <TabsContent value="strength" className="space-y-4">
            <p className="text-text-dark-secondary mb-4">Підсилюють ваші базові характеристики</p>
            {strengthMantras.map(item => <MantraCard key={item.id} item={item} />)}
          </TabsContent>

          <TabsContent value="wealth" className="space-y-4">
            <p className="text-text-dark-secondary mb-4">Збільшують кількість отримуваних монет</p>
            {wealthMantras.map(item => <MantraCard key={item.id} item={item} />)}
          </TabsContent>

          <TabsContent value="experience" className="space-y-4">
            <p className="text-text-dark-secondary mb-4">Прискорюють ваше зростання</p>
            {experienceMantras.map(item => <MantraCard key={item.id} item={item} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ShopPage;