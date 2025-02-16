import commentModel from "../../DB/models/comment.model.js";
import postModel from "../../DB/models/post.model.js";
import { roleTypes } from "../../DB/models/user.model.js";
import cloudinary from "../../utils/cloudainry/index.js";
import { asyncHandler } from "../../utils/index.js";

// ---------------------------- createComment ---------------------------------------

export const createComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

if (commentId) {
  const comment =await commentModel.findOne({postId,userId:req.user._id ,isDeleted:{$exists:false}}) 
  if (!comment) return next(new Error("comment not found"), { cause: 404 });
}

  const post = await postModel.findOne({
    _id: postId,
    isDeleted: { exists: false },
  });
  if (!post) return next(new Error("post not found"), { cause: 404 });
  if (req.files.length) {
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "socailApp/comment",
        }
      );
      list.push({ secure_url, public_id });
    }
    req.body.attachments = list;
  }
  const comment = await commentModel.create({
    ...req.body,
    commentId,
    refId:postId,
    postId,
    userId: req.user._id,
  });
  return res.status(201).json({ message: "done", comment });
});

// ---------------------------- updateComment ---------------------------------------

export const updateComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

  const comment = await commentModel
    .findOne({
      _id: commentId,
      isDeleted: { exists: false },
      postId,
      userId: req.user._id,
    })
    .populate(path, "postId");

  if (!comment || !comment.postId)
    return next(new Error("comment not found"), { cause: 404 });

  if (req.files.length) {
    for (const file of req.user.attachments) {
      await cloudinary.destroy(file.path);
    }
    const list = [];
    for (let file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "socailApp/comment",
        }
      );
      list.push({ secure_url, public_id });
    }
    req.body.attachments = list;
  }
  const newComment = await commentModel.findOneAndUpdate(
    { _id: req.params.commentId, userId: req.user._id },
    req.body,
    { new: true }
  );
  return res.status(201).json({ message: "done", newComment });
});
// ---------------------------- freezeComment ---------------------------------------

export const freezeComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;

  const comment = await commentModel
    .findOne({ _id: commentId, isDeleted: { exists: false }, postId })
    .populate(path, "postId");

  if (
    !comment ||
    (req.user.role != roleTypes.admin &&
      req.user._id.toString() != comment.userId.toString() &&
      req.user._id.toString() != comment.postId.toString())
  )
   { return next(new Error("comment not found"), { cause: 403 })}

  
  const newComment = await commentModel.findOneAndUpdate(
    { _id: commentId, isDeleted:true , deletedBy: req.user._id },
    req.body,
    { new: true }
  );
  return res.status(201).json({ message: "done", newComment });
});
