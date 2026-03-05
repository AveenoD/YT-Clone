import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Eye, EyeOff, Mail, Lock, User, AtSign,
  ImagePlus, UserCircle2, Sparkles, ArrowRight, X
} from "lucide-react";
import { useToast } from '../toaster/UseToast.js'
export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  // ── Validate ────────────────────────────────────────────────
  function validate() {
    if (!username.trim()) {
      toast.error("Username is required");
      return false;
    }
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  }

  // ── Handle Register ─────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();


    if (!validate()) return;

    const avatarFile = avatarRef.current.files[0];
    if (!avatarFile) {
      toast.warning("Please upload an avatar image");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("avatar", avatarFile);

    const coverFile = coverRef.current.files[0];
    if (coverFile) {
      formData.append("coverImage", coverFile);
    }

    setLoading(true);

    try {
      const response = await axios.post(
         `${import.meta.env.VITE_BACKEND_URL}/users/register`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Account created! Please log in. 🎉");
      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Avatar change ───────────────────────────────────────────
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  }

  // ── Cover change ────────────────────────────────────────────
  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  // ── UI ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4 py-10">

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl px-8 py-10 sm:px-12 sm:py-12
                      shadow-[0_4px_6px_-1px_rgba(0,0,0,0.04),0_20px_50px_-10px_rgba(99,102,241,0.18),0_40px_80px_-20px_rgba(0,0,0,0.08)]
                      ring-1 ring-indigo-50">

        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50
                        border border-indigo-100 rounded-full px-3 py-1.5 mb-7">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500
                          rounded-full flex items-center justify-center">
            <Sparkles size={12} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-semibold text-indigo-500 tracking-wide">
            Create account
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
          Join us today
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Fill in the details below to get started
        </p>

        {/* ── Cover Image ───────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-600 mb-2">
            Cover Image
            <span className="ml-1.5 text-xs text-gray-300 font-normal">(optional)</span>
          </p>

          <div
            onClick={() => coverRef.current.click()}
            className="relative w-full h-28 rounded-2xl border-2 border-dashed border-gray-200
                       bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40
                       flex items-center justify-center cursor-pointer
                       overflow-hidden transition-all duration-200 group"
          >
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverPreview(null);
                    coverRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full
                             flex items-center justify-center text-gray-500
                             hover:bg-red-50 hover:text-red-500 transition-all duration-200 shadow-sm"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100
                                transition-opacity duration-200 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">
                    Change cover
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-gray-300
                              group-hover:text-indigo-400 transition-colors duration-200">
                <ImagePlus size={22} strokeWidth={1.8} />
                <span className="text-xs font-medium">Click to upload cover image</span>
              </div>
            )}
          </div>

          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        {/* ── Avatar ────────────────────────────────────────── */}
        <div className="flex items-end gap-4 mb-8">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-gray-600 self-start">
              Avatar
              <span className="ml-1.5 text-xs text-red-400 font-normal">*</span>
            </p>
            <div
              onClick={() => avatarRef.current.click()}
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-200
                         bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40
                         flex items-center justify-center cursor-pointer
                         overflow-hidden transition-all duration-200 group flex-shrink-0"
            >
              {avatarPreview ? (
                <>
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100
                                  transition-opacity duration-200 flex items-center justify-center">
                    <ImagePlus size={16} className="text-white" strokeWidth={2} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-300
                                group-hover:text-indigo-400 transition-colors duration-200">
                  <UserCircle2 size={28} strokeWidth={1.5} />
                  <span className="text-[10px] font-medium text-center leading-tight px-1">
                    Upload photo
                  </span>
                </div>
              )}
            </div>

            {avatarPreview && (
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(null);
                  avatarRef.current.value = "";
                }}
                className="text-[11px] text-red-400 hover:text-red-600 font-medium transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="pb-1">
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload a clear profile photo.<br />
              JPG, PNG or WEBP. Max 2MB.
            </p>
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────── */}
        <form onSubmit={handleRegister} className="flex flex-col gap-5">

          {/* Error message */}
          {/* {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100
                            text-red-500 text-sm px-4 py-3 rounded-2xl">
              <X size={15} strokeWidth={2.5} className="flex-shrink-0" />
              {error}
            </div>
          )} */}

          {/* Username + Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-gray-600">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-300 pointer-events-none">
                  <AtSign size={16} strokeWidth={2} />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 text-sm text-gray-800
                             bg-gray-50 border border-gray-200 rounded-2xl outline-none
                             placeholder:text-gray-300
                             focus:border-indigo-400 focus:bg-white
                             focus:ring-4 focus:ring-indigo-100
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-gray-600">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-300 pointer-events-none">
                  <User size={16} strokeWidth={2} />
                </span>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 text-sm text-gray-800
                             bg-gray-50 border border-gray-200 rounded-2xl outline-none
                             placeholder:text-gray-300
                             focus:border-indigo-400 focus:bg-white
                             focus:ring-4 focus:ring-indigo-100
                             transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-600">
              Email address <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-300 pointer-events-none">
                <Mail size={17} strokeWidth={2} />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3.5 text-sm text-gray-800
                           bg-gray-50 border border-gray-200 rounded-2xl outline-none
                           placeholder:text-gray-300
                           focus:border-indigo-400 focus:bg-white
                           focus:ring-4 focus:ring-indigo-100
                           transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-600">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-300 pointer-events-none">
                <Lock size={17} strokeWidth={2} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className="w-full pl-11 pr-12 py-3.5 text-sm text-gray-800
                           bg-gray-50 border border-gray-200 rounded-2xl outline-none
                           placeholder:text-gray-300
                           focus:border-indigo-400 focus:bg-white
                           focus:ring-4 focus:ring-indigo-100
                           transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 p-2 rounded-xl text-gray-300
                           hover:text-indigo-400 hover:bg-indigo-50
                           transition-all duration-200"
              >
                {showPassword
                  ? <EyeOff size={17} strokeWidth={2} />
                  : <Eye size={17} strokeWidth={2} />
                }
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-600">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-300 pointer-events-none">
                <Lock size={17} strokeWidth={2} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="w-full pl-11 pr-12 py-3.5 text-sm text-gray-800
                           bg-gray-50 border border-gray-200 rounded-2xl outline-none
                           placeholder:text-gray-300
                           focus:border-indigo-400 focus:bg-white
                           focus:ring-4 focus:ring-indigo-100
                           transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 p-2 rounded-xl text-gray-300
                           hover:text-indigo-400 hover:bg-indigo-50
                           transition-all duration-200"
              >
                {showConfirm
                  ? <EyeOff size={17} strokeWidth={2} />
                  : <Eye size={17} strokeWidth={2} />
                }
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-3.5 flex items-center justify-center gap-2
                       bg-gradient-to-r from-indigo-500 to-purple-500
                       hover:from-indigo-600 hover:to-purple-600
                       disabled:opacity-60 disabled:cursor-not-allowed
                       disabled:hover:from-indigo-500 disabled:hover:to-purple-500
                       text-white text-sm font-semibold rounded-2xl
                       shadow-lg shadow-indigo-200
                       hover:shadow-xl hover:shadow-indigo-300
                       hover:-translate-y-0.5
                       active:translate-y-0 active:shadow-md
                       transition-all duration-200 group"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Registering...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight
                  size={16}
                  strokeWidth={2.5}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
              Already have an account?
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-sm text-gray-400">
              Already registered?{" "}
              <Link
                to="/login"
                className="text-indigo-500 font-semibold hover:text-indigo-700
                           border-b border-transparent hover:border-indigo-500
                           transition-all duration-200"
              >
                Sign in instead
              </Link>
            </span>
          </div>

        </form>
      </div>
    </div>
  );
}