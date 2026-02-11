import React from 'react';
import { Link } from 'react-router-dom';

const VideoCard = ({ video }) => {
  // Format duration from seconds to MM:SS
  const formatDuration = (duration) => {
    if (!duration) return '';
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Format view count
  const formatViewCount = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Format upload time
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

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4">
      <Link 
        to={`/watch/${video._id}`} 
        className="relative flex-shrink-0 w-full md:w-80 h-48 rounded-xl overflow-hidden bg-gray-200"
      >
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link 
          to={`/watch/${video._id}`} 
          className="block"
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-red-600 transition-colors">
            {video.title}
          </h3>
        </Link>
        
        <div className="flex items-center mt-2">
          <Link 
            to={`/channel/${video.owner?.username}`} 
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
              {video.owner?.avatar ? (
                <img 
                  src={video.owner.avatar} 
                  alt={video.owner.fullName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
                  {video.owner?.fullName?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {video.owner?.fullName || 'Unknown'}
            </span>
          </Link>
        </div>
        
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <span>{formatViewCount(video.viewsCount || 0)} views</span>
          <span className="mx-1">•</span>
          <span>{formatUploadTime(video.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;