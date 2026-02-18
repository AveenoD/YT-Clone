import { Link, useNavigate } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(views) {
  const viewCount = views ?? 0;
  if (!viewCount) return "0 views";
  if (viewCount >= 1_000_000)
    return `${(viewCount / 1_000_000).toFixed(1)}M views`;
  if (viewCount >= 1_000) return `${(viewCount / 1_000).toFixed(1)}K views`;
  return `${viewCount} views`;
}

function timeAgo(date) {
  if (!date) return "";
  const diff    = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours   / 24);
  const weeks   = Math.floor(days    / 7);
  const months  = Math.floor(days    / 30);
  const years   = Math.floor(days    / 365);

  if (years   > 0) return `${years} year${years   > 1 ? "s" : ""} ago`;
  if (months  > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks   > 0) return `${weeks} week${weeks   > 1 ? "s" : ""} ago`;
  if (days    > 0) return `${days} day${days     > 1 ? "s" : ""} ago`;
  if (hours   > 0) return `${hours} hour${hours   > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

// ── VideoCard Skeleton ────────────────────────────────────────
export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {/* Thumbnail */}
      <div className="w-full aspect-video bg-gray-200 rounded-2xl" />

      {/* Info row */}
      <div className="flex gap-2 sm:gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />

        {/* Text lines */}
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 bg-gray-200 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ── VideoCard ─────────────────────────────────────────────────
export default function VideoCard({ video }) {
  const navigate = useNavigate();

  if (!video) return null;

  const {
    _id,
    title       = "Untitled Video",
    thumbnail,
    duration,
    views       = 0,
    viewCount,
    totalViews,
    statistics,
    createdAt,
    owner       = {},
  } = video;

  const resolvedViews =
    views || viewCount || totalViews || statistics?.views || 0;

  return (
    <div className="flex flex-col gap-2 sm:gap-3 group cursor-pointer">

      {/* ── Thumbnail ─────────────────────────────────── */}
      <div
        onClick={() => navigate(`/video/${_id}`)}
        className="relative w-full aspect-video overflow-hidden
                   rounded-xl sm:rounded-2xl bg-gray-100 cursor-pointer"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover
                       group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br
                          from-gray-200 to-gray-300
                          flex items-center justify-center">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1
                   1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        {/* Duration badge — slightly larger on mobile for readability */}
        {duration && (
          <span
            className="absolute bottom-2 right-2
                       bg-black/80 text-white
                       text-[10px] sm:text-[11px]
                       font-bold px-1.5 py-0.5
                       rounded-md leading-none tracking-wide"
          >
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* ── Info row ──────────────────────────────────── */}
      <div className="flex gap-2 sm:gap-3">

        {/* Avatar */}
        <Link
          to={`/channel/${owner._id}`}
          className="flex-shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden
                       ring-2 ring-transparent
                       hover:ring-rose-200 transition-all duration-200"
          >
            {owner.avatar ? (
              <img
                src={owner.avatar}
                alt={owner.fullName || owner.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full bg-gradient-to-br
                            from-indigo-400 to-purple-500
                            flex items-center justify-center"
              >
                <span className="text-white text-[11px] sm:text-xs font-bold">
                  {owner.fullName?.charAt(0)?.toUpperCase() ||
                   owner.username?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Text */}
        <div className="flex-1 min-w-0">

          {/* Title */}
          <h3
            onClick={() => navigate(`/video/${_id}`)}
            className="text-[13px] sm:text-sm font-semibold text-gray-900
                       leading-snug line-clamp-2
                       group-hover:text-rose-600
                       transition-colors duration-150 cursor-pointer"
          >
            {title}
          </h3>

          {/* Channel name */}
          <Link
            to={`/channel/${owner._id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] sm:text-xs text-gray-500 font-medium
                       mt-0.5 block hover:text-gray-800
                       transition-colors duration-150 truncate"
          >
            {owner.fullName || owner.username || "Unknown Channel"}
          </Link>

          {/* Views · time */}
          <p className="text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
            {formatViews(resolvedViews)}
            {createdAt && (
              <span className="text-gray-400"> · {timeAgo(createdAt)}</span>
            )}
          </p>

        </div>
      </div>

    </div>
  );
}