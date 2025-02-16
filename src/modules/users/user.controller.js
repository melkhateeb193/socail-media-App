import { Router } from "express";
import * as US from  "./user.service.js";
import * as UV from "./user.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileTypes, multerHost, multerLocal } from "../../middleware/multer.js";
import { authentication, authorization } from "../../middleware/auth.js";
import { roleTypes } from "../../DB/models/user.model.js";


const userRouter = Router();

userRouter.post("/signUp", multerHost(fileTypes.image).single("attachemnts"),validation(UV.signUpSchema), US.signUp);
userRouter.patch("/confirmEmail", validation(UV.comfirmEmailSchema), US.confirmLogin);
userRouter.post("/login", validation(UV.loginSchema), US.login);
userRouter.get("/refreshToken", validation(UV.refreshTokenSchema), US.refreshToken);
userRouter.patch("/forgetPassword", validation(UV.forgetPasswordSchema), US.forgetPassword);
userRouter.patch("/restPassword", validation(UV.restPasswordSchema), US.restPassword);
userRouter.get("/loginWithGmail", US.loginWithGmail);
userRouter.patch("/updatePassword", validation(UV.updatePasswordSchema),US.updatePassword);
userRouter.patch("/shareProfile/:id", validation(UV.shareProfileSchema),US.shareProfile);
userRouter.patch("/updateEmail", validation(UV.updateEmailSchema),US.updateEmail);
userRouter.patch("/replaceEmail", validation(UV.replaceEmailSchema),US.replaceEmail);
userRouter.post("/enableTwoFA",validation(UV.enableTwoFASchema) ,US.enableTwoFA);
userRouter.post("/verifyTwoFA",validation(UV.verifyTwoFASchema) , US.verifyTwoFA);
userRouter.put("/updateProfile" , multerHost.single("image"), US.updateProfile);
userRouter.post("/blockUser",validation(UV.blockUserSchema) , US.blockUser);
userRouter.post("/view-profile",validation(UV.viewProfileSchema) ,US.viewProfile);
userRouter.get("/dashBoard", authorization, authentication([roleTypes.admin]) ,validation(UV.dashBoardSchema) ,US.dashBoard);
userRouter.patch("/dashBoard/updateRole/:userId", authorization, authentication([roleTypes.admin]) ,validation(UV.dashBoardSchema) ,US.updateRole);








export default userRouter;
