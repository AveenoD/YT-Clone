import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../toaster/UseToast.js";
import { VideoCardSkeleton } from "../components/VideoCard";

import {
  ThumbsUp, Share2, Bell, BellOff,
  Send, Trash2, ChevronDown, ChevronUp,
  Eye, Calendar, MessageCircle, Clock  
} from "lucide-react";

const BASE_URL = "http://localhost:5000/api/v1";

// ── Helpers ───────────────────────────────────────────────────
function formatViews(views) {
  if (!views) return "0";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return `${views}`;
}

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
}

// ── Comment Item ──────────────────────────────────────────────
function CommentItem({ comment, currentUserId, onDelete }) {
  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {comment.owner?.avatar ? (
          <img src={comment.owner.avatar} alt={comment.owner.username}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500
                          flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {comment.owner?.username?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-800">
            @{comment.owner?.username || "unknown"}
          </span>
          <span className="text-xs text-gray-400">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed break-words">
          {comment.content}
        </p>
      </div>

      {/* Delete — only for comment owner */}
      {currentUserId && comment.owner?._id === currentUserId && (
        <button
          onClick={() => onDelete(comment._id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                     text-gray-300 hover:text-red-500 hover:bg-red-50
                     transition-all duration-150 flex-shrink-0"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ── Video Skeleton ────────────────────────────────────────────
function VideoSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="w-full aspect-video bg-gray-200 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded-full w-3/4" />
        <div className="h-4 bg-gray-100 rounded-full w-1/2" />
      </div>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-200 rounded-full w-1/3" />
          <div className="h-3 bg-gray-100 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  );
}

// ── Main VideoPage ────────────────────────────────────────────
export default function VideoPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { videoId } = useParams();              // ✅ get videoId from URL

  const [inWatchLater, setInWatchLater] = useState(false);
  const [video, setVideo] = useState(null);   // single object
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);     // array
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");     // string
  const [commentPosting, setCommentPosting] = useState(false);
  const [liked, setLiked] = useState(false);  // boolean
  const [subscribed, setSubscribed] = useState(false);  // boolean
  const [likeCount, setLikeCount] = useState(0);      // number
  const [showDesc, setShowDesc] = useState(false);  // toggle description

  // ── Auth helpers ─────────────────────────────────────────
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // ────────────────────────────────────────────────────────
  // Task 1 — Fetch video on load
  // GET /api/v1/videos/:videoId
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;   // guard — only run if videoId exists

    async function fetchVideo() {
      setLoading(true);


      try {
        const response = await axios.get(
          `${BASE_URL}/videos/${videoId}`,   // ✅ template literal with real videoId
          { headers }
        );

        const fetchedVideo = response.data.data;   // single video object
        setInWatchLater(fetchedVideo.inWatchLater || false);
        if (!fetchedVideo) {
          toast.info("Video not found");
          navigate("/");    // redirect home if video doesn't exist
          return;
        }

        setVideo(fetchedVideo);

        // ✅ Set extra states from video data
        // (backend should include these in the response)
        setLiked(fetchedVideo.isLiked || false);
        setSubscribed(fetchedVideo.isSubscribed || false);
        setLikeCount(fetchedVideo.likeCount || 0)

      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load video"
        );
        navigate("/");
      } finally {
        setLoading(false);   // ✅ always runs
      }
    }

    fetchVideo();
    
  }, [videoId]);   
  useEffect(() => {
    if (!videoId) return;

    async function fetchComments() {
      setCommentsLoading(true);

      try {
        const response = await axios.get(
          `${BASE_URL}/comments/video/${videoId}`

        );

        // adjust key based on your backend response
        const fetchedComments = response.data.data || [];
        setComments(fetchedComments);

      } catch (error) {
        // fail silently — comments not loading shouldn't break the page
        toast.error("Failed to load comments");
      } finally {
        setCommentsLoading(false);
      }
    }

    fetchComments();
  }, [videoId]);

 
  async function handleLike() {
    if (!token) {
      toast.warning("Please login to like videos");
      navigate("/login");
      return;
    }

    const wasLiked = liked;
    const prevCount = likeCount;

    setLiked(!wasLiked);
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      const response = await axios.post(
        `${BASE_URL}/likes/toggle/video/${videoId}`,
        {},
        { headers }

      );
      setLiked(response.data.data.liked)
      setLikeCount(response.data.data.totalLikes)


      toast.success(wasLiked ? "Like removed" : "Video liked! 👍");

    } catch (error) {
      // ✅ Rollback optimistic update if API fails
      setLiked(wasLiked);
      setLikeCount(prevCount);
      toast.error("Failed to update like");
    }
  }

  async function handleSubscribe() {
    if (!token) {
      toast.warning("Please login to subscribe");
      navigate("/login");
      return;
    }

    const channelId = video?.owner?._id;
    if (!channelId) {
      toast.error("Channel not found");
      return;
    }

    const wasSubscribed = subscribed;
    setSubscribed(!wasSubscribed);

    try {
      // ✅ Save to response variable
      const response = await axios.post(
        `${BASE_URL}/subscriptions/subscribe/${channelId}`,
        {},
        { headers }
      );

      // ✅ Now response exists and can be read
      setSubscribed(response.data.data.subscribed);
      toast.success(
        wasSubscribed
          ? "Unsubscribed successfully"
          : `Subscribed to ${video?.owner?.fullName || video?.owner?.username}! 🔔`
      );

    } catch (error) {
      setSubscribed(wasSubscribed);
      
      toast.error(error.response?.data?.message || "Failed to update subscription");
    }
  }
  
  async function handleComment(e) {
    e.preventDefault();   // prevent page refresh

    if (!token) {
      toast.warning("Please login to comment");
      navigate("/login");
      return;
    }

    if (!newComment.trim()) {
      toast.warning("Comment cannot be empty");
      return;
    }

    setCommentPosting(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/comments/video/${videoId}`,
        { content: newComment },   // body — what the user typed
        { headers }                // token for auth
      );

      const postedComment = response.data.data;

      // ✅ Add to beginning of array — no need to refetch all comments
      // This is faster and the user sees their comment immediately
      setComments(prev => [postedComment, ...prev]);

      setNewComment("");    // ✅ clear the input
      toast.success("Comment posted! 💬");

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to post comment"
      );
    } finally {
      setCommentPosting(false);
    }
  }

  
  async function handleDeleteComment(commentId) {
    try {
      await axios.delete(
        `${BASE_URL}/comments/${commentId}`,
        { headers }
      );

      // ✅ Remove from array directly — no refetch needed
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success("Comment deleted");

    } catch (error) {
      toast.error("Failed to delete comment");
    }
  }

 async function handleWatchLater() {
      if (!token) {
        toast.warning("Please login to save videos");
        navigate("/login");
        return;
      }

      const wasInWatchLater = inWatchLater;
      setInWatchLater(!wasInWatchLater);

      try {
        if (wasInWatchLater) {
          // Remove from watch later
          await axios.delete(
            `${BASE_URL}/users/watch-later/${videoId}`,
            { headers }
          );
          toast.success("Removed from Watch Later");
        } else {
          // Add to watch later
          await axios.post(
            `${BASE_URL}/users/watch-later/${videoId}`,
            {},
            { headers }
          );
          toast.success("Added to Watch Later 🕐");
        }
      } catch (error) {
        setInWatchLater(wasInWatchLater); // rollback
        toast.error("Failed to update");
      }
    }
    
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Loading skeleton ──────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VideoSkeleton />
            </div>
          </div>
        )}

        {/* ── Main content ──────────────────────────────── */}
        {!loading && video && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT — Video + Info + Comments ────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* ── Video player ────────────────────────── */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden
                              bg-black shadow-lg">
                <video
                  src={video.videoFile}
                  poster={video.thumbnail}
                  controls
                  autoPlay={false}
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* ── Title ───────────────────────────────── */}
              <h1 className="text-lg sm:text-xl font-bold text-gray-900
                             leading-snug">
                {video.title}
              </h1>

              {/* ── Stats + Actions row ─────────────────── */}
              <div className="flex flex-wrap items-center justify-between
                              gap-4 pb-4 border-b border-gray-200">

                {/* Views + date */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Eye size={15} strokeWidth={2} />
                    {formatViews(video.viewsCount)} views   {/* ✅ viewsCount not views */}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={15} strokeWidth={2} />
                    {formatDate(video.createdAt)}
                  </span>
                </div>

                {/* Like + Share buttons */}
                <div className="flex items-center gap-2">

                  {/* Like button */}
                  <button
                    onClick={handleLike}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full
                      text-sm font-semibold transition-all duration-200
                      ${liked
                        ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
                    `}
                  >
                    <ThumbsUp
                      size={16}
                      strokeWidth={2.5}
                      className={liked ? "fill-white" : ""}
                    />
                    {likeCount > 0 && (
                      <span>{formatViews(likeCount)}</span>
                    )}
                    <span>{liked ? "Liked" : "Like"}</span>
                  </button>

                  {/* Share button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard! 🔗");
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full
                               bg-gray-100 text-gray-600 text-sm font-semibold
                               hover:bg-gray-200 transition-all duration-200"
                  >
                    <Share2 size={16} strokeWidth={2} />
                    Share
                  </button>
                  <button
                    onClick={handleWatchLater}
                    className={`
    flex items-center gap-2 px-4 py-2 rounded-full
    text-sm font-semibold transition-all duration-200
    ${inWatchLater
                        ? "bg-amber-100 text-amber-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
  `}
                  >
                    <Clock size={16} strokeWidth={2} />
                    {inWatchLater ? "Saved" : "Watch Later"}
                  </button>
                </div>
              </div>

              {/* ── Channel info + Subscribe ─────────────── */}
              <div className="flex items-center justify-between gap-4 py-2">
                <Link
                  to={`/channel/${video.owner?._id}`}
                  className="flex items-center gap-3 group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden
                                  ring-2 ring-transparent group-hover:ring-rose-200
                                  transition-all duration-200 flex-shrink-0">
                    {video.owner?.avatar ? (
                      <img src={video.owner.avatar}
                        alt={video.owner.fullName}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br
                                      from-indigo-400 to-purple-500
                                      flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {video.owner?.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name + subscribers */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900
                                  group-hover:text-rose-600 transition-colors">
                      {video.owner?.fullName || video.owner?.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      @{video.owner?.username}
                    </p>
                  </div>
                </Link>

                {/* Subscribe button */}
                <button
                  onClick={handleSubscribe}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-full
                    text-sm font-semibold transition-all duration-200
                    ${subscribed
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-gray-900 text-white hover:bg-gray-700 shadow-md"
                    }
                  `}
                >
                  {subscribed
                    ? <><BellOff size={15} strokeWidth={2} /> Subscribed</>
                    : <><Bell size={15} strokeWidth={2} /> Subscribe</>
                  }
                </button>
              </div>

              {/* ── Description ─────────────────────────── */}
              {video.description && (
                <div className="bg-gray-100 rounded-2xl p-4">
                  <p className={`text-sm text-gray-700 leading-relaxed
                                 whitespace-pre-wrap
                                 ${!showDesc ? "line-clamp-3" : ""}`}>
                    {video.description}
                  </p>
                  <button
                    onClick={() => setShowDesc(!showDesc)}
                    className="flex items-center gap-1 mt-2 text-xs
                               font-semibold text-gray-500 hover:text-gray-800
                               transition-colors"
                  >
                    {showDesc
                      ? <><ChevronUp size={14} /> Show less</>
                      : <><ChevronDown size={14} /> Show more</>
                    }
                  </button>
                </div>
              )}

              {/* ── Comments section ─────────────────────── */}
              <div className="space-y-5 pt-2">

                {/* Comments header */}
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} strokeWidth={2}
                    className="text-gray-600" />
                  <h2 className="text-base font-bold text-gray-900">
                    {comments.length} Comments
                  </h2>
                </div>

                {/* Comment input */}
                <form onSubmit={handleComment} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="You"
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br
                                      from-indigo-400 to-purple-500
                                      flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {currentUser?.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-100 border border-transparent
                                 focus:border-indigo-400 focus:bg-white
                                 focus:ring-4 focus:ring-indigo-100
                                 rounded-full px-4 py-2 text-sm text-gray-800
                                 placeholder:text-gray-300 outline-none
                                 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={commentPosting || !newComment.trim()}
                      className="w-9 h-9 flex-shrink-0 rounded-full
                                 bg-indigo-500 hover:bg-indigo-600
                                 disabled:opacity-40 disabled:cursor-not-allowed
                                 flex items-center justify-center
                                 text-white transition-all duration-200"
                    >
                      <Send size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </form>

                {/* Comments list */}
                <div className="space-y-5">
                  {commentsLoading && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 bg-gray-200 rounded-full w-1/4" />
                            <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!commentsLoading && comments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No comments yet. Be the first to comment!
                    </p>
                  )}

                  {!commentsLoading && comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      currentUserId={currentUser?._id}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                </div>

              </div>
            </div>

            {/* ── RIGHT — Sidebar info on desktop ───────── */}
            <div className="hidden lg:block space-y-4">
              <div className="bg-white rounded-2xl p-4
                              shadow-sm ring-1 ring-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  About the Channel
                </h3>
                <Link
                  to={`/channel/${video.owner?._id}`}
                  className="flex items-center gap-3 mb-3"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {video.owner?.avatar ? (
                      <img src={video.owner.avatar} alt={video.owner.fullName}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br
                                      from-indigo-400 to-purple-500
                                      flex items-center justify-center">
                        <span className="text-white font-bold">
                          {video.owner?.fullName?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {video.owner?.fullName}
                    </p>
                    <p className="text-xs text-gray-400">
                      @{video.owner?.username}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleSubscribe}
                  className={`
                    w-full py-2.5 rounded-full text-sm font-semibold
                    transition-all duration-200
                    ${subscribed
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                    }
                  `}
                >
                  {subscribed ? "✓ Subscribed" : "Subscribe"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}