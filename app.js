
// importing necessary modules
const express = require("express");

const { default_port } = require("./variables");
const { newUsersHandler } = require("./functions");

const app = express();
const port = process.env.PORT || default_port;

app.use(express.json())

async function postHandler(req, res) {
    try {
        const new_chat_members = req.body?.["message"]?.["new_chat_members"];
        if (new_chat_members) {
            newUsersHandler(new_chat_members);
        }
    } catch (error) {
        console.error(error);
    }
    finally {
        res.end();
    }
}

app.post("/", postHandler);

app.listen(port, () => console.log(`Listening at port: ${port}`))