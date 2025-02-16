import { roleTypes, userModel } from "../../DB/models/index.js";
import postModel from "../../DB/models/post.model.js";
import cloudinary from "../../utils/cloudainry/index.js";
import {
  Compare,
  Encrypt,
  eventEmitter,
  generateToken,
  Hash,
  VerifyToken,
} from "../../utils/index.js";
import { asyncHandler } from "../../utils/index.js";
import { OAuth2Client } from "google-auth-library";

//----------------------------- login with gmail --------------------------------------------------

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { email, email_verified, picture, name } = await verify();

  let user = await userModel.findOne({ email });

  if (!user) {
    user = await userModel.create({
      name,
      email,
      image: picture,
      confirmed: email_verified,
      provider: providerTypes.google,
    });
  }
  if (user.provider != providerTypes.google) {
    return next(new Error("login with in system", { cause: 401 }));
  }
  const access_token = await generateToken({
    payload: {
      email,
      id: user._id,
    },
    signature:
      user.role == roleTypes.user
        ? process.env.SIGNATURE_TOKEN_USER
        : process.env.SIGNATURE_TOKEN_ADMIN,
    options: {
      expiresIn: "1d",
    },
  });
  resHandler(res, "success", { token: access_token });
});

//  ---------------------------------------- signUp
export const signUp = asyncHandler(async (req, res, next) => {
  const { name, email, password, gender, phone } = req.body;
  // check email
  if (await userModel.findOne({ email })) {
    return next(new Error("Email already exists", { cause: 400 }));
  }
  if (!req?.file) {
    return next(new Error("Please upload at least one file", { cause: 400 }));
  }
  // const arrPaths = req.files.map(file => file.path);

  const arrPaths = [];
  for (const file of req.files) {
    const { secure_url, public_id } = await cloudinary.uploader
      .upload(file.path)
      .push({
        secure_url,
        public_id,
      });
  }

  // console.log(data)

  //encrypt phone number
  const cipherText = await Encrypt({
    key: phone,
    SECRET_KEY: process.env.SECRET_KEY,
  });

  // hash
  const hash = await Hash({
    key: password,
    SALT_ROUNDS: process.env.SALT_ROUNDS,
  });

  // send email otp

  eventEmitter.emit("sendEmailConfirmation", { email });

  // create user
  const user = await userModel.create({
    name,
    email,
    password: hash,
    gender,
    phone: cipherText,
    coverImage:arrPaths
  });

  return res.status(201).json({ msg: "done ", user });
});

//  ---------------------------------------- comfirmEmail -----------------------------------------
export const confirmLogin = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email });
  if (!user || !user.isTwoFAEnabled) return next(new Error("Invalid request", { cause: 400 }));
  
  if (!(await verifyOTP(user.email, otp, user.otp, user.otpExpiry))) {
    return next(new Error("Invalid or expired OTP", { cause: 400 }));
  }
  const access_token = generateToken({ email, id: user._id }, process.env.SIGNATURE_TOKEN_USER, '1d');
  const refresh_token = generateToken({ email, id: user._id }, process.env.SIGNATURE_TOKEN_USER, '1w');
  return res.status(201).json({ msg: "Login confirmed", token: { access_token, refresh_token } });
});

