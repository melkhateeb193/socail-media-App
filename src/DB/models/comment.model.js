import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postId",
      required: true,
    },
    refId:{
      type: mongoose.Schema.Types.ObjectId,
      refPath:"onModel"
    },
    onModel:{
      type: String,
      required: true,
      enum: ["post", "comment"]},

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
        ref: "User", 
      },
    ],
    isDeleted: Boolean,
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.virtual("reply",{
  ref: "reply",
  localField: "_id",
  foreignField: "commentId",
})


const commentModel = mongoose.models.comment || mongoose.model("comment", commentSchema);

export default commentModel;
