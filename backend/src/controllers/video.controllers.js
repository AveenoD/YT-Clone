import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  asyncHandler from "../utils/asyncHandler.js"
import  uploadOnCloudinary  from "../utils/cloudinary.js"
import { Comment } from "../models/comment.models.js"
import { Like } from "../models/like.models.js"
import fs from "fs"

// ====================================================================
// GET ALL VIDEOS - Fixed version
// ====================================================================
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // Parse & sanitize
    const pageNum = parseInt(page, 10)
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10), 50))
    const validSortFields = ["createdAt", "viewsCount", "duration", "title"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    const sortDirection = sortType === "asc" ? 1 : -1

    // Build match conditions
    const matchConditions = { isPublished: true }

    if (query && query.trim()) {
        const searchQuery = query.trim()
        matchConditions.$or = [
            { title: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } }
        ]
    }

    if (userId && isValidObjectId(userId)) {
        matchConditions.owner = new mongoose.Types.ObjectId(userId)
    }

    // Build pipeline
    const pipeline = []

    pipeline.push({ $match: matchConditions })
    pipeline.push({ $sort: { [sortField]: sortDirection } })

    // Lookup owner
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true
        }
    })

    // Lookup like count
    pipeline.push({
        $lookup: {
            from: "likes",
            let: { videoId: "$_id" },
            pipeline: [
                { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                { $count: "count" }
            ],
            as: "likeCount"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$likeCount",
            preserveNullAndEmptyArrays: true
        }
    })

    // Lookup comment count
    pipeline.push({
        $lookup: {
            from: "comments",
            let: { videoId: "$_id" },
            pipeline: [
                { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                { $count: "count" }
            ],
            as: "commentCount"
        }
    })

    pipeline.push({
        $unwind: {
            path: "$commentCount",
            preserveNullAndEmptyArrays: true
        }
    })

    // Project
    pipeline.push({
        $project: {
            _id: 1,
            title: 1,
            description: 1,
            videoFile: 1,
            thumbnail: 1,
            duration: 1,
            viewsCount: 1,
            isPublished: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: {
                _id: "$owner._id",
                username: "$owner.username",
                fullName: "$owner.fullName",
                avatar: "$owner.avatar"
            },
            likeCount: { $ifNull: ["$likeCount.count", 0] },
            commentCount: { $ifNull: ["$commentCount.count", 0] }
        }
    })

    // Use plugin for pagination
    const videosAggregate = Video.aggregate(pipeline)
    const result = await Video.aggregatePaginate(videosAggregate, {
        page: pageNum,
        limit: limitNum
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos: result.docs,
                totalVideos: result.totalDocs,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                hasMore: result.hasNextPage
            },
            "Videos fetched successfully"
        )
    )
})

// ====================================================================
// PUBLISH A VIDEO - Fixed version
// ====================================================================
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    
    // Validate title
    if (!title?.trim()) {
        throw new ApiError(400, "Title is required")
    }
    
    // Validate description
    if (!description?.trim()) {
        throw new ApiError(400, "Description is required")
    }
    
    // Validate files
    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const videoLocalPath = req.files.videoFile[0]?.path
    const thumbnailLocalPath = req.files.thumbnail[0]?.path

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail paths are missing")
    }

    let videoUploadResponse, thumbnailUploadResponse

    try {
        // Upload video
        videoUploadResponse = await uploadOnCloudinary(videoLocalPath)
        if (!videoUploadResponse) {
            throw new ApiError(500, "Failed to upload video file")
        }

        // Upload thumbnail
        thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnailUploadResponse) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }

    } catch (error) {
        // Cleanup temp files on upload failure
        if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath)
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
        throw error
    }

    // Get duration from cloudinary response
    let duration = 0
    if (videoUploadResponse.duration) {
        duration = Math.round(videoUploadResponse.duration)
    }

    // Create video document
    const video = await Video.create({
        videoFile: videoUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        title: title.trim(),
        description: description.trim(),
        duration: duration, // in seconds
        owner: req.user._id,
        isPublished: true
    })

    // Cleanup temp files
    try {
        if (fs.existsSync(videoLocalPath)) fs.unlinkSync(videoLocalPath)
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
    } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
        // Don't throw - video is already created
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            video,
            "Video published successfully"
        )
    )
})

