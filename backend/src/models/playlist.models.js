import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ============================================
// CREATE PLAYLIST
// ============================================

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    // ============================================
    // 1. VALIDATE INPUTS
    // ============================================

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required")
    }

    if (!description?.trim()) {
        throw new ApiError(400, "Playlist description is required")
    }

    // ============================================
    // 2. CREATE PLAYLIST
    // ============================================

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
        videos: [] // Initialize empty array
    })

    // ============================================
    // 3. POPULATE OWNER
    // ============================================

    await playlist.populate("owner", "username fullName avatar")

    // ============================================
    // 4. SEND RESPONSE
    // ============================================

    return res.status(201).json(
        new ApiResponse(
            201,
            playlist,
            "Playlist created successfully"
        )
    )
})

// ============================================
// GET USER PLAYLISTS
// ============================================

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    // ============================================
    // 1. VALIDATE USER ID
    // ============================================

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // ============================================
    // 2. FETCH USER'S PLAYLISTS
    // ============================================

    const playlists = await Playlist.find({ owner: userId })
        .sort({ createdAt: -1 }) // Newest first
        .populate("owner", "username fullName avatar")
        .populate("videos", "_id title thumbnail duration") // Only essential video fields
        .lean()

    // ============================================
    // 3. ADD VIDEO COUNT TO EACH PLAYLIST
    // ============================================

    const playlistsWithCount = playlists.map(playlist => ({
        ...playlist,
        videoCount: playlist.videos?.length || 0
    }))

    // ============================================
    // 4. SEND RESPONSE
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            playlistsWithCount,
            "User playlists fetched successfully"
        )
    )
})

// ============================================
// GET PLAYLIST BY ID
// ============================================

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    // ============================================
    // 1. VALIDATE PLAYLIST ID
    // ============================================

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // ============================================
    // 2. FIND PLAYLIST WITH POPULATION
    // ============================================

    const playlist = await Playlist.findById(playlistId)
        .populate("owner", "username fullName avatar email")
        .populate("videos", "_id title description thumbnail duration viewsCount createdAt")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // ============================================
    // 3. SEND RESPONSE
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})

// ============================================
// ADD VIDEO TO PLAYLIST
// ============================================

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    // ============================================
    // 1. VALIDATE IDs
    // ============================================

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // ============================================
    // 2. CHECK VIDEO EXISTS
    // ============================================

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // ============================================
    // 3. FIND PLAYLIST AND CHECK OWNERSHIP
    // ============================================

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to modify this playlist")
    }

    // ============================================
    // 4. ADD VIDEO (PREVENT DUPLICATES)
    // ============================================

    // Check if video already exists in playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in this playlist")
    }

    // Add video to playlist
    playlist.videos.push(videoId)
    await playlist.save()

    // ============================================
    // 5. POPULATE AND SEND RESPONSE
    // ============================================

    await playlist.populate("videos", "_id title thumbnail duration")

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                playlistId: playlist._id,
                videoId,
                videoCount: playlist.videos.length,
                videos: playlist.videos
            },
            "Video added to playlist successfully"
        )
    )
})

// ============================================
// REMOVE VIDEO FROM PLAYLIST
// ============================================

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    // ============================================
    // 1. VALIDATE IDs
    // ============================================

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // ============================================
    // 2. FIND PLAYLIST AND CHECK OWNERSHIP
    // ============================================

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to modify this playlist")
    }

    // ============================================
    // 3. CHECK IF VIDEO EXISTS IN PLAYLIST
    // ============================================

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(404, "Video not found in this playlist")
    }

    // ============================================
    // 4. REMOVE VIDEO
    // ============================================

    playlist.videos = playlist.videos.filter(
        vid => vid.toString() !== videoId.toString()
    )
    await playlist.save()

    // ============================================
    // 5. SEND RESPONSE
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                playlistId: playlist._id,
                videoId,
                videoCount: playlist.videos.length
            },
            "Video removed from playlist successfully"
        )
    )
})

// ============================================
// DELETE PLAYLIST
// ============================================

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    // ============================================
    // 1. VALIDATE PLAYLIST ID
    // ============================================

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // ============================================
    // 2. FIND PLAYLIST AND CHECK OWNERSHIP
    // ============================================

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this playlist")
    }

    // ============================================
    // 3. DELETE PLAYLIST (ATOMIC)
    // ============================================

    const deleteResult = await Playlist.deleteOne({
        _id: playlistId,
        owner: req.user._id
    })

    if (deleteResult.deletedCount === 0) {
        throw new ApiError(404, "Playlist not found or unauthorized")
    }

    // ============================================
    // 4. SEND RESPONSE
    // ============================================

    return res.status(200).json(
        new ApiResponse(
            200,
            { playlistId },
            "Playlist deleted successfully"
        )
    )
})

// ============================================
// UPDATE PLAYLIST
// ============================================

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    // ============================================
    // 1. VALIDATE PLAYLIST ID
    // ============================================

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // ============================================
    // 2. FIND PLAYLIST AND CHECK OWNERSHIP
    // ============================================

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this playlist")
    }

    // ============================================
    // 3. VALIDATE UPDATE DATA
    // ============================================

    const updateData = {}

    if (name !== undefined) {
        if (!name?.trim()) {
            throw new ApiError(400, "Playlist name cannot be empty")
        }
        updateData.name = name.trim()
    }

    if (description !== undefined) {
        if (!description?.trim()) {
            throw new ApiError(400, "Playlist description cannot be empty")
        }
        updateData.description = description.trim()
    }

    // ============================================
    // 4. UPDATE PLAYLIST
    // ============================================

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No valid fields to update")
    }

    Object.assign(playlist, updateData)
    await playlist.save()

    // ============================================
    // 5. POPULATE AND SEND RESPONSE
    // ============================================

    await playlist.populate("owner", "username fullName avatar")

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}