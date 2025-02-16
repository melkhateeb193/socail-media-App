import jwt from "jsonwebtoken";
import userModel from "../DB/models/user.model.js";
import { asyncHandler } from "../utils/index.js";

export const roles = {
  user: "user",
  admin: "admin",
};
export const authentication = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next(new Error("Authorization header missing", { cause: 401 }));
  }

  const [prefix, token] = authorization.split(" ");
  if (!prefix || !token) {
    return next(new Error("No token provided", { cause: 401 }));
  }

  let SIGNATURE = undefined;
  if (prefix.toLowerCase() === process.env.PREFIX_TOKEN_ADMIN) {
    SIGNATURE = process.env.SIGNATURE_TOKEN_ADMIN;
  } else if (prefix.toLowerCase() === process.env.PREFIX_TOKEN_USER) {
    SIGNATURE = process.env.SIGNATURE_TOKEN_USER;
  } else {
    return next(new Error("Invalid token prefix", { cause: 401 }));
  }

   const decoded = jwt.verify(token, SIGNATURE);  

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
  if (parseInt(user?.passwordChangedAt.getTime() / 1000 > decoded.iat)) {
    return next(new Error("token expired login again", { cause: 401 }));
  }

  req.user = user;
  next();
});

export const authorization = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!accessRoles.length || accessRoles.includes(req.user.role)) {
      return next();
    }
    return next(new Error("Access denied", { cause: 403 }));
  });
};
