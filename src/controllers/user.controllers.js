import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.log("📦 Collection:", User.collection.name);

export { registerUser };
