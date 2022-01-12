
// importing necessary modules
const express = require("express");
const {
    default_port
} = require("./variables");

const app = express();
const port = process.env.PORT || default_port;

function incomingPostHandler(req,res){
    res.end("All Good.");
}

app.post("/",incomingPostHandler);

app.listen(port,()=>console.log(`Listening at port: ${port}`))