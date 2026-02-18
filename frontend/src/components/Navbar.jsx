import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Menu,
  Search,
  Upload,
  User,
  LogOut,
  Settings,
  PlaySquare,
  X,
  Tv2,
  Loader2,
} from "lucide-react";

const BASE_URL = "http://localhost:5000/api/v1";

export default function Navbar({ onMenuClick }) {
  const navigate                      = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setDropdown]   = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const [user, setUser]               = useState(null);   // ✅ starts as null
  const [userLoading, setUserLoading] = useState(true);   // ✅ loading state
  const dropdownRef                   = useRef(null);
  const searchRef                     = useRef(null);

  // ── Fetch current user from API ───────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token — don't call API, just stop loading
    if (!token) {
      setUserLoading(false);
      return;
    }

    async function fetchCurrentUser() {
      try {
        const response = await axios.get(`${BASE_URL}/users/current-user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.data);   // adjust key based on your API response
      } catch (err) {
        // Token expired or invalid — clear and redirect to login
        console.error("Failed to fetch user:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } finally {
        setUserLoading(false);
      }
    }

    fetchCurrentUser();
  }, []); // runs once on mount

  // ── Close dropdown on outside click ──────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Search ────────────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
    }
  }

  // ── Logout ────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setDropdown(false);
    navigate("/login");
  }

  // ── Avatar UI helper ──────────────────────────────────────
  function AvatarDisplay({ size = "sm" }) {
    const dim     = size === "sm" ? "w-8 h-8"   : "w-10 h-10";
    const textSz  = size === "sm" ? "text-xs"   : "text-sm";
    const ringClr = size === "sm" ? "ring-white" : "ring-indigo-100";

    if (userLoading) {
      return (
        <div className={`${dim} rounded-full bg-gray-100 flex items-center justify-center`}>
          <Loader2 size={14} className="text-gray-400 animate-spin" />
        </div>
      );
    }

    return (
      <div className={`${dim} rounded-full overflow-hidden flex-shrink-0 ring-2 ${ringClr} shadow-sm`}>
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user?.fullName || "User"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500
                          flex items-center justify-center">
            <span className={`text-white font-bold ${textSz}`}>
              {user?.fullName?.charAt(0)?.toUpperCase() ||
               user?.username?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        .nav-font  { font-family: 'DM Sans', sans-serif; }
        .logo-font { font-family: 'Nunito', sans-serif; }
      `}</style>

      <nav className="nav-font fixed top-0 left-0 right-0 z-50
                      bg-white/95 backdrop-blur-md
                      border-b border-gray-100
                      shadow-[0_1px_20px_rgba(0,0,0,0.06)]
                      h-16 flex items-center px-4 sm:px-6 gap-3">

        {/* ── LEFT — Menu + Logo ──────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">

          <button
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-gray-500 hover:text-gray-800 hover:bg-gray-100
                       transition-all duration-200"
          >
            <Menu size={20} strokeWidth={2} />
          </button>

          <Link
            to="/"
            className="logo-font flex items-center gap-2 flex-shrink-0 select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600
                            flex items-center justify-center
                            shadow-[0_2px_10px_rgba(244,63,94,0.35)]">
              <Tv2 size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:flex items-baseline gap-0 text-[17px] leading-none">
              <span className="font-black text-gray-900 tracking-tight">Stream</span>
              <span className="font-black bg-gradient-to-r from-rose-500 to-pink-500
                               bg-clip-text text-transparent tracking-tight">Tube</span>
            </span>
          </Link>
        </div>

        {/* ── CENTRE — Search ─────────────────────────────── */}
        <div className="flex-1 flex justify-center px-2 sm:px-6">
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex w-full max-w-xl items-center
                       bg-gray-50 border border-gray-200 rounded-full
                       focus-within:border-indigo-400 focus-within:bg-white
                       focus-within:ring-4 focus-within:ring-indigo-100
                       transition-all duration-200 overflow-hidden h-10 px-1"
          >
            <Search size={16} className="ml-3 text-gray-300 flex-shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, channels..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-700
                         placeholder:text-gray-300 px-3 py-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1.5 mr-1 rounded-full text-gray-300
                           hover:text-gray-500 hover:bg-gray-200
                           transition-all duration-150"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
            <button
              type="submit"
              className="h-8 px-4 mr-0.5 bg-gray-100 hover:bg-indigo-50
                         text-gray-500 hover:text-indigo-500
                         rounded-full text-xs font-semibold
                         transition-all duration-200 flex-shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* ── RIGHT ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Search icon — mobile only */}
          <button
            onClick={() => setShowSearch(true)}
            className="sm:hidden w-9 h-9 flex items-center justify-center
                       rounded-xl text-gray-500 hover:text-gray-800
                       hover:bg-gray-100 transition-all duration-200"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={2} />
          </button>

          {/* Upload — desktop */}
          <Link
            to="/upload"
            className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-full
                       bg-gradient-to-r from-rose-500 to-pink-500
                       hover:from-rose-600 hover:to-pink-600
                       text-white text-sm font-semibold
                       shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300
                       hover:-translate-y-0.5 active:translate-y-0
                       transition-all duration-200"
          >
            <Upload size={14} strokeWidth={2.5} />
            <span>Upload</span>
          </Link>

          {/* Upload — mobile */}
          <Link
            to="/upload"
            className="sm:hidden w-9 h-9 flex items-center justify-center
                       rounded-xl bg-rose-50 text-rose-500
                       hover:bg-rose-100 transition-all duration-200"
            aria-label="Upload"
          >
            <Upload size={17} strokeWidth={2.5} />
          </Link>

          {/* ── Avatar + Dropdown ────────────────────────── */}
          <div className="relative" ref={dropdownRef}>

            <button
              onClick={() => setDropdown(!showDropdown)}
              aria-label="Account menu"
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1
                         rounded-full hover:bg-gray-100
                         transition-all duration-200 group"
            >
              <AvatarDisplay size="sm" />

              {/* Name — desktop only, shows skeleton while loading */}
              <span className="hidden md:block text-sm font-semibold text-gray-700
                               group-hover:text-gray-900 transition-colors
                               max-w-[100px] truncate">
                {userLoading
                  ? <span className="inline-block w-16 h-3 bg-gray-200 rounded-full animate-pulse" />
                  : (user?.fullName || user?.username || "Account")
                }
              </span>
            </button>

            {/* ── Dropdown ────────────────────────────────── */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56
                              bg-white rounded-2xl overflow-hidden
                              shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                              ring-1 ring-black/5">

                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-gray-100">
                  {userLoading ? (
                    // Skeleton loader
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-gray-200 rounded-full animate-pulse" />
                        <div className="w-16 h-2.5 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <AvatarDisplay size="lg" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.fullName || "User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          @{user?.username || "username"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5
                               text-sm text-gray-600 font-medium
                               hover:bg-gray-50 hover:text-gray-900
                               transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50
                                    flex items-center justify-center flex-shrink-0">
                      <User size={15} className="text-indigo-500" strokeWidth={2} />
                    </div>
                    My Profile
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5
                               text-sm text-gray-600 font-medium
                               hover:bg-gray-50 hover:text-gray-900
                               transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-50
                                    flex items-center justify-center flex-shrink-0">
                      <PlaySquare size={15} className="text-rose-500" strokeWidth={2} />
                    </div>
                    My Videos
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5
                               text-sm text-gray-600 font-medium
                               hover:bg-gray-50 hover:text-gray-900
                               transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-100
                                    flex items-center justify-center flex-shrink-0">
                      <Settings size={15} className="text-gray-500" strokeWidth={2} />
                    </div>
                    Settings
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5
                               text-sm text-red-500 font-medium
                               hover:bg-red-50 hover:text-red-600
                               transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-50
                                    flex items-center justify-center flex-shrink-0">
                      <LogOut size={15} className="text-red-500" strokeWidth={2} />
                    </div>
                    Sign Out
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Search Overlay ──────────────────────────── */}
      {showSearch && (
        <div className="nav-font fixed inset-0 z-[60] bg-white flex flex-col sm:hidden">
          <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
            <form
              onSubmit={handleSearch}
              className="flex-1 flex items-center bg-gray-50 border border-gray-200
                         rounded-full focus-within:border-indigo-400
                         focus-within:ring-4 focus-within:ring-indigo-100
                         transition-all duration-200 h-11 px-1"
            >
              <Search size={16} className="ml-3 text-gray-300 flex-shrink-0" strokeWidth={2} />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, channels..."
                className="flex-1 bg-transparent outline-none text-sm
                           text-gray-700 placeholder:text-gray-300 px-3"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 mr-1 rounded-full text-gray-300
                             hover:text-gray-500 transition-all duration-150"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </form>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
              className="text-sm font-semibold text-indigo-500
                         hover:text-indigo-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}