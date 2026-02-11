import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const isVideoIdValid = mongoose.Types.ObjectId.isValid(videoId)
    if (!isVideoIdValid) {
        throw new ApiError(400, "Invalid Video ID")
    }

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }

        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",

            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                fullName: "$owner.fullName",
                avatar: "$owner.avatar",
                content: 1,
                createdAt: 1,
            }
        }

    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoComments,
                "Comments fetched successfully")
        )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    const isVideoIdValid =  mongoose.Types.ObjectId.isValid(videoId)
    if (!isVideoIdValid) {
        throw new ApiError(400, "Invalid Video ID")
    }
    const newComment = await Comment.create({
        video: videoId,
        owner: req.user._id,
        content
    })
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newComment,
                "Comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.prarams
    const { content } = req.body
    const isCommentIdValid =  mongoose.Types.ObjectId.isValid(commentId)
    if (!isCommentIdValid) {
        throw new ApiError(400, "Invalid Comment ID")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content
        },
        {
            new: true
        }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
   
    const isCommentIdValid = mongoose.Types.ObjectId.isValid(commentId)

    if(!isCommentIdValid)
    {
       throw new ApiError(400, "Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment)
    {
        throw new ApiError(400, "Comment not  found")
    }
    if(comment.owner.toString() !== req.user._id.toString())
    {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)
    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteComment, "Comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}