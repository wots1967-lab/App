import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EquipmentMenu = () => {
  const { user, token, updateUser } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/user/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data.inventory);
      setEquipped(response.data.equippedItem);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const handleEquip = async (itemId) => {
    try {
      const response = await axios.post(
        `${API}/user/equip/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, character: response.data.character };
      updateUser(updatedUser);
      setEquipped(itemId);
      toast.success('Мантру озброєно!');
    } catch (error) {
      toast.error('Помилка');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-text-dark-secondary hover:text-text-dark-primary relative"
          data-testid="equipment-menu"
        >
          <Sparkles size={20} />
          {equipped && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-main rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-bg-dark-card border-white/10">
        <DropdownMenuLabel className="text-text-dark-primary">Озброєння Мантр</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        
        {inventory.length === 0 ? (
          <div className="p-4 text-center text-text-dark-secondary text-sm">
            Немає придбаних мантр
          </div>
        ) : (
          inventory.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleEquip(item.id)}
              className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-text-dark-primary text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-primary-main">+{item.effectValue}% {
                      item.effect === 'stats' ? 'характеристик' :
                      item.effect === 'coins' ? 'монет' :
                      item.effect === 'xp' ? 'XP' : ''
                    }</p>
                  </div>
                </div>
                {equipped === item.id && (
                  <Check size={16} className="text-secondary-main" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EquipmentMenu;