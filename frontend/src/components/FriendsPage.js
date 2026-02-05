import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Users, Search, UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FriendsPage = () => {
  const { token } = useAuth();
  const [friends, setFriends] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    try {
      await axios.post(
        `${API}/friends/add`,
        { friendEmail: searchEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Запит на дружбу відправлено!');
      setSearchEmail('');
      setSearchResult(null);
      fetchFriends();
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Користувача не знайдено');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Помилка');
      }
    }
  };

  const handleSearchEmail = async (email) => {
    setSearchEmail(email);
    if (email.includes('@') && email.length > 5) {
      try {
        const response = await axios.get(`${API}/users/search?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResult(response.data);
      } catch (error) {
        setSearchResult(null);
      }
    } else {
      setSearchResult(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-text-dark-primary mb-6 flex items-center gap-2">
        <Users className="text-primary-main" />
        Друзі
      </h1>

      {/* Search */}
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
            <Search size={20} className="text-primary-main" />
            Знайти друга
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFriend} className="flex gap-2">
            <Input
              type="email"
              placeholder="Введіть email користувача..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="bg-bg-dark border-white/10 text-white"
            />
            <Button type="submit" className="bg-gradient-to-r from-primary-main to-primary-dark">
              <UserPlus size={16} className="mr-2" />
              Додати
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-text-dark-primary">
            Мої друзі ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-text-dark-secondary">Завантаження...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-text-dark-secondary">
              Додайте друзів щоб разом виконувати квести!
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between bg-bg-dark p-4 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold">
                      {friend.friendName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-text-dark-primary font-medium">{friend.friendName}</p>
                      <p className="text-sm text-text-dark-secondary">{friend.friendEmail}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail size={14} />
                    Написати
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsPage;