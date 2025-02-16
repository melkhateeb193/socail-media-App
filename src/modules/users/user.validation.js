import joi from "joi";
import { generalRules } from "../../utils/index.js";
import { enumGenders } from "../../DB/models/user.model.js";

export const signUpSchema = joi.object({
  name: joi.string().alphanum().min(3).max(50).required(),
  email: generalRules.email.required(),
  password: generalRules.password.required(),
  phone: joi
    .string()
    .regex(/^01[0125][0-9]{8}$/)
    .required(),
  gender: joi
    .string()
    .valid(...Object.values(enumGenders))
    .required(),
  file: joi.object().required(),
});

export const comfirmEmailSchema = joi
  .object({
    email: generalRules.email.required(),
    code: joi.string().length(6).required(),
  })
  .required();
export const loginSchema = joi
  .object({
    email: generalRules.email.required(),
    password: generalRules.password.required(),
  })
  .required();
export const refreshTokenSchema = joi
  .object({
    authorization: joi.string().required(),
  })
  .required();

export const forgetPasswordSchema = joi
  .object({
    email: joi.string().required(),
  })
  .required();

export const restPasswordSchema = joi
  .object({
    email: joi.string().required(),
    code: joi.string().length(6).required(),
    newPassword: generalRules.password.required(),
    cPassword: generalRules.password.valid(joi.ref("newPassword")).required(),
  })
  .required();
export const updatePasswordSchema = joi.object({
  oldPassword: generalRules.password.required(),
  newPassword: generalRules.password.required(),
  cPassword: generalRules.password.valid(joi.ref("newPassword")).required(),
});
export const shareProfileSchema = joi.object({
  params: joi.object({
    id: generalRules.id.required(),
  }),
});
export const updateEmailSchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
    })
    .required(),
};
export const replaceEmailSchema = {
  body: joi
    .object({
      oldCode: joi.string().length(6).required(),
      newCode: joi.string().length(6).required(),
    })
    .required(),
};

export const enableTwoFASchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
    })
    .required(),
};

export const verifyTwoFASchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
      code: joi.string().length(6).required(),
    })
    .required(),
};

export const updateProfileSchema = {
  body: joi
    .object({
      oldCode: joi.string().length(6).required(),
      newCode: joi.string().length(6).required(),
    })
    .required(),
};

export const blockUserSchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
    })
    .required(),
};
export const viewProfileSchema = {
  params: joi.object({
    id: generalRules.id.required(),
  }),
};
