import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import axios                   from "axios";
import { useToast }            from "../toaster/UseToast.js";
import VideoCard, { VideoCardSkeleton } from "../components/Videocard";
import { Clock, Trash2 }       from "lucide-react";

const BASE_URL = "http://localhost:5000/api/v1";

export default function WatchLaterPage() {
  const toast    = useToast();
  const navigate = useNavigate();

  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(false);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetch watch later videos ───────────────────────────
  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    async function fetchWatchLater() {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/users/watch-later`,
          { headers }
        );
        setVideos(response.data.data || []);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load watch later"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchWatchLater();
  }, []);

  // ── Remove from watch later ────────────────────────────
  async function handleRemove(videoId) {
    try {
      await axios.delete(
        `${BASE_URL}/users/watch-later/${videoId}`,
        { headers }
      );
      // Remove from UI immediately
      setVideos(prev => prev.filter(v => v._id !== videoId));
      toast.success("Removed from Watch Later");
    } catch (error) {
      toast.error("Failed to remove video");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100
                            flex items-center justify-center">
              <Clock size={20} className="text-amber-500" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Watch Later
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Videos saved for later
              </p>
            </div>
          </div>

          {videos.length > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-600
                             text-xs font-bold rounded-full">
              {videos.length} video{videos.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Loading ───────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2
                          lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ───────────────────────────── */}
        {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center
                          py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100
                            flex items-center justify-center mb-4">
              <Clock size={32} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-gray-600 mb-1">
              No videos saved
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Save videos to watch them later
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full
                         text-sm font-bold hover:bg-gray-700
                         transition-colors duration-200"
            >
              Browse Videos
            </button>
          </div>
        )}

        {/* ── Video grid with remove buttons ─────────── */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2
                          lg:grid-cols-3 xl:grid-cols-4
                          gap-x-4 gap-y-8">
            {videos.map((video) => (
              <div key={video._id} className="relative group">
                <VideoCard video={video} />
                
                {/* Remove button — shows on hover */}
                <button
                  onClick={() => handleRemove(video._id)}
                  className="absolute top-2 right-2 w-8 h-8
                             bg-red-500 hover:bg-red-600 text-white
                             rounded-full shadow-lg opacity-0
                             group-hover:opacity-100
                             transition-all duration-200
                             flex items-center justify-center z-10"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}