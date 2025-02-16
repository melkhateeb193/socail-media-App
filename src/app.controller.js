import connectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors";
import { globalErrorHandling } from "./utils/globalErrorHandling/index.js";
import postRouter from "./modules/posts/post.controller.js";
const bootStrap = async (app, express) => {
  app.use(cors());
  // middle ware for passing requested body
  app.use(express.json());
  //  data base connection
  await connectionDB();
  // main route
  app.get("/", (req, res, next) => {
    return res.status(200).json("hello to socail media app");
  });

  // user route
  app.use("/user", userRouter);
  app.use("/posts", postRouter);
  app.use("/comments", commentRouter);
  // routes for unhandled request
  app.use("*", (req, res, next) => {
    return next (new Error (`invalid URL ${req.originalUrl}` , {cause:404}))
  });
  // global handling
  app.use(globalErrorHandling);
};

export default bootStrap;