//  ---------------------------------------- login -----------------------------------------
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email, confirmed: true });
  if (!user) return next(new Error("Email does not exist or not confirmed", { cause: 404 }));
  
  if (!await bcrypt.compare(password, user.password)) {
    return next(new Error("Invalid password", { cause: 400 }));
  }

  if (user.isTwoFAEnabled) {
    const otp = await sendOTP(user.email);
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; 
    await user.save();
    return res.status(200).json({ msg: "OTP sent to email", twoFA: true });
  }

  const access_token = generateToken({ email, id: user._id }, process.env.SIGNATURE_TOKEN_USER, '1d');
  const refresh_token = generateToken({ email, id: user._id }, process.env.SIGNATURE_TOKEN_USER, '1w');
  return res.status(201).json({ msg: "Login successful", token: { access_token, refresh_token } });
});
//  ---------------------------------------- enableTwoFA -----------------------------------------
export const enableTwoFA = asyncHandler(async (req, res, next) => {
  const { email } = req.user; 
  const user = await userModel.findOne({ email });
  if (!user) return next(new Error("User not found", { cause: 404 }));

  const otp = await sendOTP(email);
  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  await user.save();
  return res.status(200).json({ msg: "OTP sent to email for 2FA activation" });
});
//  ---------------------------------------- verifyTwoFA -----------------------------------------
export const verifyTwoFA = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) return next(new Error("User not found", { cause: 404 }));
  
  if (!(await verifyOTP(email, otp, user.otp, user.otpExpiry))) {
    return next(new Error("Invalid or expired OTP", { cause: 400 }));
  }

  user.isTwoFAEnabled = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();
  return res.status(200).json({ msg: "2FA enabled successfully" });
});

//  ---------------------------------------- refreshToken -----------------------------------------
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.body;
  const [prefix, token] = authorization?.split(" ") || [];

  if (!prefix || !token) {
    return next(new Error("No token provided", { cause: 401 }));
  }

  let SIGNATURE = undefined;
  if (prefix.toLowerCase() == process.env.PREFIX_TOKEN_ADMIN.toLowerCase()) {
    SIGNATURE = process.env.SIGNATURE_TOKEN_ADMIN;
  } else if (
    prefix.toLowerCase() == process.env.PREFIX_TOKEN_USER.toLowerCase()
  ) {
    SIGNATURE = process.env.SIGNATURE_TOKEN_USER;
  } else {
    return next(new Error("Invalid token prefix", { cause: 401 }));
  }

  const decoded = await VerifyToken({ token, SIGNATURE });

  if (!decoded?.id) {
    return next(new Error("Invalid token payload", { cause: 401 }));
  }

  const user = await userModel.findById(decoded.id).select("-password").lean();
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  if (user?.isDeleted) {
    return next(new Error("User deleted", { cause: 401 }));
  }

  // Check if the refresh token was issued after the password was last updated
  const passwordLastChangedAt = Math.floor(
    (user.passwordChangedAt?.getTime() || 0) / 1000
  ); // Convert to seconds
  if (passwordLastChangedAt > decoded.iat) {
    return next(
      new Error("Token issued before password update. Please log in again.", {
        cause: 401,
      })
    );
  }

  // Generate a new access token
  const access_token = await generateToken({
    payload: { email: user.email, id: user._id },
    SIGNATURE:
      user.role == roleTypes.user
        ? process.env.SIGNATURE_TOKEN_USER
        : process.env.SIGNATURE_TOKEN_ADMIN,
    option: { expiresIn: "1d" },
  });

  return res.status(201).json({ msg: "done", token: { access_token } });
});

//  ---------------------------------------- forgetPassword -----------------------------------------

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email, isDeleted: false });
  if (!user) {
    return next(new Error("Email not exists ", { cause: 409 }));
  }
  eventEmitter.emit("forgetPassword", { email });
  return res.status(201).json({ msg: "done " });
});
//  ---------------------------------------- restPassword -----------------------------------------

