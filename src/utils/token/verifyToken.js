import jwt from "jsonwebtoken";

export const VerifyToken = async({token ,SIGNATURE})=>{
    return jwt.verify(token,SIGNATURE );
}

