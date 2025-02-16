import joi from "joi";
import { generalRules } from "../../utils/index.js";


export const createPostSchema = {
    body: joi
      .object({
        content: joi.string().min(3).required(),
        userId: joi.string().required(), 
      }),
      files:joi.array().items(generalRules.file)
      .required(),
  };
export const updatePostSchema = {
    body: joi
      .object({
        content: joi.string().min(3)
      }),
    params: joi
      .object({
        postId: generalRules.id.required(),
      }),
      files:joi.array().items(generalRules.file)
      .required(),
  };
export const freezePostSchema = {
    params: joi
      .object({
        postId: generalRules.id.required(),
      }).required(),
  };


  export const undoPostSchema = joi.object({
    postId: joi.string().required(),
  });
  
  export const archivePostSchema = joi.object({
    postId: joi.string().required(),
  });
  
  export const getUserPostsSchema = joi.object({
    userId: joi.string().required(),
  });
  
  export const softDeletePostSchema = joi.object({
    postId: joi.string().required(),
  });
  