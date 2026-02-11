import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Mic, Video, Bell, User, Settings } from 'lucide-react';

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleUpload = () => {
    navigate('/upload');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Menu Button */}
          <div className="flex items-center">
            <button 
              className="text-gray-600 hover:text-gray-900 text-2xl md:hidden"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            
            <a href="/" className="flex items-center">
              <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center mr-2">
                <span className="text-2xl">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Streamify</span>
            </a>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-gray-600 hover:text-gray-900 text-2xl md:hidden"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors hidden md:flex items-center gap-2"
            >
              <Video size={18} />
              Upload
            </button>

            {/* Mobile Upload Button */}
            <button
              onClick={handleUpload}
              className="text-gray-600 hover:text-gray-900 text-2xl md:hidden"
              aria-label="Upload"
            >
              <Video size={20} />
            </button>

            {/* Notifications */}
            <button className="text-gray-600 hover:text-gray-900 text-2xl">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            {/* User Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                <img 
                  src="https://i.pravatar.cc/150?img=1" 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-0 right-0 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;