export const restPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  // Find the user
  const user = await userModel.findOne({ email, isDeleted: false });
  if (!user) {
    return next(new Error("Email does not exist", { cause: 404 }));
  }

  // Check if the user is banned
  if (user.isBanned && user.banExpiresAt > Date.now()) {
    const remainingTime = Math.ceil((user.banExpiresAt - Date.now()) / 1000);
    return next(
      new Error(
        `You are temporarily banned. Try again in ${remainingTime} seconds.`,
        {
          cause: 403,
        }
      )
    );
  }

  // Check if the OTP has expired
  if (user.otpExpiry && user.otpExpiry < Date.now()) {
    return next(new Error("Verification code has expired", { cause: 400 }));
  }

  // Compare the provided code with the stored code
  const isCodeValid = await Compare({ key: code, hash: user.otpPassword });
  if (!isCodeValid) {
    const updates = {
      $inc: { failedAttempts: 1 },
    };

    // If failed attempts reach 5, ban the user
    if (user.failedAttempts + 1 >= 5) {
      updates.isBanned = true;
      updates.banExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      updates.failedAttempts = 0;
    }

    await userModel.updateOne({ email }, updates);
    return next(
      new Error(
        user.failedAttempts + 1 >= 5
          ? "Too many failed attempts. You are temporarily banned for 5 minutes."
          : "Invalid verification code",
        { cause: user.failedAttempts + 1 >= 5 ? 403 : 400 }
      )
    );
  }

  // Hash the new password
  const hash = await Hash({
    key: newPassword,
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS),
  });

  // Update the user's password and reset the fields
  await userModel.updateOne(
    { email },
    {
      password: hash,
      confirmed: true,
      $unset: { otpPassword: 1, otpExpiry: 1, banExpiresAt: 1 },
      $set: { isBanned: false, failedAttempts: 0 },
    }
  );

  return res.status(201).json({ msg: "Password reset successfully" });
});
//  ---------------------------------------- updateProfile -----------------------------------------

export const updateProfile = asyncHandler(async (req, res, next) => {
if (req.body.phone) {
  req.body.phone = await Encrypt({key:req.body.phone , SECRET_KEY:process.env.SECRET_KEY})
}
if (req.file) {
  await cloudinary.uploader.destroy(req.user.image.public_id)
  const  {secure_url,public_id}= await cloudinary.uploader.upload(req.file.path,{
    folder:"socail-app/users"
  })
  req.body.image = secure_url,public_id
}
const user = await userModel.findByIdAndUpdate({_id:req.user._id},req.body,{new:true})
  return res.status(201).json({ msg: "updated" ,user});
});
//  ---------------------------------------- updatePassword -----------------------------------------

export const updatePassword = asyncHandler(async (req, res, next) => {
const {oldPassword ,newPassword}= req.body


if (!await Compare({key: oldPassword ,hash:req.user.password})) {

return next(new Error("invalid old password",{cause:400}))
}
const hash =await Hash({key:newPassword ,SALT_ROUNDS:process.env.SALT_ROUNDS})
const user = await userModel.findByIdAndUpdate({_id:req.user._id},{password:hash},{new:true})
  return res.status(201).json({ msg: "updated" ,user});
});
//  ---------------------------------------- blockUser -----------------------------------------

export const blockUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const userId = req.user.id;

  const userToBlock = await userModel.findOne({ email });
  if (!userToBlock) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const currentUser = await userModel.findById(userId);
  if (!currentUser) {
    return next(new Error("Unauthorized", { cause: 401 }));
  }
  if (currentUser.blockedUsers.includes(userToBlock._id)) {
    return res.status(400).json({ message: "User already blocked" });
  }

  currentUser.blockedUsers.push(userToBlock._id);
  await currentUser.save();

  return res.status(200).json({ message: "User blocked successfully" });
});

//  ---------------------------------------- shareProfile -----------------------------------------

export const shareProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await userModel.findOne({ _id: id, isDeleted: false });
  if (!user) {
    return next(new Error("User does not exist or has been deleted", { cause: 404 }));
  }

  if (req.user._id.toString() === id) {
    return res.status(200).json({ msg: "Self-view ignored", user: req.user });
  }

  let viewer = user.viewers.find(viewer => viewer.userId.toString() === req.user._id.toString());

  if (viewer) {
    viewer.times.push(new Date());

    if (viewer.times.length > 5) {
      viewer.times.shift(); 
    }

    if (viewer.times.length === 5) {
      eventEmitter.emit("sendProfileViewEmail", {
        recipientEmail: user.email,
        viewerName: req.user.name,
        viewTimes: viewer.times,
      });
    }
  } else {
    user.viewers.push({ userId: req.user._id, times: [new Date()] });
  }

  // Save the updates
  await user.save();

  return res.status(201).json({ msg: "Profile viewed", user });
});

