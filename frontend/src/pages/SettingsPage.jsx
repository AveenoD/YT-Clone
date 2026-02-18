import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../toaster/UseToast.js";
import {
  User, Mail, Lock, ArrowLeft,
  Save, Key, Eye, EyeOff
} from "lucide-react";

const BASE_URL = "http://localhost:5000/api/v1";

export default function SettingsPage() {
  const toast    = useToast();
  const navigate = useNavigate();

  // ── Your logic (unchanged) ───────────────────────────
  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [oldPassword, setOldPassword]         = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);

  // ── Password visibility toggles (UI only) ────────────
  const [showOld, setShowOld]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleUpdateAccount(e) {
    e.preventDefault();
    if (!fullName.trim() && !email.trim()) {
      toast.error("Fill at least one field");
      return;
    }

    const token   = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const body    = {};
    if (fullName.trim()) body.fullName = fullName.trim();
    if (email.trim())    body.email    = email.trim();

    setLoading(true);
    try {
      await axios.patch(`${BASE_URL}/users/update-account`, body, { headers });
      toast.success("Account updated! ✅");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!oldPassword.trim()) {
      toast.error("Please enter old password");
      return;
    }
    if (!newPassword.trim()) {
      toast.error("Please enter new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    const token   = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const body    = {
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim()
    };

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/users/change-password`, body, { headers });
      toast.success("Password updated successfully ✅");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── UI ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       bg-white border border-gray-200 text-gray-500
                       hover:text-gray-800 hover:bg-gray-100
                       shadow-sm transition-all duration-200"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>

          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your account preferences
            </p>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Account Info Card ───────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200
                          shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User size={16} className="text-indigo-500" strokeWidth={2.5} />
                <h2 className="text-sm font-bold text-gray-800">
                  Account Information
                </h2>
              </div>
            </div>

            <form onSubmit={handleUpdateAccount} className="p-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2
                                             text-gray-300" strokeWidth={2} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl
                               pl-11 pr-4 py-3 text-sm text-gray-800
                               placeholder:text-gray-300 outline-none
                               focus:border-indigo-400 focus:bg-white
                               focus:ring-4 focus:ring-indigo-100
                               transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2
                                             text-gray-300" strokeWidth={2} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl
                               pl-11 pr-4 py-3 text-sm text-gray-800
                               placeholder:text-gray-300 outline-none
                               focus:border-indigo-400 focus:bg-white
                               focus:ring-4 focus:ring-indigo-100
                               transition-all duration-200"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm
                           bg-indigo-500 hover:bg-indigo-600 text-white
                           shadow-md shadow-indigo-200
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200
                           flex items-center justify-center gap-2"
              >
                <Save size={16} strokeWidth={2.5} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* ── Password Card ────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200
                          shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-rose-500" strokeWidth={2.5} />
                <h2 className="text-sm font-bold text-gray-800">
                  Change Password
                </h2>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {/* Old Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2
                                            text-gray-300" strokeWidth={2} />
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl
                               pl-11 pr-11 py-3 text-sm text-gray-800
                               placeholder:text-gray-300 outline-none
                               focus:border-rose-400 focus:bg-white
                               focus:ring-4 focus:ring-rose-100
                               transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-4 top-1/2 -translate-y-1/2
                               text-gray-300 hover:text-gray-600
                               transition-colors"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2
                                             text-gray-300" strokeWidth={2} />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl
                               pl-11 pr-11 py-3 text-sm text-gray-800
                               placeholder:text-gray-300 outline-none
                               focus:border-rose-400 focus:bg-white
                               focus:ring-4 focus:ring-rose-100
                               transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2
                               text-gray-300 hover:text-gray-600
                               transition-colors"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2
                                             text-gray-300" strokeWidth={2} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl
                               pl-11 pr-11 py-3 text-sm text-gray-800
                               placeholder:text-gray-300 outline-none
                               focus:border-rose-400 focus:bg-white
                               focus:ring-4 focus:ring-rose-100
                               transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2
                               text-gray-300 hover:text-gray-600
                               transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm
                           bg-rose-500 hover:bg-rose-600 text-white
                           shadow-md shadow-rose-200
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200
                           flex items-center justify-center gap-2"
              >
                <Lock size={16} strokeWidth={2.5} />
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}