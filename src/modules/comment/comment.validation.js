import joi from "joi";
import { generalRules } from "../../utils/index.js";


export const createCommentSchema = {
    body: joi
      .object({
        content: joi.string().required(),
        onModel: joi.string().valid("post","comment").required(),
      }),
    params: joi
      .object({
        postId: joi.string().required(), 
      }),
      files:joi.array().items(generalRules.file)
      .required(),
  };

export const updateCommentSchema = {
    body: joi
      .object({
        content: joi.string(),
      }),
    params: joi
      .object({
        postId: joi.string().required(), 
        commentId: joi.string().required(), 
      }),
      files:joi.array().items(generalRules.file)
      .required(),
  };
export const freezeCommentSchema = {

    params: joi
      .object({
        postId: joi.string().required(), 
        commentId: joi.string().required(), 
      })
  };
