import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../toaster/UseToast.js";
import VideoCard, { VideoCardSkeleton } from "../components/VideoCard";
import { Bell, BellOff, PlaySquare, Users } from "lucide-react";

const BASE_URL = "http://localhost:5000/api/v1";

function formatCount(num) {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return `${num}`;
}

export default function ChannelPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);

    // Subscribe UI states
    const [subscribed, setSubscribed] = useState(false);
    const [subLoading, setSubLoading] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        async function fetchChannelData() {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                const [channelRes, videosRes] = await Promise.all([
                    axios.get(`${BASE_URL}/users/c/${userId}`, { headers }),
                    axios.get(`${BASE_URL}/videos?userId=${userId}`, { headers })
                ]);

                const channelData = channelRes.data.data;
                setChannel(channelData);
                setVideos(videosRes.data.data.videos || []);
                setSubscribed(channelData.isSubscribed || false);
                setSubscribersCount(channelData.subscribersCount || 0);
            } catch (error) {
                toast.error("Failed to load channel");
            } finally {
                setLoading(false);
            }
        }

        fetchChannelData();
    }, [userId]);

    async function handleSubscribe() {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.warning("Please login to subscribe");
            navigate("/login");
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const wasSubscribed = subscribed;

        // ✅ Optimistic UI update
        setSubscribed(!wasSubscribed);
        setSubscribersCount(prev => wasSubscribed ? prev - 1 : prev + 1);
        setSubLoading(true);

        try {
            const response = await axios.post(
                `${BASE_URL}/subscriptions/subscribe/${userId}`,
                {},
                { headers }
            );

            const { subscribed: newSubscribed, totalSubscribers } = response.data.data;

            // ✅ Sync all states with server response
            setSubscribed(newSubscribed);
            setSubscribersCount(totalSubscribers);
            setChannel(prev => prev ? {
                ...prev,
                isSubscribed: newSubscribed,
                subscribersCount: totalSubscribers
            } : prev);

            toast.success(response.data.message || "Subscription updated");
        } catch (error) {
            // ✅ Rollback on error
            setSubscribed(wasSubscribed);
            setSubscribersCount(prev => wasSubscribed ? prev + 1 : prev - 1);
            
            // Handle expired/invalid token
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
                toast.error("Session expired. Please login again.");
                return;
            }
            
            toast.error("Failed to update subscription");
        } finally {
            setSubLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Loading state ──────────────────────────────── */}
            {loading && (
                <div>
                    <div className="w-full h-40 sm:h-52 bg-gray-200 animate-pulse" />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-8">
                            <div className="w-24 h-24 rounded-full bg-gray-300 animate-pulse ring-4 ring-white flex-shrink-0" />
                            <div className="space-y-2 pb-2">
                                <div className="h-5 w-40 bg-gray-200 rounded-full animate-pulse" />
                                <div className="h-3.5 w-24 bg-gray-100 rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <VideoCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Channel content ────────────────────────────── */}
            {!loading && channel && (
                <div>
                    {/* ── Cover image ──────────────────────────── */}
                    <div className="w-full h-40 sm:h-56 overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-500 to-rose-400">
                        {channel.coverImage && (
                            <img
                                src={channel.coverImage}
                                alt="Channel cover"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    {/* ── Channel info ─────────────────────────── */}
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-8">

                            {/* Avatar + name */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg flex-shrink-0">
                                    {channel.avatar ? (
                                        <img
                                            src={channel.avatar}
                                            alt={channel.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                            <span className="text-white text-3xl font-black">
                                                {channel.fullName?.charAt(0)?.toUpperCase() || "?"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Name + username + stats */}
                                <div className="pb-1">
                                    <h1 className="text-xl font-black text-white tracking-tight">
                                        {channel.fullName}
                                    </h1>
                                    <p className="text-sm text-gray-400 font-medium mt-0.5">
                                        @{channel.username}
                                    </p>

                                    {/* Stats row - ✅ FIXED: uses subscribersCount state */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Users size={13} strokeWidth={2} />
                                            {formatCount(subscribersCount || 0)} subscribers
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <PlaySquare size={13} strokeWidth={2} />
                                            {videos.length} videos
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Subscribe button */}
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
                        </div>

                        {/* ── Divider ────────────────────────────── */}
                        <div className="border-b border-gray-200 mb-6" />

                        {/* ── Videos section ───────────────────── */}
                        <div className="pb-10">
                            <h2 className="text-base font-bold text-gray-900 mb-5">
                                Videos
                            </h2>

                            {/* Empty state */}
                            {videos.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                        <PlaySquare size={28} className="text-gray-300" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">
                                        No videos yet
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        This channel hasn't uploaded any videos
                                    </p>
                                </div>
                            )}

                            {/* Video grid */}
                            {videos.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                                    {videos.map((video) => (
                                        <VideoCard key={video._id} video={video} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Channel not found ──────────────────────────── */}
            {!loading && !channel && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
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
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors duration-200"
                    >
                        Go Home
                    </button>
                </div>
            )}

        </div>
    );
}