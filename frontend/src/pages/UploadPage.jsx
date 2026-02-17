import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../toaster/UseToast.js";
import {
    ArrowLeft, 
    Film, 
    Upload, 
    CheckCircle2, 
    X, 
    Image, 
    AlignLeft, 
    Type, 
    Loader2} from 'lucide-react'
const BASE_URL = "http://localhost:5000/api/v1";

function UploadPage() {
  const toast    = useToast();
  const navigate = useNavigate();

  const [title, setTitle]                       = useState("");
  const [description, setDescription]           = useState("");
  const [loading, setLoading]                   = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoName, setVideoName]               = useState(null);
  const [progress, setProgress]                 = useState(null)

  const videoRef     = useRef(null);
  const thumbnailRef = useRef(null);

  function handleThumbnailChange() {
    const file = thumbnailRef.current.files[0];
    if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));  
  }

  function handleVideoChange() {
    const file = videoRef.current.files[0];
    if (!file) return;
    setVideoName(file.name);   
  }

  function validate() {
    if (!title.trim()) {
      toast.error("Title is required");
      return false;            
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return false;
    }
    if (!videoRef.current.files[0]) {     
      toast.error("Video file is required");
      return false;
    }
    if (!thumbnailRef.current.files[0]) { 
      toast.error("Thumbnail is required");
      return false;
    }
    return true;
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoRef.current.files[0]);      
    formData.append("thumbnail", thumbnailRef.current.files[0]);

    setLoading(true);
    setProgress(0)

    try {
      const response = await axios.post(
        `${BASE_URL}/videos/publish`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,        
            "Content-Type": "multipart/form-data",
            
          },
          onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        }}
      );

      toast.success("Video uploaded successfully! 🎉");
      navigate(`/`);  

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  }
  

  return  <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        .upload-font { font-family: 'DM Sans', sans-serif; }
        .logo-font   { font-family: 'Nunito', sans-serif; }
      `}</style>

      <div className="upload-font min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Header ──────────────────────────────────── */}
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
              <h1 className="logo-font text-2xl font-black text-gray-900
                             tracking-tight">
                Upload Video
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Share your video with the world
              </p>
            </div>
          </div>

          {/* ── Form ────────────────────────────────────── */}
          <form onSubmit={handleUpload} className="space-y-6">

            {/* ── Video file drop zone ─────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Film size={16} className="text-rose-500" strokeWidth={2.5} />
                  <h2 className="text-sm font-bold text-gray-800">
                    Video File
                  </h2>
                  <span className="text-xs text-red-500 font-semibold">*</span>
                </div>
              </div>

              <div className="p-5">
                {/* Hidden input */}
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-input"
                />

                {!videoName ? (
                  // Drop zone
                  <label
                    htmlFor="video-input"
                    className="flex flex-col items-center justify-center
                               border-2 border-dashed border-gray-200
                               rounded-xl p-10 cursor-pointer
                               hover:border-rose-300 hover:bg-rose-50/50
                               transition-all duration-200 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gray-100
                                    group-hover:bg-rose-100
                                    flex items-center justify-center mb-3
                                    transition-colors duration-200">
                      <Upload size={24} className="text-gray-400
                                                   group-hover:text-rose-500
                                                   transition-colors" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-semibold text-gray-600
                                  group-hover:text-rose-600 transition-colors">
                      Click to select video
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      MP4, MOV, AVI, MKV supported
                    </p>
                  </label>
                ) : (
                  // File selected state
                  <div className="flex items-center gap-4 p-4
                                  bg-green-50 border border-green-200
                                  rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-green-100
                                    flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={20} className="text-green-500"
                        strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {videoName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ready to upload
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        videoRef.current.value = "";
                        setVideoName(null);
                      }}
                      className="w-7 h-7 flex items-center justify-center
                                 rounded-full text-gray-400 hover:text-red-500
                                 hover:bg-red-50 transition-all duration-150"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Thumbnail ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-indigo-500" strokeWidth={2.5} />
                  <h2 className="text-sm font-bold text-gray-800">
                    Thumbnail
                  </h2>
                  <span className="text-xs text-red-500 font-semibold">*</span>
                </div>
              </div>

              <div className="p-5">
                <input
                  ref={thumbnailRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-input"
                />

                {!thumbnailPreview ? (
                  <label
                    htmlFor="thumbnail-input"
                    className="flex flex-col items-center justify-center
                               border-2 border-dashed border-gray-200
                               rounded-xl p-8 cursor-pointer
                               hover:border-indigo-300 hover:bg-indigo-50/50
                               transition-all duration-200 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gray-100
                                    group-hover:bg-indigo-100
                                    flex items-center justify-center mb-3
                                    transition-colors duration-200">
                      <Image size={24} className="text-gray-400
                                                  group-hover:text-indigo-500
                                                  transition-colors" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-semibold text-gray-600
                                  group-hover:text-indigo-600 transition-colors">
                      Click to select thumbnail
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, WEBP — recommended 1280×720
                    </p>
                  </label>
                ) : (
                  // Thumbnail preview
                  <div className="relative group">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full aspect-video object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0
                                    group-hover:opacity-100 rounded-xl
                                    transition-opacity duration-200
                                    flex items-center justify-center gap-3">
                      <label
                        htmlFor="thumbnail-input"
                        className="px-4 py-2 bg-white text-gray-800 rounded-full
                                   text-xs font-semibold cursor-pointer
                                   hover:bg-gray-100 transition-colors"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          thumbnailRef.current.value = "";
                          setThumbnailPreview(null);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-full
                                   text-xs font-semibold hover:bg-red-600
                                   transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Title ───────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Type size={16} className="text-amber-500" strokeWidth={2.5} />
                  <h2 className="text-sm font-bold text-gray-800">Title</h2>
                  <span className="text-xs text-red-500 font-semibold">*</span>
                </div>
              </div>

              <div className="p-5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your video a great title..."
                  maxLength={100}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl
                             px-4 py-3 text-sm text-gray-800 font-medium
                             placeholder:text-gray-300 outline-none
                             focus:border-indigo-400 focus:bg-white
                             focus:ring-4 focus:ring-indigo-100
                             transition-all duration-200"
                />
                <div className="flex justify-end mt-2">
                  <span className={`text-xs font-medium
                    ${title.length > 90 ? "text-red-400" : "text-gray-300"}`}>
                    {title.length}/100
                  </span>
                </div>
              </div>
            </div>

            {/* ── Description ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200
                            shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlignLeft size={16} className="text-teal-500" strokeWidth={2.5} />
                  <h2 className="text-sm font-bold text-gray-800">Description</h2>
                  <span className="text-xs text-red-500 font-semibold">*</span>
                </div>
              </div>

              <div className="p-5">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video..."
                  rows={5}
                  maxLength={5000}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl
                             px-4 py-3 text-sm text-gray-800
                             placeholder:text-gray-300 outline-none
                             focus:border-indigo-400 focus:bg-white
                             focus:ring-4 focus:ring-indigo-100
                             transition-all duration-200 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <span className="text-xs font-medium text-gray-300">
                    {description.length}/5000
                  </span>
                </div>
              </div>
            </div>

            {/* ── Upload progress ──────────────────────── */}
            {loading && progress > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200
                              shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Uploading to Cloudinary...
                  </span>
                  <span className="text-sm font-bold text-indigo-500">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500
                               rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Please don't close this page while uploading
                </p>
              </div>
            )}

            {/* ── Submit button ────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-4 rounded-2xl font-bold text-sm
                         bg-gradient-to-r from-rose-500 to-pink-500
                         hover:from-rose-600 hover:to-pink-600
                         text-white shadow-lg shadow-rose-200
                         hover:shadow-xl hover:shadow-rose-300
                         hover:-translate-y-0.5 active:translate-y-0
                         disabled:opacity-60 disabled:cursor-not-allowed
                         disabled:hover:translate-y-0
                         transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                  {progress > 0 ? `Uploading ${progress}%...` : "Processing..."}
                </>
              ) : (
                <>
                  <Upload size={18} strokeWidth={2.5} />
                  Publish Video
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </>
}

export default UploadPage;