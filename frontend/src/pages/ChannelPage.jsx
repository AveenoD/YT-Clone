import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../toaster/UseToast.js";
import VideoCard, { VideoCardSkeleton } from "../components/VideoCard";
import { Bell, BellOff, PlaySquare, Users, MessageSquare, Clock, Heart } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL ;

function formatCount(num) {
  if (!num) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return `${num}`;
}

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) return new Date(date).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export default function ChannelPage() {
  const { userId }  = useParams();
  const navigate    = useNavigate();
  const toast       = useToast();

  const [channel, setChannel]     = useState(null);
  const [videos, setVideos]       = useState([]);
  const [tweets, setTweets]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [subscribed, setSubscribed]   = useState(false);
  const [subLoading, setSubLoading]   = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const token   = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  // Check if viewing own channel
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isOwnChannel = currentUser?._id === userId;

  useEffect(() => {
    if (!userId) return;

    async function fetchChannelData() {
      setLoading(true);

      try {
        const [channelRes, videosRes, tweetsRes] = await Promise.all([
          axios.get(`${BASE_URL}/users/c/${userId}`, { headers }),
          axios.get(`${BASE_URL}/videos?userId=${userId}`, { headers }),
          axios.get(`${BASE_URL}/tweets/user/${userId}`, { headers })
        ]);

        setChannel(channelRes.data.data);
        
        // Normalize views field
        const fetchedVideos = videosRes.data.data.videos || [];
        const normalizedVideos = fetchedVideos.map(video => ({
          ...video,
          views: video.viewsCount ?? video.views ?? 0
        }));
        setVideos(normalizedVideos);
        
        setTweets(tweetsRes.data.data.tweets || []);
        setSubscribed(channelRes.data.data.isSubscribed || false);
        setSubscribersCount(channelRes.data.data.subscribersCount || 0);

      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load channel"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchChannelData();
  }, [userId]);

  async function handleSubscribe() {
    if (!token) {
      toast.warning("Please login to subscribe");
      navigate("/login");
      return;
    }

    const wasSubscribed = subscribed;
    setSubscribed(!wasSubscribed);
    setSubscribersCount(prev => wasSubscribed ? prev - 1 : prev + 1);
    setSubLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/subscriptions/subscribe/${userId}`,
        {},
        { headers }
      );
      setSubscribed(response.data.data.subscribed);
      setSubscribersCount(response.data.data.totalSubscribers);
      toast.success(
        response.data.data.subscribed
          ? `Subscribed to ${channel?.fullName || channel?.username}! 🔔`
          : "Unsubscribed successfully"
      );
    } catch (error) {
      setSubscribed(wasSubscribed);
      setSubscribersCount(prev => wasSubscribed ? prev + 1 : prev - 1);
      toast.error(error.response?.data?.message || "Failed to update subscription");
    } finally {
      setSubLoading(false);
    }
  }

  // ✅ ADD: Handle like for tweets on ChannelPage
  async function handleLike(tweetId) {
    if (!token) {
      toast.warning("Please login to like");
      navigate("/login");
      return;
    }

    try {
      // ✅ Optimistic update (same as TweetsPage)
      setTweets(prev => prev.map(tweet => {
        if (tweet._id === tweetId) {
          const isLiked = tweet.isLiked || false;
          return {
            ...tweet,
            isLiked: !isLiked,
            likeCount: isLiked ? (tweet.likeCount - 1) : (tweet.likeCount + 1)
          };
        }
        return tweet;
      }));

      await axios.post(
        `${BASE_URL}/likes/toggle/tweet/${tweetId}`,
        {},
        { headers }
      );

    } catch (error) {
      toast.error("Failed to like post");
      // ✅ Rollback: refetch tweets on error
      try {
        const tweetsRes = await axios.get(
          `${BASE_URL}/tweets/user/${userId}`,
          { headers }
        );
        setTweets(tweetsRes.data.data.tweets || []);
      } catch (e) {
        // Silent fail on rollback
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Loading state */}
      {loading && (
        <div>
          <div className="w-full h-40 sm:h-52 bg-gray-200 animate-pulse" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start
                            sm:items-end gap-4 -mt-10 mb-8">
              <div className="w-24 h-24 rounded-full bg-gray-300
                              animate-pulse ring-4 ring-white flex-shrink-0" />
              <div className="space-y-2 pb-2">
                <div className="h-5 w-40 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-3.5 w-24 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2
                            lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Channel content */}
      {!loading && channel && (
        <div>

          {/* Cover image */}
          <div className="w-full h-40 sm:h-56 overflow-hidden bg-gradient-to-br
                          from-indigo-400 via-purple-500 to-rose-400">
            {channel.coverImage && (
              <img
                src={channel.coverImage}
                alt="Channel cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Channel info */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end
                            sm:justify-between gap-4 -mt-12 mb-8">

              {/* Avatar + name */}
              <div className="flex flex-col sm:flex-row items-start
                              sm:items-end gap-4">

                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden
                                ring-4 ring-white shadow-lg flex-shrink-0">
                  {channel.avatar ? (
                    <img
                      src={channel.avatar}
                      alt={channel.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br
                                    from-indigo-400 to-purple-500
                                    flex items-center justify-center">
                      <span className="text-white text-3xl font-black">
                        {channel.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + username + stats */}
                <div className="pb-1">
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">
                    {channel.fullName}
                  </h1>
                  <p className="text-sm text-gray-400 font-medium mt-0.5">
                    @{channel.username}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5
                                     text-xs text-gray-500 font-medium">
                      <Users size={13} strokeWidth={2} />
                      {formatCount(subscribersCount)} subscribers
                    </span>
                    <span className="flex items-center gap-1.5
                                     text-xs text-gray-500 font-medium">
                      <PlaySquare size={13} strokeWidth={2} />
                      {videos.length} videos
                    </span>
                    <span className="flex items-center gap-1.5
                                     text-xs text-gray-500 font-medium">
                      <MessageSquare size={13} strokeWidth={2} />
                      {tweets.length} posts
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscribe button (only for other channels) */}
              {!isOwnChannel && (
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-full
                    text-sm font-bold transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${subscribed
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-900 text-white hover:bg-gray-700 shadow-md"
                    }
                  `}
                >
                  {subscribed
                    ? <><BellOff size={15} strokeWidth={2.5} /> Subscribed</>
                    : <><Bell size={15} strokeWidth={2.5} /> Subscribe</>
                  }
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors
                              ${activeTab === "videos" 
                                ? "border-gray-900 text-gray-900" 
                                : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  <div className="flex items-center gap-2">
                    <PlaySquare size={16} strokeWidth={2} />
                    Videos
                    {videos.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 
                                       text-xs font-bold rounded-full">
                        {videos.length}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("posts")}
                  className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors
                              ${activeTab === "posts" 
                                ? "border-gray-900 text-gray-900" 
                                : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} strokeWidth={2} />
                    Posts
                    {tweets.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 
                                       text-xs font-bold rounded-full">
                        {tweets.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Videos section */}
            {activeTab === "videos" && (
              <div className="pb-10">
                {videos.length === 0 && (
                  <div className="flex flex-col items-center justify-center
                                  py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100
                                    flex items-center justify-center mb-3">
                      <PlaySquare size={28} className="text-gray-300"
                        strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      No videos yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      This channel hasn't uploaded any videos
                    </p>
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2
                                  lg:grid-cols-3 xl:grid-cols-4
                                  gap-x-4 gap-y-8">
                    {videos.map((video) => (
                      <VideoCard key={video._id} video={video} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Posts section */}
            {activeTab === "posts" && (
              <div className="pb-10">
                {tweets.length === 0 && (
                  <div className="flex flex-col items-center justify-center
                                  py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100
                                    flex items-center justify-center mb-3">
                      <MessageSquare size={28} className="text-gray-300"
                        strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      No posts yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      This channel hasn't posted anything
                    </p>
                  </div>
                )}

                {tweets.length > 0 && (
                  <div className="max-w-2xl space-y-4">
                    {tweets.map((tweet) => (
                      <div key={tweet._id}
                           className="bg-white rounded-2xl p-5 shadow-sm
                                      hover:shadow-md transition-shadow">
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            {tweet.owner?.avatar ? (
                              <img src={tweet.owner.avatar} alt={tweet.owner.username}
                                   className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br
                                              from-blue-400 to-purple-500
                                              flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {tweet.owner?.username?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {tweet.owner?.fullName || tweet.owner?.username}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>@{tweet.owner?.username}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} strokeWidth={2} />
                                {timeAgo(tweet.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                          {tweet.content}
                        </p>

                        {/* ✅ FIX: Like button with onClick handler */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleLike(tweet._id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors
                                        ${tweet.isLiked 
                                          ? "text-rose-500" 
                                          : "text-gray-400 hover:text-rose-500"}`}
                          >
                            <Heart 
                              size={16} 
                              strokeWidth={2}
                              className={tweet.isLiked ? "fill-rose-500" : ""} 
                            />
                            {tweet.likeCount > 0 && (
                              <span className="font-semibold">{tweet.likeCount}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Channel not found */}
      {!loading && !channel && (
        <div className="flex flex-col items-center justify-center
                        min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100
                          flex items-center justify-center mb-4">
            <Users size={32} className="text-gray-300" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-gray-700 mb-1">
            Channel not found
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            This channel doesn't exist or was removed
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-full
                       text-sm font-semibold hover:bg-gray-700
                       transition-colors duration-200"
          >
            Go Home
          </button>
        </div>
      )}

    </div>
  );
}