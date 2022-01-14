
// importing necessary modules
const express = require("express");

// importing project variables which are stored in a separate file (variables.js)
const {
    default_port } = require("./variables");

// importing project functions which are stored in a separate file (functions.js)
const {
    postHandler,
    fileDownloadHandler } = require("./functions");

// initiating the express app
const app = express();
const port = process.env.PORT || default_port;

// parsing the incoming body (json)
app.use(express.json())

// 
app.enable("query parser");
// Routings

// routing the all post requests
app.post("/", postHandler);

// routing the all post requests
app.get("/file/:file_unique_id", fileDownloadHandler);

// start listening
app.listen(port, () => console.log(`Listening at port: ${port}`))