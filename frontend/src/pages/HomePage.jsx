import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../toaster/UseToast.js";
import VideoCard, { VideoCardSkeleton } from "../components/VideoCard.jsx";

const BASE_URL = "http://localhost:5000/api/v1";

// ── Category filter chips ─────────────────────────────
const CATEGORIES = [
  "All", "Gaming", "Music", "News",
  "Sports", "Tech", "Education", "Comedy", "Travel"
];

export default function HomePage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/videos`, {
          params: {
            ...(category !== "All" && { category }),
          },
        });

        const fetchedVideos = response.data.data.videos || [];

        const normalizedVideos = fetchedVideos.map((video) => ({
          ...video,
          views:
            video.viewsCount ??
            video.views ??
            video.viewCount ??
            0,
        }));

        setVideos(normalizedVideos);

        if (normalizedVideos.length === 0) {
          toast.info("No videos found");
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Server not responding"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* ── Category Chips (FIXED — no horizontal scroll) ── */}
      <div className="sticky top-0 z-30 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-semibold
                  transition-all duration-200
                  ${category === cat
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.263a1 1 0
                     01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012
                     2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No videos yet
            </h3>

            <p className="text-sm text-gray-400 max-w-xs">
              {category !== "All"
                ? `No videos found in "${category}". Try another category.`
                : "Be the first to upload a video!"}
            </p>
          </div>
        )}

        {/* Video Grid */}
        {!loading && videos.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium mb-5">
              {videos.length} video
              {videos.length !== 1 ? "s" : ""} found
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
