
const { MongoClient } = require("mongodb");
const shortid = require("shortid");
const axios = require("axios");
const querystring = require('querystring');

const {
    database_url,
    users_collection_name,
    database_name,
    max_retry_count,
    bot_api_url,
    referrerQuestion,
    invalid_referrer_code_message,
    referrer_added_successfully_message,
    referrer_not_added_message } = require("./variables");

const client = new MongoClient(database_url);

async function generateReferral() {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);
            while (true) {
                let new_referral = shortid.generate();
                const result = await collection.findOne({ referral: new_referral });
                if (!result) {
                    return new_referral;
                }
            }
        }
        catch (error) {
            console.error(error);
            if (++retry_count < max_retry_count) {
                continue;
            } else {
                break;
            }
        }
        finally {
            await client.close();
        }
    }
}

async function addUser(user_id, referral) {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);

            const new_user = { _id: user_id, referral: referral };
            try {
                const result = await collection.insertOne(new_user);
                console.log(`#NEW | A user [ id: ${user_id} ] added`);
                return "true";
            } catch (error) {
                console.log(`#EXIST | The user [ id: ${user_id} ] already exist`);
                return false;
            }
        }
        catch (error) {
            console.error(error);
            if (++retry_count < max_retry_count) {
                continue;
            } else {
                break;
            }
        }
        finally {
            await client.close();
        }
    }
}

async function sendMessage(chat_id, text, other_params) {
    text = encodeURIComponent(text);
    other_params = (new URLSearchParams(other_params)).toString();
    const url = (`${bot_api_url}sendMessage?chat_id=${chat_id}&text=${text}&${other_params?other_params:""}`);
    
    let retry_count = 0;
    while (true) {
        try {
            const res = await axios(url);
            if (res.status != 200) throw new error(`Telegram bot api respond with status ${res.status} while sending a message.`);
            return true;
        } catch (error) {
            console.error(error)
            if (++retry_count < max_retry_count) {
                continue;
            } else {
                return false;
            }
        }
    }
}
async function askReferrer(username, chat_id) {
    const question = referrerQuestion(username);
    const referrer_request_sent = await sendMessage(chat_id, question, {parse_mode:"HTML"});
    if (referrer_request_sent) {
        console.log(`Referrer request sent to chat id ${chat_id}`);
    }
}
async function checkReferrer (referrer_code) {
    try {
        if (shortid.isValid(referrer_code)) {
            let retry_count = 0;
            while (true) {
                try {
                    await client.connect();
                    const collection = await client.db(database_name).collection(users_collection_name);

                    let result = await collection.findOne({ referral: referrer_code});
                    return !!result;
                }
                catch (error) {
                    console.error(error);
                    if (++retry_count < max_retry_count) {
                        continue;
                    } else {
                       return false;
                    }
                }
            }
        }
        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
}
async function addReferrer(referrer_code,referred_user_id){
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);
            let referrer = { referrer: referrer_code};
            const result = await collection.updateOne({_id:referred_user_id},{$set: referrer});
            return true;
        }
        catch (error) {
            console.error(error);
            if (++retry_count < max_retry_count) {
                continue;
            } else {
                return true;
            }
        }
        finally {
            await client.close();
        }
    }
}
exports.referrerAnswerHandler = async (replayed_message)=>{
    let replayed_text = replayed_message["text"];
    let chat_id = replayed_message["chat"]["id"];
    let message_id = replayed_message["message_id"];
    let other_params = {reply_to_message_id:message_id,allow_sending_without_reply:"true"};
    let is_valid_referrer_code = await checkReferrer (replayed_text);
    if(is_valid_referrer_code){
        let user_id = replayed_message["from"]["id"]
        let referrer_added = await addReferrer(replayed_text,user_id);
        if(referrer_added){
            sendMessage(chat_id,referrer_added_successfully_message,other_params);
        } else{
            sendMessage(chat_id,referrer_not_added_message,other_params);
        }
    }
    else{
        sendMessage(chat_id,invalid_referrer_code_message,other_params);
    }
}

exports.newUsersHandler = async (new_chat_members, chat_id) => {
    try {
        new_chat_members.forEach(
            async user => {
                const id = user["id"];
                const referral = await generateReferral();
                const userAdded = await addUser(id, referral);
                if (userAdded) {
                    const name = user["username"];
                    askReferrer(name, chat_id);
                }
            });
    } catch (error) {
        console.error(error);
    }
}
