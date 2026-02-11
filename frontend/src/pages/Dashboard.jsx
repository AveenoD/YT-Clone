import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import VideoSection from '../components/dashboard/VideoSection';
import WatchHistorySection from '../components/dashboard/WatchHistorySection';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('watch-history');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/current-user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

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
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Navbar */}
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Cover Image */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-red-500 to-red-600">
          {user.coverImage && (
            <img
              src={user.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Avatar */}
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-gray-600 mt-1">@{user.username}</p>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          
          <button
            onClick={() => navigate('/edit-profile')}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('watch-history')}
              className={`${
                activeTab === 'watch-history'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Watch History
            </button>
            <button
              onClick={() => setActiveTab('liked-videos')}
              className={`${
                activeTab === 'liked-videos'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Liked Videos
            </button>
            <button
              onClick={() => setActiveTab('your-uploads')}
              className={`${
                activeTab === 'your-uploads'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Your Uploads
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`${
                activeTab === 'playlists'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Playlists
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'watch-history' && <WatchHistorySection />}
          {activeTab === 'liked-videos' && <VideoSection type="liked" />}
          {activeTab === 'your-uploads' && <VideoSection type="uploads" />}
          {activeTab === 'playlists' && <VideoSection type="playlists" />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;