import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Options } from "../utils/Options.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const generateAccessTokenAndRefreshToken = async (userID) =>{
    try {
    
        const user = await User.findOne(userID)
        const accessToken = user.generateAccessToken()       
        const refreshToken = user.generateRefereshToken() 
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token!")
    }
}

const registerUser = asyncHandler(async (req, res) => {
 
    const { username, email, fullName, password } = req.body;
    console.log('📧 Email:', email);
    

    if ([username, email, fullName, password].some((field) => 
        field?.trim() === ""
    )) {
        throw new ApiError(400, "All fields are required");
    }
    

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    });
    
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    

    console.log('📁 Files received:', req.files);
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    console.log('🖼️ Avatar path:', avatarLocalPath);
    console.log('🖼️ Cover path:', coverImageLocalPath);
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    

    console.log('☁️ Uploading avatar to Cloudinary...');
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    
    if (!avatar) {
        throw new ApiError(400, "Avatar upload to Cloudinary failed");
    }
    
    console.log('✅ Avatar uploaded:', avatar.url);
    
   
    let coverImage = null;
    if (coverImageLocalPath) {
        console.log('☁️ Uploading cover image to Cloudinary...');
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log('✅ Cover uploaded:', coverImage?.url);
    }
    
 
    console.log('💾 Creating user in database...');
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password,
    });
    
    console.log('✅ User created with ID:', user._id);
    
    // 9. Get created user without password and refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }
    
    // 10. Return response
    console.log('🎉 Registration successful!');
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );



});

const loginUser = asyncHandler(async(req, res) => {
    const {username, email, password} =  req.body;

    if(!(username || email))
    {
        throw new ApiError(400, "username or email is required!")
    }

    const user = await User.findOne({
        $or:[{username}, {email}]
    })
    if(!user)
    {
        throw new ApiError(404, "User does not exist's!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid)
    {
        throw new ApiError(401, "Invalid Password!");
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    return res
    .status(200)
    .cookie("accessToken", accessToken, Options)
    .cookie("refreshToken", refreshToken, Options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken

            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )
    return res
    .status(200)
    .clearCookie("accessToken", Options)
    .clearCookie("refreshToken", Options)
    .json(new ApiResponse(200,{},"User Logged Out!"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken)
    {
        throw new ApiError(401, "Unauthorized request")
    }

   try {
     const decodedToken = jwt.verify(
         incommingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken?._id)
     if(!user)
     {
         throw new ApiError("Invalid refresh token")
     }
 
     if(incommingRefreshToken !==user?.refreshToken)
     {
         throw new ApiError(401, "Refresh token is expired or used")
     }
 
     const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user?._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, Options)
     .cookie("refreshToken",newRefreshToken, Options)
     .json(
         new ApiResponse(
             200,
             {
                 accessToken, refreshToken: newRefreshToken
             },
             "Access Token refreshed"
         )
     )
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) =>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid old password")

    }

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res
    .status(200
    .json(new ApiResponse(200, "Password changed successfully!"))
    )

})

const getCurrentUser = asyncHandler(async (req, res) => {
     return res.status(200)
     .json(new ApiResponse(200, "Current User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullName, email} = req.body

    if(!fullName || !email)
    {
        throw new ApiError(400, "fullName and email are required!")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            fullName,
            email
        }
    },
    {new: true}
).select("-password")
return res
.status(200)
.json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = await req.file?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is missing!")

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
    {
        throw new ApiError(400, "Error while uploading avatar")

    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avtar Image updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = await req.file?.path

    if(!coverImageLocalPath)
    {
        throw new ApiError(400, "Cover Image file is missing!")

    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
    {
        throw new ApiError(400, "Error while uploading Cover image")

    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

const getUserChannelDetails = asyncHandler(async (req, res) => {
    const {username}  = req.params

    if(!username?.trim())
    {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscriber"
            }
        },
        {
             $lookup:{
             from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscriberTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                    
                },
                channelsSubscribedToCount:{
                    $size:"$subscriberTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }

    ])
    console.log("channels: ",channel);

    if(!channel?.length)
    {
        throw new ApiError(404, "Channel does not exists")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"users",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHisory,
            "Watch History fetched successfully"

        )
    )
})
export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelDetails,
    getWatchHistory
};
