
// importing necessary modules
const express = require("express");

const {
    default_port,
    referrer_request_identifier } = require("./variables");
const {
    newUsersHandler,
    referrerAnswerHandler } = require("./functions");
 
const app = express();
const port = process.env.PORT || default_port;

app.use(express.json())

async function postHandler(req, res) {
    try {
        let message =  req.body?.["message"];
        if(!message) return;

        const new_chat_members =message?.["new_chat_members"];
        if (new_chat_members) {
            const chat_id = req.body["message"]["chat"]["id"];
            console.log("Handling new_chat_members...");
            await newUsersHandler(new_chat_members,chat_id);
        } else{
            let reply_to_text = message?.["reply_to_message"]?.["text"];
            if(reply_to_text){
                if(reply_to_text.endsWith(referrer_request_identifier)){
                    referrerAnswerHandler(message);
                }
            }
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