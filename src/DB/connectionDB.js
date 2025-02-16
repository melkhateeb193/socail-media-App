import mongoose from "mongoose";


const connectionDB = async()=>{
   await mongoose.connect(process.env.URI_CONNECTIONS)
    .then(()=>{
        console.log("connected to MongoDb")
    }).catch((err)=>{
        console.log("error connecting to mongoDB" , err)
    })
}

export default connectionDB