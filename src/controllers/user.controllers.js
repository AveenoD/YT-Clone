import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import User from "../models/User.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  
        const {username, email, fullName, password} = req.body;
        console.log('email: ', email);

        if(
            [username, email, fullName, password].some((field) => field?.trim() === "")
        ){
           throw new ApiError(400,"All fields are required");
        }
       const existedUser = await User.findOne({
            $or: [{email}, {username}]
        }) ;
        if(existedUser){
            throw new ApiError(409,"User with given email or username already exists");
        }
        const avatarLocalPath = req.file?.avatar[0]?.path;
        const coverImageLocalPath = req.file?.coverImage[0]?.path;

        if(!avatarLocalPath ){
            throw new ApiError(400,"Avatar is required");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = coverImageLocalPath
            ? await uploadOnCloudinary(coverImageLocalPath)
            : null;

        if (!avatar) {
            throw new ApiError(400, "avatar image is required");
        }

        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage ? coverImage.url : null,
            username: username.toLowerCase(),
            email,
            password,

        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if(!createdUser){
            throw new ApiError(500,"User registration failed, please try again");
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
        )

});

export {registerUser};