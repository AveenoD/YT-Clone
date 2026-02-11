import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import VideoCard from '../components/video/VideoCard';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, [page]);

  const fetchVideos = async () => {
    try {
      setIsLoading(page === 1);
      
      const response = await fetch(`http://localhost:5000/api/v1/videos?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        // Try without auth for public videos
        const publicResponse = await fetch(`http://localhost:5000/api/v1/videos?page=${page}&limit=20`);
        if (!publicResponse.ok) throw new Error('Failed to fetch videos');
        const publicData = await publicResponse.json();
        handleVideoResponse(publicData);
        return;
      }

      const data = await response.json();
      handleVideoResponse(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Unable to load videos. Please try again later.');
    } finally {
      if (page === 1) {
        setIsLoading(false);
      }
    }
  };

  const handleVideoResponse = (data) => {
    const videoList = data.data?.videos || data.data || data.videos || [];
    
    if (page === 1) {
      setVideos(videoList);
    } else {
      setVideos(prev => [...prev, ...videoList]);
    }
    
    setHasMore(data.data?.hasMore !== undefined ? data.data.hasMore : videoList.length > 0);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/watch/${videoId}`);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl text-gray-400 mb-4">🎥</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Videos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-8xl text-gray-300 mb-6">📭</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No videos yet</h2>
          <p className="text-xl text-gray-600 mb-8">Be the first to upload a video!</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          >
            Upload Your First Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Navbar */}
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 hidden md:block">Recommended Videos</h1>
        
        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map(video => (
            <VideoCard 
              key={video._id} 
              video={video}
              onClick={() => handleVideoClick(video._id)}
            />
          ))}
        </div>
        
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-8 py-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-70 flex items-center gap-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                'Load More Videos'
              )}
            </button>
          </div>
        )}

        {/* No More Videos Message */}
        {!hasMore && videos.length > 0 && (
          <div className="text-center mt-8 py-6">
            <p className="text-gray-600">You've reached the end of the videos</p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Streamify. All rights reserved.</p>
          <p className="mt-2 text-sm">Made with ❤️ for creators</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;