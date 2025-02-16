import postModel from "../../DB/models/post.model.js";
import { roleTypes } from "../../DB/models/user.model.js";
import cloudinary from "../../utils/cloudainry/index.js";
import { paginiation } from "../../utils/feature/index.js";
import { asyncHandler } from "../../utils/index.js";

// ---------------------------- createpost ---------------------------------------

export const createPost = asyncHandler(async (req, res, next) => {
  if (req?.files?.length) {
    for (const file of req.files) {
      const images = [];
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "socailApp/post",
        }
      );
      images.push({ secure_url, public_id });
    }
    req.body.attachments = images;
  }
  const post = await postModel.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ message: "done", post });
});

// ---------------------------- updatePost ---------------------------------------

export const updatePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOne({
    _id: postId,
    userId: req.user._id,
    isDeleted: { $exists: false },
  });
  if (!post) {
    return next(new Error("post not found or deleted"), { cause: 404 });
  }

  if (req?.files?.length) {
    for (const file of post.attachments) {
      await cloudinary.uploader.destroy(file.public_id);
    }

    for (const file of req.files) {
      const images = [];
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "socailApp/post",
        }
      );
      images.push({ secure_url, public_id });
    }
    post.attachments = images;
  }
  if (req.body.content) {
    post.content = req.body.content;
  }
  await post.save();
  return res.status(201).json({ message: "done", post });
});

// ---------------------------- freezePost ---------------------------------------

export const freezePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const condition =
    req.user.role === roleTypes.admin ? {} : { userId: req.user._id };
  const post = await postModel.findOneAndUpdate(
    {
      _id: postId,
      ...condition,
      isDeleted: { $exists: false },
    },
    { isDeleted: true, deletedBy: req.user._id },
    { new: true }
  );
  if (!post) {
    return next(new Error("post not found or deleted"), { cause: 404 });
  }
  return res.status(201).json({ message: "done", post });
});
// ---------------------------- unfreeze ---------------------------------------

export const unfreeze = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOneAndUpdate(
    {
      _id: postId,
      isDeleted: { $exists: true },deletedBy:req.user._id,
    },
    { $unset:{deletedBy:0 ,isDeleted} },
    { new: true }
  );
  if (!post) {
    return next(new Error("post not found or deleted"), { cause: 404 });
  }
  return res.status(201).json({ message: "done", post });
});
// ---------------------------- likePost ---------------------------------------

export const likePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOneAndUpdate(
    {
      _id: postId,
      isDeleted: { $exists: true },
    },
    { $addToSet:{likes:req.user._id} },
    { new: true }
  );
  if (!post) {
    return next(new Error("post not found or deleted"), { cause: 404 });
  }
  return res.status(201).json({ message: "done", post });
});
// ---------------------------- unlike ---------------------------------------

export const unlikePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOneAndUpdate(
    {
      _id: postId,
      isDeleted: { $exists: true },
    },
    { $pull:{likes:req.user._id} },
    { new: true }
  );
  if (!post) {
    return next(new Error("post not found or deleted"), { cause: 404 });
  }
  return res.status(201).json({ message: "done", post });
});
// ---------------------------- get ---------------------------------------

export const getPost = asyncHandler(async (req, res, next) => {
  const posts = await postModel.find(
    {
      isDeleted: { $exists: true },
    }
  ).populate([
    {path:"comment"},
  ])
  return res.status(200).json({ message: "done", posts });
});



// ---------------------------- Undo Post ---------------------------------------
export const undoPost =  asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOne({ _id: postId, userId: req.user._id });

  if (!post) {
    return next(new Error("Post not found"), { cause: 404 });
  }

  const timeDiff = (Date.now() - post.createdAt) / 1000 / 60;
  if (timeDiff > 2) {
    return next(new Error("Undo time limit exceeded"), { cause: 403 });
  }

  await postModel.deleteOne({ _id: postId });
  return res.status(200).json({ message: "Post undone successfully" });
});

// ---------------------------- Archive Post ---------------------------------------
export const archivePost =  asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOne({ _id: postId, userId: req.user._id });

  if (!post) {
    return next(new Error("Post not found"), { cause: 404 });
  }

  const timeDiff = (Date.now() - post.createdAt) / 1000 / 60 / 60;
  if (timeDiff < 24) {
    return next(new Error("Post cannot be archived before 24 hours"), { cause: 403 });
  }

  post.isArchived = true;
  await post.save();
  return res.status(200).json({ message: "Post archived successfully" });
});

// ---------------------------- Find Posts ---------------------------------------
export const findPost = asyncHandler(async (req, res) => {
  const posts = await postModel.find({ userId: req.user._id, isPublic: true });
  return res.status(200).json({ posts });
});

// ---------------------------- friends Posts ---------------------------------------

export const friendsPost =asyncHandler(async (req, res) => {
  const friendIds = req.user.friends; 
  const posts = await postModel.find({ userId: { $in: friendIds }, isPublic: true });
  return res.status(200).json({ posts });
});
// ---------------------------- specific Posts ---------------------------------------
export const specificPost = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const posts = await postModel.find({ userId, isPublic: true });
  return res.status(200).json({ posts });
});

// ---------------------------- Soft Delete Post & Comments ---------------------------------------
export const softDeletePostAndComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findOneAndUpdate(
    { _id: postId, userId: req.user._id },
    { isDeleted: true },
    { new: true }
  );

  if (!post) {
    return next(new Error("Post not found"), { cause: 404 });
  }

  await commentModel.updateMany({ postId }, { isDeleted: true });
  return res.status(200).json({ message: "Post and its comments soft deleted" });
});

export const getPosts = asyncHandler(async (req, res,next) => {
const {data , _page} =  await paginiation ({model:postModel,page:req.query.page,populate:[]})
  console.log(posts)
  return res.status(200).json({ message:"done" ,posts:data,_page});
});