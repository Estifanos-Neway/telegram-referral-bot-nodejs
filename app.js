
// importing necessary modules
const express = require("express");

const { default_port } = require("./variables");
const { newUsersHandler } = require("./functions");
require("dotenv").config();
 
const app = express();
const port = process.env.PORT || default_port;

app.use(express.json())

async function postHandler(req, res) {
    try {
        const new_chat_members = req.body?.["message"]?.["new_chat_members"];
        if (new_chat_members) {
            console.log("Handling new_chat_members...");
            await newUsersHandler(new_chat_members);
        }
    } catch (error) {
        console.error(error);
    }
    finally {
        res.end();
    }
}

app.post("/", postHandler);

app.listen(port, () => console.log(`Listening at:${process.env.BOT_TOKEN} port: ${port}`))