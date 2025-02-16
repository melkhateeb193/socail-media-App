import express from "express";
import bootStrap from "./src/app.controller.js";

const app = express();
const port = process.env.PORT || 3001;

bootStrap(app, express);
app.listen(port, () => console.log(`example app listen on port ${port}`));