//  ---------------------------------------- updateEmail -----------------------------------------

export const updateEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (user) {
    return next(new Error("email already found", { cause: 409 }));
  }
  await userModel.updateOne({_id:req.user._id},{tempEmail:email})

eventEmitter.emit("sendEmailConfirmation",{email:req.user.email ,id:req.user._id})
eventEmitter.emit("confirmNewEmail",{email,id:req.user._id})

  return res.status(200).json({ message: "User blocked successfully" });
});

//  ---------------------------------------- replaceEmail -----------------------------------------

export const replaceEmail = asyncHandler(async (req, res, next) => {
  const { oldCode ,newCode } = req.body;

  const user = await userModel.findOne({ _id:req.user.id,isDeleted:false });
  if (!user) {
    return next(new Error("email not exist or deleted", { cause: 409 }));
  }
  if (!await Compare({key:oldCode ,hash:user.otpEmail})) {
    return next(new Error("invalid old code", { cause: 409 }));

  }
  if (!await Compare({key:newCode ,hash:user.otpNewEmail})) {
    return next(new Error("invalid new code", { cause: 409 }));

  }
await userModel.updateOne(
  {_id:req.user._id},
{
  email:user.tempEmail,
$usnet:{
  temp:0,
  otpEmail:0,
  otpNewEmail:0
},
passwordChangedAt:Date.now()
}
)

  return res.status(200).json({ message: "done" });
});

//  ---------------------------------------- viewProfile -----------------------------------------

export const viewProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await userModel.findOne({ _id: id, isDeleted: false });
  
  if (!user) {
    return next(new Error("User does not exist or has been deleted", { cause: 404 }));
  }

  if (req.user._id.toString() === id) {
    return res.status(200).json({ msg: "Self-view ignored", user: req.user });
  }

  let viewer = user.viewers.find(viewer => viewer.userId.toString() === req.user._id.toString());

  if (viewer) {
    viewer.time.push(new Date()); 

    if (viewer.time.length > 5) {
      viewer.time.shift(); 
    }

    if (viewer.time.length === 5) {
      eventEmitter.emit("sendProfileViewEmail", {
        recipientEmail: user.email,
        viewerName: req.user.name,
        viewTimes: viewer.time,
      });
    }
  } else {
    user.viewers.push({ userId: req.user._id, time: [new Date()] });
  }

  await user.save();

  return res.status(201).json({ msg: "Profile viewed", user });
});

//  ---------------------------------------- dashBoard -----------------------------------------

export const dashBoard = asyncHandler(async (req, res, next) => {
// ----------------- promise all means get all request in parallel return the rejected only  ----------------------------
// const data = await Promise.all([
//   postModel.find({}),
//   userModel.find({})
// ])

// ----------------- promise allSettled means get all request with statues  and the reason   ----------------------------
// const data = await Promise.allSettled([
//   postModel.find({}),
//   userModel.find({})
// ])

// ----------------- race the first request done    ----------------------------

const data = await Promise.race([
  postModel.find({}),
  userModel.find({})
])

  return res.status(201).json({ msg: "Profile viewed", data: {user , post} });
});
//  ---------------------------------------- updateRole -----------------------------------------

export const updateRole = asyncHandler(async (req, res, next) => {

const {userId} = req.params
const {role} = req.body
const data=req.user.role == roleTypes.superAdmin  ? {role :{$nin:[roleTypes.superAdmin]} }  : {role :{$in:[roleTypes.admin ,roleTypes.superAdmin]} }

const user = await userModel.findByIdAndUpdate({
  _id:userId,
  isDeleted:false,
...data
},{role,updatedBy:req.user._id},{new:true})

if (!user) {
  return next(new Error("User not found", { cause: 404 }));
}


  return res.status(201).json({ msg: "Profile viewed", user });
});

