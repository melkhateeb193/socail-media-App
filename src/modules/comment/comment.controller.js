import { Router } from "express";
import * as CS from  "./comment.service.js";
import * as CV from "./comment.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileTypes, multerHost } from "../../middleware/multer.js";
import { authentication } from "../../middleware/auth.js";


const commentRouter = Router({mergeParams:true });

commentRouter.post("/create",multerHost(fileTypes.image).array("attachments"),validation(CV.createCommentSchema) ,authentication,CS.createComment);
commentRouter.patch("/:commentId",multerHost(fileTypes.image).array("attachments"),validation(CV.updateCommentSchema) ,authentication,CS.updateComment);
commentRouter.delete("/:commentId",validation(CV.freezeCommentSchema) ,authentication,CS.freezeComment);



export default commentRouter;
