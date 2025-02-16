import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    isDeleted: Boolean,
  },

  {
    timestamps: true,
  }
);
postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
});
const postModel = mongoose.models.post || mongoose.model("post", postSchema);

export default postModel;
