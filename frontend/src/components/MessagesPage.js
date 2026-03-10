import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { MessageCircle, ChevronLeft, Send, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessagesPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.friendId);
      const interval = setInterval(() => fetchMessages(selectedFriend.friendId), 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [selectedFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (friendId) => {
    try {
      const response = await axios.get(`${API}/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      // Update unread count in conversations
      setConversations(prev => prev.map(c => 
        c.friendId === friendId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      await axios.post(
        `${API}/messages`,
        { receiverId: selectedFriend.friendId, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      fetchMessages(selectedFriend.friendId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Сьогодні';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Вчора';
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(c => 
    c.friendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let lastDate = null;

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
            Повідомлення
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations List */}
          <Card className="bg-bg-dark-card/80 backdrop-blur-md border-white/10 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-text-dark-primary flex items-center gap-2">
                <MessageCircle size={20} className="text-primary-main" />
                Діалоги
              </CardTitle>
              <div className="relative mt-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark-secondary" />
                <Input
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-bg-dark border-white/10 text-white"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-280px)]">
              {loading ? (
                <div className="text-center py-8 text-text-dark-secondary">Завантаження...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-text-dark-secondary px-4">
                  {searchQuery ? 'Нічого не знайдено' : 'Немає діалогів. Напишіть другу!'}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredConversations.map((conv) => (
                    <motion.div
                      key={conv.friendId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedFriend(conv)}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                        selectedFriend?.friendId === conv.friendId ? 'bg-primary-main/10 border-l-2 border-primary-main' : ''
                      }`}
                    >
                      <div className="relative">
                        {conv.friendAvatar ? (
                          <img src={conv.friendAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold">
                            {conv.friendName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-main rounded-full text-xs flex items-center justify-center text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-text-dark-primary font-medium truncate">{conv.friendName}</p>
                          {conv.lastMessage && (
                            <span className="text-xs text-text-dark-secondary">
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-text-dark-primary font-medium' : 'text-text-dark-secondary'}`}>
                            {conv.lastMessage.senderId === user?.id ? 'Ви: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-bg-dark-card/80 backdrop-blur-md border-white/10 flex flex-col overflow-hidden">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  {selectedFriend.friendAvatar ? (
                    <img src={selectedFriend.friendAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-main to-primary-dark flex items-center justify-center text-white font-bold">
                      {selectedFriend.friendName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-text-dark-primary font-medium">{selectedFriend.friendName}</p>
                    <p className="text-xs text-text-dark-secondary">Друг</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-text-dark-secondary py-8">
                      Почніть розмову з {selectedFriend.friendName}!
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((msg, idx) => {
                        const isMine = msg.senderId === user?.id;
                        const showDate = lastDate !== formatDate(msg.createdAt);
                        lastDate = formatDate(msg.createdAt);

                        return (
                          <React.Fragment key={msg.id || idx}>
                            {showDate && (
                              <div className="text-center text-xs text-text-dark-secondary py-2">
                                {formatDate(msg.createdAt)}
                              </div>
                            )}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
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
                            </motion.div>
                          </React.Fragment>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Написати повідомлення..."
                    className="flex-1 bg-bg-dark border-white/10 text-white"
                  />
                  <Button type="submit" className="bg-primary-main hover:bg-primary-dark">
                    <Send size={18} />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-dark-secondary">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Виберіть діалог зліва</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
