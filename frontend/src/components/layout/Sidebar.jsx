import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Library, 
  History, 
  Play, 
  Bell, 
  Settings, 
  Video, 
  Heart, 
  User, 
  Menu, 
  X 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(null);

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={18} />, path: '/' },
    { id: 'explore', label: 'Explore', icon: <Search size={18} />, path: '/explore' },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Bell size={18} />, path: '/subscriptions' },
    { id: 'library', label: 'Library', icon: <Library size={18} />, path: '/library' },
    { id: 'history', label: 'History', icon: <History size={18} />, path: '/history' },
    { id: 'playlist', label: 'Playlists', icon: <Play size={18} />, path: '/playlists' },
    { id: 'liked', label: 'Liked Videos', icon: <Heart size={18} />, path: '/liked' },
    { id: 'your-videos', label: 'Your Videos', icon: <Video size={18} />, path: '/your-videos' },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
    { id: 'logout', label: 'Logout', icon: <User size={18} />, action: 'logout' },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/');
    }
  };

  const handleClick = (item) => {
    if (item.action === 'logout') {
      handleLogout();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Streamify</h2>
          <p className="text-sm text-gray-500 mt-1">Your video platform</p>
        </div>

        <div className="p-4">
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Home
          </button>
        </div>

        <nav className="mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              onMouseEnter={() => setIsHovered(item.id)}
              onMouseLeave={() => setIsHovered(null)}
              className={`w-full px-6 py-3 text-left flex items-center gap-3 transition-colors ${
                isHovered === item.id || item.id === 'home'
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              } ${item.id === 'logout' ? 'text-red-600 mt-4 border-t border-gray-200 pt-4' : 'text-gray-700'}`}
            >
              <div className={`w-6 h-6 flex items-center justify-center ${
                isHovered === item.id || item.id === 'home' ? 'text-red-600' : 'text-gray-700'
              }`}>
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p>© 2026 Streamify</p>
            <p className="mt-1">Made with ❤️</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;