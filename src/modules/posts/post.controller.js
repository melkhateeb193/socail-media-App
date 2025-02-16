import { Router } from "express";
import * as PS from  "./post.service.js";
import * as PV from "./post.validation.js";
import { validation } from "../../middleware/validation.js";
import { fileTypes, multerHost } from "../../middleware/multer.js";
import { authentication } from "../../middleware/auth.js";
import commentRouter from "../comment/comment.controller.js";


const postRouter = Router();

postRouter.use("/:postId/comment",commentRouter);



postRouter.post("/",multerHost(fileTypes.image).array("attachments"),validation(PV.createPostSchema) ,authentication,PS.createPost);
postRouter.patch("/:postId",multerHost(fileTypes.image).array("attachments"),validation(PV.updatePostSchema) ,authentication,PS.updatePost);
postRouter.delete("/freeze/:postId",multerHost(fileTypes.image).array("attachments"),validation(PV.freezePostSchema) ,authentication,PS.freezePost);
postRouter.patch("/unfreeze/:postId",multerHost(fileTypes.image).array("attachments"),validation(PV.freezePostSchema) ,authentication,PS.unfreeze);
postRouter.patch("/like/:postId",multerHost(fileTypes.image).array("attachments"),validation(PV.freezePostSchema) ,authentication,PS.likePost);
postRouter.patch("/unlike/:postId",multerHost(fileTypes.image).array("attachments"),validation(PV.freezePostSchema) ,authentication,PS.unlikePost);
postRouter.get("/",authentication,PS.getPost);
postRouter.post("/undo/:postId", authentication, validation(PV.undoPostSchema), PS.undoPost);
postRouter.post("/archive/:postId", authentication, validation(PV.archivePostSchema), PS.archivePost);
postRouter.get("/my-posts", authentication, PS.findPost);
postRouter.get("/friends-posts", authentication, PS.friendsPost);
postRouter.get("/user-posts/:userId", authentication, validation(PV.getUserPostsSchema), PS.specificPost);
postRouter.delete("/delete/:postId", authentication, validation(PV.softDeletePostSchema), PS.softDeletePostAndComments);
export default postRouter;
