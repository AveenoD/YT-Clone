import { Router } from "express"
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

// Create playlist (requires auth)
router.post("/playlists", authMiddleware, createPlaylist)

// Get user playlists (public)
router.get("/users/:userId/playlists", getUserPlaylists)

// Get playlist by ID (public)
router.get("/playlists/:playlistId", getPlaylistById)

// Add video to playlist (requires auth)
router.post("/playlists/:playlistId/videos/:videoId", authMiddleware, addVideoToPlaylist)

// Remove video from playlist (requires auth)
router.delete("/playlists/:playlistId/videos/:videoId", authMiddleware, removeVideoFromPlaylist)

// Delete playlist (requires auth)
router.delete("/playlists/:playlistId", authMiddleware, deletePlaylist)

// Update playlist (requires auth)
router.patch("/playlists/:playlistId", authMiddleware, updatePlaylist)

export default router