// ====================================================================
// GET VIDEO BY ID - Fixed version
// ====================================================================
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    // Build match conditions based on authentication
    const matchConditions = { _id: new mongoose.Types.ObjectId(videoId) }
    
    if (req.user) {
        // If authenticated, show published videos OR videos owned by user
        matchConditions.$or = [
            { isPublished: true },
            { owner: req.user._id }
        ]
    } else {
        // If not authenticated, only show published videos
        matchConditions.isPublished = true
    }

    const video = await Video.findOne(matchConditions).populate(
        "owner",
        "username fullName avatar email"
    )

    if (!video) {
        throw new ApiError(404, "Video not found or access denied")
    }

    // Get counts
    const [likeCount, commentCount] = await Promise.all([
        Like.countDocuments({ video: videoId }),
        Comment.countDocuments({ video: videoId })
    ])

    // Check if user has liked this video
    let isLiked = false
    if (req.user) {
        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        })
        isLiked = !!existingLike
    }

    // Increment view count
    await Video.findByIdAndUpdate(videoId, {
        $inc: { viewsCount: 1 }
    })

    const videoData = {
        ...video.toObject(),
        likeCount,
        commentCount,
        isLiked
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            videoData,
            "Video fetched successfully"
        )
    )
})

// ====================================================================
// UPDATE VIDEO - Fixed version
// ====================================================================
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this video")
    }

    const updateData = {}

    // Update title if provided
    if (title !== undefined) {
        if (!title?.trim()) {
            throw new ApiError(400, "Title cannot be empty")
        }
        updateData.title = title.trim()
    }

    // Update description if provided
    if (description !== undefined) {
        if (!description?.trim()) {
            throw new ApiError(400, "Description cannot be empty")
        }
        updateData.description = description.trim()
    }

    let thumbnailUploadResponse
    let oldThumbnailUrl

    // Update thumbnail if file is provided
    if (req.file) {
        // Upload new thumbnail
        thumbnailUploadResponse = await uploadOnCloudinary(req.file.path)

        if (!thumbnailUploadResponse) {
            throw new ApiError(500, "Failed to upload new thumbnail")
        }

        // Store old thumbnail for cleanup
        oldThumbnailUrl = video.thumbnail

        // Update thumbnail in DB
        updateData.thumbnail = thumbnailUploadResponse.url

        // Cleanup temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }
    }

    // Update video
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate("owner", "username fullName avatar")

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }

    // Delete old thumbnail from cloudinary (optional - implement if you have the function)
    // if (oldThumbnailUrl && thumbnailUploadResponse) {
    //     try {
    //         const oldPublicId = extractPublicIdFromUrl(oldThumbnailUrl)
    //         if (oldPublicId) {
    //             await deleteFromCloudinary(oldPublicId)
    //         }
    //     } catch (error) {
    //         console.error("Failed to delete old thumbnail:", error)
    //     }
    // }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video updated successfully"
        )
    )
})

// ====================================================================
// DELETE VIDEO - Fixed version
// ====================================================================
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Find video first to check ownership
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this video")
    }

    // Delete associated comments
    await Comment.deleteMany({ video: videoId })

    // Delete associated likes
    await Like.deleteMany({ video: videoId })

    // Delete the video
    await Video.findByIdAndDelete(videoId)

    // TODO: Delete video file from cloud storage if implemented
    // await deleteFromCloudinary(video.videoFile)
    // await deleteFromCloudinary(video.thumbnail)

    return res.status(200).json(
        new ApiResponse(
            200,
            { videoId },
            "Video deleted successfully"
        )
    )
})

// ====================================================================
// TOGGLE PUBLISH STATUS - Fixed version
// ====================================================================
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check ownership
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to modify this video")
    }

    // Toggle publish status
    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videoId: video._id,
                isPublished: video.isPublished,
                title: video.title
            },
            `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}