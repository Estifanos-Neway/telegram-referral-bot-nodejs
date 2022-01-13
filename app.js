
// importing necessary modules
const express = require("express");

// importing project variables which are stored in a separate file (variables.js)
const {
    default_port,
    referrer_request_identifier,
    attachment_file_types } = require("./variables");

// importing project functions which are stored in a separate file (functions.js)
const {
    newUsersHandler,
    referrerAnswerHandler,
    attachmentHandler } = require("./functions");

// initiating the express app
const app = express();
const port = process.env.PORT || default_port;

// parsing the incoming body (json)
app.use(express.json())

// this function will be used to handle incoming post requests
async function postHandler(req, res) {
    try {
        let message =  req.body?.["message"];
        let user_id = message["from"]["id"];
        if(!message) return;
        
        // here we check for new chat members
        if (message["new_chat_members"]) {
            let new_chat_members = message["new_chat_members"];
            let chat_id = req.body["message"]["chat"]["id"];

            console.log(`Handling new_chat_member [id: ${user_id}]...`);
            await newUsersHandler(new_chat_members,chat_id);
            console.log(`new_chat_member [id: ${user_id}] handled.`);
        }

        // here we check for messages replies
        // if there this is a replay message then
        // we will check if it is answer for referrer code request
        else if(message["reply_to_message"]?.["text"]){
            let reply_to_text = message["reply_to_message"]?.["text"];
            if(reply_to_text){
                if(reply_to_text.endsWith(referrer_request_identifier)){
                    console.log(`Handling referrer_request_answer from [id: ${user_id}]...`); 
                    await referrerAnswerHandler(message,message["reply_to_message"]["message_id"]);
                    console.log(`Referrer_request_answer from [id: ${user_id}] handled.`); 
                }
            }
        }
        else{
            attachment_file_types.forEach(async file_type => {
                if(message[file_type]){
                    console.log(`Handling attached file by [id: ${user_id}]...`);
                    await attachmentHandler(message,file_type);
                    console.log(`File attached by [id: ${user_id}] handled.`); 

                }
            })
        }
    } catch (error) {
        console.error(error);
    }
    finally {
        res.end();
    }
}

// routing the post 
app.post("/", postHandler);

// start listening
app.listen(port, () => console.log(`Listening at port: ${port}`))