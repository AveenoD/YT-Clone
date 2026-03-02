import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../toaster/UseToast";
import axios from "axios";
import {
  Home,
  Compass,
  ThumbsUp,
  History,
  PlaySquare,
  Clock,
  Flame,
  Music2,
  Gamepad2,
  Newspaper,
  Trophy,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Tv2,
  Loader2,
  MessageSquare
} from "lucide-react";

const BASE_URL = "http://localhost:5000/api/v1";

// ── Reusable NavItem ──────────────────────────────────────────
function NavItem({ to, icon: Icon, label, isActive, onClick, badge }) {
  const base = `
    flex items-center gap-3.5 px-3 py-2.5 rounded-xl w-full
    text-sm font-medium transition-all duration-150 group relative
  `;
  const active = "bg-rose-50 text-rose-600 font-semibold";
  const inactive = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const toast = useToast();
  const content = (
    <>
      <Icon
        size={19}
        strokeWidth={isActive ? 2.5 : 2}
        className={`flex-shrink-0 transition-colors
          ${isActive ? "text-rose-500" : "text-gray-400 group-hover:text-gray-700"}`}
      />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-[11px] font-bold bg-rose-500 text-white
                         rounded-full min-w-[18px] h-[18px] flex items-center
                         justify-center px-1 leading-none">
          {badge}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} ${isActive ? active : inactive}`}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={`${base} ${isActive ? active : inactive}`}>
      {content}
    </Link>
  );
}

// ── Section Divider ───────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div className="pt-4 pb-1 px-3">
      {label
        ? <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        : <div className="h-px bg-gray-100" />
      }
    </div>
  );
}

// ── Channel Skeleton ──────────────────────────────────────────
function ChannelSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
      <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 h-3 bg-gray-200 rounded-full animate-pulse" />
    </div>
  );
}

// ── User Footer Skeleton ──────────────────────────────────────
function UserFooterSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 w-24 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-2.5 w-16 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {   // ✅ named function
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const pathname = location.pathname;

  // ── States ───────────────────────────────────────────────
  const [user, setUser] = useState(null);       // ✅ null default
  const [userLoading, setUserLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [watchLaterCount, setWatchLaterCount] = useState(0);
  // ── Fetch current user from API ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUserLoading(false);
      setChannelsLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${BASE_URL}/users/current-user`, { headers })
      .then((res) => {
        const currentUser = res.data.data;

        // ✅ Guard — only proceed if user exists and has _id
        if (!currentUser || !currentUser._id) {
          setChannelsLoading(false);
          return;
        }

        setUser(currentUser);

        // ✅ Safe now — _id is confirmed to exist
        return axios.get(
          `${BASE_URL}/subscriptions/user/${currentUser._id}/subscribed-channels`,
          { headers }
        );
      })
      .then((res) => {
        // ✅ Guard — only set if response exists
        if (!res) return;
        const subscribedChannels = res.data.data.subscribedChannels || [];
        const flatChannels = subscribedChannels.map(item => item.channel);
        setChannels(flatChannels);

      })
      .catch((err) => {
        toast.error("Failed to load user data");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      })
      .finally(() => {
        setUserLoading(false);
        setChannelsLoading(false);
      });

  }, []); // runs once on mount

  // ── Close on outside click (mobile) ─────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // ── Close on route change (mobile) ──────────────────────
  useEffect(() => {
    onClose?.();
  }, [pathname]);

  // ── Logout ───────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/30 backdrop-blur-sm
          transition-opacity duration-300 lg:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ───────────────────────────────── */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-white border-r border-gray-100
          shadow-[4px_0_24px_rgba(0,0,0,0.06)]
          flex flex-col
          transition-transform duration-300 ease-out
          lg:top-16 lg:h-[calc(100vh-4rem)]
          lg:translate-x-0 lg:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >

        {/* ── Mobile logo header ───────────────────────── */}
        <div className="lg:hidden flex items-center justify-between px-4 h-16
                        border-b border-gray-100 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600
                            flex items-center justify-center">
              <Tv2 size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-black tracking-tight">
              <span className="text-gray-900">Stream</span>
              <span className="bg-gradient-to-r from-rose-500 to-pink-500
                               bg-clip-text text-transparent">Tube</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-gray-400 hover:text-gray-700 hover:bg-gray-100
                       transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable content ───────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2
                        scrollbar-thin scrollbar-thumb-gray-200">

          {/* ── MAIN NAVIGATION ──────────────────────── */}
          <div className="space-y-0.5">
            <NavItem to="/" icon={Home} label="Home" isActive={pathname === "/"} />
            <NavItem to="/commingsoon" icon={Compass} label="Explore" isActive={pathname === "/commingsoon"} />
            <NavItem to="/commingsoon" icon={Flame} label="Trending" isActive={pathname === "/commingsoon"} />
          </div>

          <SectionDivider />

          {/* ── YOUR LIBRARY ─────────────────────────── */}
          <SectionDivider label="Your Library" />
          <div className="space-y-0.5">
            <NavItem to="/history" icon={History} label="Watch History" isActive={pathname === "/history"} />
            <NavItem to="/liked" icon={ThumbsUp} label="Liked Videos" isActive={pathname === "/liked"} />
            <NavItem
              to="/watchlater"
              icon={Clock}
              label="Watch Later"
              isActive={pathname === "/watchlater"}
              badge={watchLaterCount > 0 ? watchLaterCount : undefined}  // ✅ dynamic
            />
            <NavItem
              to="/posts"
              icon={MessageSquare}
              label="Posts"
              isActive={pathname === "/posts"}
            />
            <NavItem to="/profile" icon={PlaySquare} label="My Videos" isActive={pathname === "/profile"} />
          </div>

          <SectionDivider />

          {/* ── SUBSCRIPTIONS ────────────────────────── */}
          <SectionDivider label="Subscriptions" />
          <div className="space-y-0.5">

            {/* Loading skeletons */}
            {channelsLoading && (
              <>
                <ChannelSkeleton />
                <ChannelSkeleton />
                <ChannelSkeleton />
              </>
            )}

            {/* Empty state */}
            {!channelsLoading && channels.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-300 italic">
                No subscriptions yet
              </p>
            )}

            {/* Real channels from API */}
            {!channelsLoading && channels.map((channel) => (
              <Link
                key={channel._id || channel.id}
                to={`/channel/${channel._id || channel.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl
                           hover:bg-gray-100 transition-all duration-150 group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                    {channel.avatar ? (
                      <img
                        src={channel.avatar}
                        alt={channel.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500
                                      flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">
                          {channel.username?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Live dot */}
                  {channel.isLive && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5
                                     bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <span className="text-sm text-gray-600 font-medium truncate
                                 group-hover:text-gray-900 transition-colors flex-1">
                  {channel.fullName || channel.username}
                </span>

                {channel.isLive && (
                  <span className="text-[10px] font-bold text-red-500
                                   bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    LIVE
                  </span>
                )}
              </Link>
            ))}

            {/* Show all link */}
            <Link
              to="/subscribers"
              className="flex items-center gap-3 px-3 py-2 rounded-xl
                         text-sm text-indigo-500 font-semibold
                         hover:bg-indigo-50 transition-all duration-150"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
              Show all subscriptions
            </Link>
          </div>

          <SectionDivider />

          {/* ── EXPLORE BY CATEGORY ──────────────────── */}
          <SectionDivider label="Explore" />
          <div className="space-y-0.5">
            <NavItem to="/commingsoon" icon={Music2} label="Music" isActive={pathname === "/category/music"} />
            <NavItem to="/commingsoon" icon={Gamepad2} label="Gaming" isActive={pathname === "/category/gaming"} />
            <NavItem to="/commingsoon" icon={Newspaper} label="News" isActive={pathname === "/category/news"} />
            <NavItem to="/commingsoon" icon={Trophy} label="Sports" isActive={pathname === "/category/sports"} />
          </div>

          <SectionDivider />

          {/* ── ACCOUNT ──────────────────────────────── */}
          <SectionDivider label="Account" />
          <div className="space-y-0.5">
            <NavItem to="/profile" icon={User} label="Profile" isActive={pathname === "/profile"} />
            <NavItem to="/settings" icon={Settings} label="Settings" isActive={pathname === "/settings"} />
            <NavItem
              icon={LogOut}
              label="Sign Out"
              isActive={false}
              onClick={handleLogout}
            />
          </div>

          <div className="h-6" />
        </div>

        {/* ── User profile footer ──────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3">

          {/* Skeleton while loading */}
          {userLoading && <UserFooterSkeleton />}

          {/* Real user */}
          {!userLoading && user && (
            <Link
              to="/profile"
              className="flex items-center gap-3 px-2 py-2 rounded-xl
                         hover:bg-gray-50 transition-all duration-150"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0
                              ring-2 ring-indigo-100">
                {user?.avatar ? (
                  <img
                    src={user?.avatar}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500
                                  flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.fullName?.charAt(0)?.toUpperCase() ||
                        user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                  {user?.fullName || "Your Name"}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight">
                  @{user?.username || "username"}
                </p>
              </div>
            </Link>
          )}

          {/* No user / not logged in */}
          {!userLoading && !user && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-3 py-2.5
                         rounded-xl bg-rose-50 text-rose-500 text-sm font-semibold
                         hover:bg-rose-100 transition-all duration-150"
            >
              <LogOut size={15} strokeWidth={2.5} />
              Sign In
            </Link>
          )}

        </div>
      </aside>
    </>
  );
}