import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Users, Search, UserPlus, MessageCircle, Send, X, ChevronLeft, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatWindow = ({ friend, onClose, token, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [friend.friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${friend.friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(
        `${API}/messages`,
        { receiverId: friend.friendId, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Помилка відправки');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Сьогодні';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Вчора';
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  };

  let lastDate = null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 bottom-4 w-96 h-[500px] bg-bg-dark-card border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-main to-primary-dark p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
            {friend.friendName.charAt(0).toUpperCase()}
          </div>
          <span className="text-white font-medium">{friend.friendName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X size={20} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-text-dark-secondary py-4">Завантаження...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-dark-secondary py-8">
            Почніть розмову з {friend.friendName}!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === currentUserId;
            const showDate = lastDate !== formatDate(msg.createdAt);
            lastDate = formatDate(msg.createdAt);

            return (
              <React.Fragment key={msg.id || idx}>
                {showDate && (
                  <div className="text-center text-xs text-text-dark-secondary py-2">
                    {formatDate(msg.createdAt)}
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      isMine
                        ? 'bg-primary-main text-white rounded-br-sm'
                        : 'bg-bg-dark border border-white/10 text-text-dark-primary rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-text-dark-secondary'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Написати повідомлення..."
          className="flex-1 bg-bg-dark border-white/10 text-white"
        />
        <Button type="submit" size="icon" className="bg-primary-main hover:bg-primary-dark">
          <Send size={18} />
        </Button>
      </form>
    </motion.div>
  );
};

const FriendsPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    fetchFriends();
    // eslint-disable-next-line
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
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-dark-card to-bg-dark">
      {/* Header */}
      <header className="border-b border-white/10 bg-bg-dark-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-text-dark-secondary hover:text-text-dark-primary"
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
            Друзі
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search */}
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <Search size={20} className="text-primary-main" />
              Знайти друга
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFriend} className="space-y-3">
              <Input
                type="email"
                placeholder="Введіть email користувача..."
                value={searchEmail}
                onChange={(e) => handleSearchEmail(e.target.value)}
                className="bg-bg-dark border-white/10 text-white"
              />
              
              {searchResult && (
                <div className="bg-bg-dark border border-primary-main/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {searchResult.character.avatar ? (
                      <img 
                        src={searchResult.character.avatar} 
                        alt={searchResult.character.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold">
                        {searchResult.character.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-text-dark-primary font-medium">{searchResult.character.name}</p>
                      <p className="text-sm text-text-dark-secondary">{searchResult.email}</p>
                      <p className="text-xs text-primary-main">Рівень {searchResult.character.level}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button type="submit" className="w-full bg-gradient-to-r from-primary-main to-primary-dark">
                <UserPlus size={16} className="mr-2" />
                Додати друга
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Friends List */}
        <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
              <Users size={20} className="text-primary-main" />
              Мої друзі ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-text-dark-secondary">Завантаження...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-text-dark-secondary">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Додайте друзів щоб разом виконувати квести!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-bg-dark p-4 rounded-lg border border-white/10 hover:border-primary-main/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold text-lg">
                        {friend.friendName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-text-dark-primary font-medium">{friend.friendName}</p>
                        <p className="text-sm text-text-dark-secondary">{friend.friendEmail}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/friend/${friend.friendId}`)}
                        className="flex items-center gap-2 border-white/10 hover:border-primary-main/50"
                      >
                        <Eye size={14} />
                        Профіль
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveChat(friend)}
                        className="flex items-center gap-2 bg-primary-main hover:bg-primary-dark"
                      >
                        <MessageCircle size={14} />
                        Написати
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {activeChat && (
          <ChatWindow
            friend={activeChat}
            onClose={() => setActiveChat(null)}
            token={token}
            currentUserId={user?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendsPage;
