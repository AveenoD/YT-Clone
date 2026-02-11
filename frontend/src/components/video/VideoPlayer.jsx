import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share, 
  Save, 
  MoreHorizontal, 
  Check, 
  Clock, 
  Loader2 
} from 'lucide-react';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  
  // Video player controls
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let hideControlsTimeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideControlsTimeout);
      hideControlsTimeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('mousemove', handleMouseMove);
      videoElement.addEventListener('timeupdate', () => {
        setCurrentTime(videoElement.currentTime);
        setDuration(videoElement.duration);
      });
      return () => {
        videoElement.removeEventListener('mousemove', handleMouseMove);
        videoElement.removeEventListener('timeupdate', () => {});
        clearTimeout(hideControlsTimeout);
      };
    }
  }, []);

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`http://localhost:5000/api/v1/videos/${videoId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }

        const data = await response.json();
        setVideo(data.data);
        
        // Check if user has liked this video
        if (data.data.isLiked !== undefined) {
          setIsLoved(data.data.isLiked);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/v1/comments/video/${videoId}?limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Backend returns array directly in data field
          setComments(Array.isArray(data.data) ? data.data : []);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };

    fetchVideo();
    fetchComments();
  }, [videoId]);

  // Video player event handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const newTime = (clickPosition / rect.width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleLike = async () => {
    if (!video) return;
    
    setIsLiking(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/likes/toggle/video/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLoved(data.data.liked);
        // Update video like count if needed
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to like video');
      }
    } catch (err) {
      console.error('Like error:', err);
      setError(err.message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/comments/video/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            content: commentText
          })
        }
      );

      if (response.ok) {
        setCommentText('');
        // Refetch comments to get updated list with populated owner
        const commentsResponse = await fetch(
          `http://localhost:5000/api/v1/comments/video/${videoId}?limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          setComments(Array.isArray(data.data) ? data.data : []);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Comment error:', err);
      setError(err.message);
    } finally {
      setIsCommenting(false);
    }
  };

  // Format helpers
  const formatDuration = (duration) => {
    if (!duration || isNaN(duration)) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatViewCount = (views) => {
    if (!views) return '0';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatUploadTime = (date) => {
    if (!date) return '';
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl text-gray-400 mb-4">🎥</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Video not found</h2>
          <p className="text-gray-600 mb-6">{error || 'The video you\'re looking for doesn\'t exist'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Video Player Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="relative">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black">
              <video 
                ref={videoRef}
                src={video.videoFile} 
                className="w-full h-full object-contain"
                poster={video.thumbnail}
                onEnded={() => setIsPlaying(false)}
              />
              
              {/* Custom Controls */}
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
                  showControls ? 'opacity-100' : 'opacity-0'
                }`}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {/* Progress Bar */}
                <div 
                  className="h-1 bg-gray-700 rounded-full cursor-pointer mb-2"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-white rounded-full" 
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  />
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 text-white hover:bg-black/70 transition-colors"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M0 3.5A.5.5 0 0 1 .5 3h1.5A.5.5 0 0 1 3 3.5v1.5a.5.5 0 0 1-.5.5H1a.5.5 0 0 1-.5-.5V3.5zM5 3.5A.5.5 0 0 1 5.5 3h1.5A.5.5 0 0 1 8 3.5v1.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V3.5zM10 3.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5V3.5zM0 10.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5H1a.5.5 0 0 1-.5-.5v-1.5zM5 10.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-1.5zM10 10.5a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-1.5z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.54.146a.5.5 0 0 0-.523.387L7.97 7.51 4.752 3.73a.5.5 0 0 0-.752.095L.869 7.687a.5.5 0 0 0 .434.795l4.054-.675 3.217 3.773a.5.5 0 0 0 .647.12l3.686-1.893a.5.5 0 0 0 .235-.544l-2.442-6.808a.5.5 0 0 0-.472-.346z"/>
                        </svg>
                      )}
                    </button>
                    
                    <div className="text-sm text-white">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleMute}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 text-white hover:bg-black/70 transition-colors"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M6.717 3.893a.5.5 0 0 1 .727.054l3.494 4.494a.5.5 0 0 1-.395.801H8.617a.5.5 0 0 1-.494-.418l-.5-.5a.5.5 0 0 1 .054-.727l3.494-4.494a.5.5 0 0 1 .727-.054l.5.5a.5.5 0 0 1-.054.727l-3.494 4.494a.5.5 0 0 1-.418.181h-1.917a.5.5 0 0 1-.494-.418l-.5-.5a.5.5 0 0 1 .054-.727l3.494-4.494a.5.5 0 0 1 .727-.054z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.54.146a.5.5 0 0 0-.523.387L7.97 7.51 4.752 3.73a.5.5 0 0 0-.752.095L.869 7.687a.5.5 0 0 0 .434.795l4.054-.675 3.217 3.773a.5.5 0 0 0 .647.12l3.686-1.893a.5.5 0 0 0 .235-.544l-2.442-6.808a.5.5 0 0 0-.472-.346z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Title and Actions */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2">
                {video.title}
              </h1>
              
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {video.owner?.avatar ? (
                      <img 
                        src={video.owner.avatar} 
                        alt={video.owner.fullName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500 bg-gray-300">
                        {video.owner?.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Link 
                      to={`/channel/${video.owner?.username}`} 
                      className="font-bold text-gray-900 hover:text-red-600 transition-colors block"
                    >
                      {video.owner?.fullName || 'Unknown'}
                    </Link>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>{formatViewCount(video.viewsCount || 0)} views</span>
                      <span className="mx-1">•</span>
                      <span>{formatUploadTime(video.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isLoved 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ThumbsUp size={18} />
                    <span>{isLoved ? 'Liked' : 'Like'}</span>
                  </button>
                  <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    <Share size={18} />
                  </button>
                  <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    <Save size={18} />
                  </button>
                  <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Description */}
        {video.description && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {video.description}
              </p>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h2>
            
            <div className="mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-500">
                    {localStorage.getItem('userInitial') || 'U'}
                  </div>
                </div>
                <form onSubmit={handleComment} className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a public comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows="3"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isCommenting}
                      className={`px-4 py-2 font-medium rounded-lg ${
                        !commentText.trim() || isCommenting
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isCommenting ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment, index) => (
                  <div key={comment._id || index} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {comment.avatar ? (
                        <img 
                          src={comment.avatar} 
                          alt={comment.fullName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 bg-gray-300">
                          {comment.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {comment.fullName || 'Unknown'}
                        </span>
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-gray-500 text-sm">
                          {formatUploadTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-400 mb-4">💬</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-600">Be the first to comment on this video</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;