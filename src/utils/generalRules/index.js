import joi from "joi";
import { Types } from "mongoose";

export const customId = (value, helper) => {
  let data = Types.ObjectId.isValid(value);
  return data ? value : helper.message("id is not a valid");
};

export const generalRules = {
  id: joi.string().alphanum().length(24),
  objectId: joi.string().custom(customId),
  email: joi.string().email({
    tlds: { allow: true },
    minDomainSegments: 2,
    maxDomainSegments: 3,
  }),
  password: joi.string(),
  file: joi.object({
    originalname: joi.string().required(),
    mimetype: joi
      .string()
      .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
      .required(),
    size: joi.number().max(5 * 1024 * 1024).required(), // Max 5MB
  }),
  headers: joi.object({
    authorization: joi.string(),
    "content-type": joi.string(),
    "cache-control": joi.string(),
    "postman-token": joi.string(),
    "content-length": joi.string(),
    host: joi.string(),
    "user-agent": joi.string(),
    accept: joi.string(),
    "accept-encoding": joi.string(),
    connection: joi.string(),
  }),
};
