import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import randomatic from "randomatic";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import JWT from "jsonwebtoken";
import { uploadOnCloudinary } from "../services/cloudinary.service.user.js";
import { v2 as cloudinary } from "cloudinary";
import { Address } from "../models/address.model.js";

// Generation of access and refresh token
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "unable to generate token, please try again later");
  }
};

// Signup (creating user account)
const signup = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  if ([firstName, lastName, email, password].some((field) => !field || field.trim() === "")) {
    throw new apiError(400, "please provide values for all required fields");
  }  

  if (!email.includes("@gmail.com")) {
    throw new apiError(400, "invalid email address, please use a valid format");
  }

  const existUser = await User.findOne({ email });

  if (existUser) {
    throw new apiError(
      400,
      "email address already in use, please use a different email"
    );
  }

  // if (!req.file) {
    // throw new apiError(400, "cover image is required");
  // }

  // const coverImagePath = req.file.path;

  // const coverImage = await uploadOnCloudinary(coverImagePath);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    // coverImage: {
      // public_id: coverImage.public_id || "",
      // url: coverImage.url || "",
    // },
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "unable to create user, please try again later");
  }

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        "your account has been created successfully",
        createdUser
      )
    );
});

// Login (login into user account)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((fields) => fields.trim() === "")) {
    throw new apiError(400, "please provide values for all required fields");
  }

  if (!email.includes("@gmail.com")) {
    throw new apiError(400, "invalid email address, please use a valid format");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new apiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password.trim());

  if (!isPasswordValid) {
    throw new apiError(
      400,
      "invalid credentials, please check your email and password"
    );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        "successfully logged in, you can now access your account",
        loggedInUser
      )
    );
});

// Logout (logout from user account)
const logout = asyncHandler(async (req, res) => {
  const user = req.user;

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, "you have been logged out successfully"));
});

// Delete account (user account delete)
const deleteUserAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const userId = req.user._id;

  if (!password) {
    throw new apiError(400, "please provide a value for the password field");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new apiError(404, "user not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(400, "invalid password, please check your password");
  }

  const coverImagePublicId = user.coverImage?.public_id;

  if (coverImagePublicId) {
    const cloudinaryResponse = await cloudinary.uploader.destroy(coverImagePublicId);

    if (cloudinaryResponse.result !== "ok") {
      throw new apiError(500, "failed to delete cover image from cloudinary");
    }
  }

  const deleteAddress = await Address.findOneAndDelete({ user: userId });

  if (!deleteAddress) {
    throw new apiError(404, "no associated address found to delete");
  }

  try {
    await User.findByIdAndDelete(userId);

    return res
      .status(200)
      .json(
        new apiResponse(200, "user and associated address deleted successfully")
      );
  } catch (error) {
    throw new apiError(
      500,
      "an error occurred while trying to delete the user, please try again later"
    );
  }
});

// Update user (update user account details)
const updateUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { firstName, lastName, email } = req.body;
  const updateFields = {};

  if (!firstName && !lastName && !email && !req.file) {
    throw new apiError(400, "at least one field is required to update");
  }

  if (firstName) updateFields.firstName = firstName.trim();
  if (lastName) updateFields.lastName = lastName.trim();
  if (email) updateFields.email = email.trim();

  if (req.file) {
    const user = await User.findById(userId);
    if (user.coverImage && user.coverImage.public_id) {
      await cloudinary.uploader.destroy(user.coverImage.public_id);
    }

    const coverImagePath = req.file.path;
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if (!coverImage) {
      throw new apiError(500, "failed to upload the new cover image");
    }

    updateFields.coverImage = {
      public_id: coverImage.public_id,
      url: coverImage.url,
    };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedUser) {
    throw new apiError(
      500,
      "account details could not be updated, please try again later"
    );
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, "account details updated successfully", updatedUser)
    );
});

// Update password (change user password)
const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user;
  const { oldPassword, newPassword } = req.body;

  if ([oldPassword, newPassword].some((fields) => fields.trim() === "")) {
    throw new apiError(400, "please provide value for required field");
  }

  const user = await User.findById(userId);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new apiError(400, "invalid password, please check your password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, "your password has been updated successfully"));
});

