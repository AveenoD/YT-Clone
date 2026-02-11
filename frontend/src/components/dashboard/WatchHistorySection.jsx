import React, { useState, useEffect } from 'react';

const WatchHistorySection = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWatchHistory();
  }, []);

  const fetchWatchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/watch-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }

      const data = await response.json();
      // Backend returns array directly
      setVideos(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatViewCount = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatUploadTime = (date) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diff = now - uploadDate;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(weeks / 4);
    
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Watch History</h2>
        <div className="flex overflow-x-auto pb-4 space-x-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex-shrink-0 w-64 bg-gray-100 rounded-lg overflow-hidden animate-pulse">
              <div className="h-36 bg-gray-200"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">📺</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No watch history</h2>
        <p className="text-gray-600">You haven't watched any videos yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Watch History</h2>
      
      <div className="flex overflow-x-auto pb-4 space-x-4">
        {videos.map((video, index) => (
          <div 
            key={video._id || index} 
            className="flex-shrink-0 w-64 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="relative">
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-36 bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl">📹</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                {video.title}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{formatViewCount(video.viewsCount || 0)} views</span>
                <span>{formatUploadTime(video.createdAt)}</span>
              </div>
              
              <div className="mt-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs">{video.owner?.fullName?.charAt(0) || '?'}</span>
                </div>
                <p className="text-sm text-gray-700">{video.owner?.username || 'Unknown'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchHistorySection;