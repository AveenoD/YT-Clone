import mongoose,{isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Tweet} from "../models/tweet.models.js"
import { Video } from "../models/video.models.js" 
import { Comment } from "../models/comment.models.js" 


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID")
    }
    const video = await Video.findById(videoId)
    if(!video)
    {
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await video.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    let isLiked;
    let actionMessage;

    if(existingLike)
    {
        await Like.deleteOne({_id: existingLike._id})
        isLiked = false,
        actionMessage = "Video unliked successfully"
    }
    else{
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        isLiked = true
        actionMessage = "Video liked successfully"
    }
    const totalLikes = await Like.countDocument({video: videoId})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,{
            liked: isLiked,
            totalLikes,
            videoId
            }, actionMessage)
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400,"Invalid comment ID")
    }

    const comment = await Comment.findById(commentId)
    if(!comment)
    {
        throw new ApiError(404, "Comment not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    let isLiked;
    let actionMessage;

    if(existingLike)
    {
        await Like.deleteOne({_id: existingLike._id})
        isLiked = false
        actionMessage = "Comment unliked successfully"
    }
    else{
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        isLiked = true
        actionMessage = "Comment liked successfully" 
    }

    const totalLikes = await Like.countDocument({comment: commentId})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                liked: isLiked,
                totalLikes,
                commentId
            }, actionMessage
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const tweet = await Tweet.findByID(tweetId)

    if(!tweet)
    {
        throw new ApiError(404, "Tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    let isLiked;
    let actionMessage;

    if(existingLike)
    {
        await Like.deleteOne({_id: existingLike._id});
        isLiked = false;
        actionMessage ="Tweet unliked successfully"
    }
    else{
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });
        isLiked= true;
        actionMessage= "Tweet liked successfully"
    }

    const totalLikes =  await Like.countDocument({tweet: tweetId});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,{
            liked: isLiked,
            totalLikes,
            tweetId
            }, actionMessage)
    )


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId} = req.params
    if(!userId)
    {
        throw new ApiError(400, "User ID is required")
    }

    const likedVideos = Like.aggregate([
        {
            $match:{
                likedBy: userId,
                video: {$exists: true, $ne: null}
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project:{
                _id: "$videoDetails._id",
                title: "$videoDetails.title",       
                description: "$videoDetails.description",
                url: "$videoDetails.url",
                thumbnail: "$videoDetails.thumbnail",
                createdAt: "$videoDetails.createdAt",
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked videos fetched successfully"
            )
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}