// Access token regeneration
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "unauthorized request");
  }

  try {
    const decodedToken = JWT.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new apiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new apiResponse(200, "access token refreshed"));
  } catch (error) {
    throw new apiError(401, error.message || "invalid refresh token");
  }
});

// Forget (send opt using mail to reset password, if forget during login)
const forget = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "please provide values for all required fields");
  }

  if (!email.includes("@gmail.com")) {
    throw new apiError(400, "invalid email address, please use a valid format");
  }

  const user = await User.findOne({ email }).select("-password -refreshToken");

  if (!user) {
    throw new apiError(404, "user does not exist");
  }

  const otp = randomatic("0", 6);
  const forgotToken = await bcrypt.hash(otp, 10);

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_MAIL_ID,
        pass: process.env.NODEMAILER_MAIL_ID_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_MAIL_ID,
      to: email,
      subject: "Your OTP Code for Verification",
      text: `Hello,\n\nYour OTP code is: ${otp}\n\nPlease use this code to verify your account. It expires in 10 minutes. If you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    const options = {
      httpOnly: true,
      secure: false,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    };

    return res
      .status(200)
      .cookie("forgetToken", forgotToken, options)
      .cookie("email", email, options)
      .json(
        new apiResponse(
          200,
          "email sent successfully to your registered email address"
        )
      );
  } catch (error) {
    throw new apiError(500, "failed to send email, please try again later");
  }
});

// Otp (opt verify after sending mail)
const otpVerify = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const token = req.cookies.forgetToken;

  if (!otp || otp.trim() === "") {
    throw new apiError(400, "please provide values for all required fields");
  }

  if (!token) {
    throw new apiError(400, "your OTP has expired, please request a new one.");
  }

  const isOtpCorrect = await bcrypt.compare(otp, token);

  if (!isOtpCorrect) {
    throw new apiError(
      400,
      "the OTP you entered is incorrect, please try again"
    );
  }

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("forgetToken", options)
    .json(new apiResponse(200, "OTP verified successfully"));
});

// reset password (reset pasword if otp is correct)
const changePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim() === "") {
    throw new apiError(400, "please provide values for all required fields");
  }

  const email = req.cookies.email;

  const user = await User.findOne({ email });

  try {
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    throw new apiError(
      500,
      "unable to update your password, please try again later"
    );
  }

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("email", options)
    .json(new apiResponse(200, "your password has been updated successfully"));
});

// user (current user info)
const currentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res
    .status(200)
    .json(
      new apiResponse(200, "user information retrieved successfully", user)
    );
});

// Users --admin (show all users account details)
const allUser = asyncHandler(async (req, res) => {
  const users = await User.find();

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        "all users accounts have been retrieved successfully",
        users
      )
    );
});

// User --admin (get a single user details)
const userDetails = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!userId || userId.trim() === "") {
    throw new apiError(400, "please provide user id for required fields");
  }

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new apiError(404, "user does not exist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, "user information retrieved successfully", user)
    );
});

// Update userType --admin (update userType)
const updateUserType = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { type } = req.body;

  if (!type) {
    throw new apiError(400, "please provide user type for required field");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        userType: type,
      },
    },
    { new: true }
  );

  if (!user) {
    throw new apiError(
      500,
      "unable to update user details at this time, please try again later"
    );
  }

  return res
    .status(200)
    .json(new apiResponse(200, "user successfully updated", user));
});

// Delete user --admin (delete user account by the admin)
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!userId || userId.trim() === "") {
    throw new apiError(400, "please provide user id for required field");
  }

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new apiError(404, "user does not exist");
  }

  const coverImagePublicId = user.coverImage?.public_id;
  const cloudinaryResponse =
    await cloudinary.uploader.destroy(coverImagePublicId);

  if (cloudinaryResponse.result !== "ok") {
    throw new apiError(500, "failed to delete cover image from Cloudinary");
  }

  await User.findByIdAndDelete(userId);

  return res
    .status(200)
    .json(
      new apiResponse(200, "user account has been deleted successfully", user)
    );
});

export {
  signup,
  login,
  logout,
  refreshAccessToken,
  forget,
  otpVerify,
  changePassword,
  currentUser,
  deleteUser,
  userDetails,
  allUser,
  deleteUserAccount,
  updateUserAccount,
  updatePassword,
  updateUserType,
};
