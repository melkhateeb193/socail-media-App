import mongoose from "mongoose";


export const enumGenders = {
  male:"male",
  female:"female"
}

export const roleTypes = {
  user: "user",
  admin: "admin",
  superAdmin: "superAdmin",
};
export const providerTypes = {
  system: "system",
  google: "google",
  facebook: "facebook",
};
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    gender: {
      type: String,
      enum: Object.values(enumGenders),
      default: enumGenders.male,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(roleTypes),
      default: roleTypes.user,
      required: true,
    },
    passwordChangedAt:Date,
    isDeleted:{
      type:Boolean,
      default:false
    },

       otpEmail: String,
       tempEmail: String,
       otpNewEmail: String,
       otpPassword: String,
       otpExpiry: { type: Date },
       failedAttempts: { type: Number, default: 0 },
       isBanned: { type: Boolean, default: false },
       banExpiresAt: { type: Date },
       image: {
        type: Object, 
        required: true,
      },
      coverImage: {
        type: Object, 
        required: false, 
      },

       provider: {
        type: String,
        enum: Object.values(providerTypes),
        default: providerTypes.system,
      },
      viewers:[
        {
        userId:{type:mongoose.Schema.Types.ObjectId,ref:"User", required: true,},
        time:[Date]
      }]
  },
  {
    timestamps: true, 
  }
);

export const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;