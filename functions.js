
// importing necessary modules
const { MongoClient, Binary } = require("mongodb");
const shortid = require("shortid");
const axios = require("axios");

// importing project variables which are stored in a separate file (variables.js)
const {
    database_url,
    users_collection_name,
    files_collection_name,
    database_name,
    max_retry_count,
    bot_api_url,
    bot_file_api_url,
    referrerQuestion,
    invalid_referrer_code_message,
    referrer_added_successfully_message,
    referrer_not_added_message,
    max_file_size,
    ADMINS_CHAT_ID,
    newUserNotification } = require("./variables");
// initiating the mongodb client
const client = new MongoClient(database_url);

// this function generate unique referral code
// it use the module 'shortid' to generate the code
// and it makes sure the code is unique by adding it
// to a random character
function generateReferral() {
    let short_code = shortid.generate();
    let salt = String.fromCharCode(65 + Math.round((Math.random() * 100) / 4));
    let referral_code = salt + short_code
    return referral_code;
}

// this function will add user and their referral code to database
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
                sendMessage(ADMINS_CHAT_ID,newUserNotification(user_id, referral),{ parse_mode: "HTML" });
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

// this function sends message to telegram client
async function sendMessage(chat_id, text, other_params) {
    text = encodeURIComponent(text);
    other_params = (new URLSearchParams(other_params)).toString();
    const url = (`${bot_api_url}sendMessage?chat_id=${chat_id}&text=${text}&${other_params ? other_params : ""}`);

    let retry_count = 0;
    while (true) {
        try {
            const res = await axios(url);
            if (res.status != 200) {
                throw new Error(`Telegram bot api respond with status ${res.status} while sending a message.`);
            };
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

// this function is used to delete referral request
// messages after receiving the right referrer
async function deleteMessage(chat_id, message_id) {
    const url = (`${bot_api_url}deleteMessage?chat_id=${chat_id}&message_id=${message_id}`);

    let retry_count = 0;
    while (true) {
        try {
            const res = await axios(url);
            if (res.status != 200) {
                throw new Error(`Telegram bot api respond with status ${res.status} while deleting a message.`);
            };
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

// this function sends a message to the group to ask new users for a referrer code
async function askReferrer(username, referral_code, chat_id) {
    try {
        const question = referrerQuestion(username,referral_code);
        const referrer_request_sent = await sendMessage(chat_id, question, { parse_mode: "HTML" });
        if (referrer_request_sent) {
            console.log(`Referrer request sent to chat id ${chat_id}`);
        } else{
            console.log(`Failed to send referrer request to chat id ${chat_id}`);
        }
    } catch (error) {
        console.error(error)
    }
}

// this function checks is a referrer is valid code
async function checkReferrer(referrer_code) {
    try {
        if (shortid.isValid(referrer_code)) {
            let retry_count = 0;
            while (true) {
                try {
                    await client.connect();
                    const collection = await client.db(database_name).collection(users_collection_name);

                    let result = await collection.findOne({ referral: referrer_code });
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

// this function added referrer code for a new user
async function addReferrer(referrer_code, referred_user_id) {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);
            let referrer = { referrer: referrer_code };
            const result = await collection.updateOne({ _id: referred_user_id }, { $set: referrer });
            await client.close();
            return true;
        }
        catch (error) {
            console.error(error);
            if (++retry_count < max_retry_count) {
                continue;
            } else {
                await client.close();
                return false;
            }
        }
    }
}

// this function gets file path of a file that can be used to download the file
async function getFilePath(file_id) {
    let retry_count = 0;
    while (true) {
        try {
            const url = (`${bot_api_url}getFile?file_id=${file_id}`);
            let res = await axios(url);
            if (res.status == 200) {
                let file_path = res.data["result"]["file_path"];
                return file_path;
            } else {
                throw Error(res);
            }
        } catch (error) {
            console.error(error);
            if (++retry_count < max_retry_count) {
                continue;
            } else {
                return false;
            }
        }
    }
}

// this function deals with the handling of new users,
// adding them to database and ask for referrer
exports.newUsersHandler = async (new_chat_members, chat_id) => {
    try {
        new_chat_members.forEach(
            async user => {
                const id = user["id"];
                const referral_code = generateReferral();
                const userAdded = await addUser(id, referral_code);
                if (userAdded) {
                    const first_name = user["first_name"];
                    await askReferrer(first_name, referral_code, chat_id);
                }
            });
    } catch (error) {
        console.error(error);
    }
}


// this function deals with the handling users answer for referrer request and
// store their answer in the database
exports.referrerAnswerHandler = async (replayed_message,reply_to_message_id) => {
    try {
        let replayed_text = replayed_message["text"];
        let chat_id = replayed_message["chat"]["id"];
        let message_id = replayed_message["message_id"];

        let other_params = { reply_to_message_id: message_id, allow_sending_without_reply: "true" };
        let is_valid_referrer_code = await checkReferrer(replayed_text);

        if (is_valid_referrer_code) {
            let user_id = replayed_message["from"]["id"]
            let referrer_added = await addReferrer(replayed_text, user_id);
            if (referrer_added) {
                await sendMessage(chat_id, referrer_added_successfully_message, other_params);
                await deleteMessage(chat_id,reply_to_message_id);
            } else {
                await sendMessage(chat_id, referrer_not_added_message, other_params);
            }
        }
        else {
            await sendMessage(chat_id, invalid_referrer_code_message, other_params);
        }
    } catch (error) {
        console.error(error)
    }
}

// this function deals with the handling of attached files
exports.attachmentHandler = async (message, file_type) => {
    try {
        let file;
        if (file_type == "photo") {
            let length = message[file_type].length;
            file = message[file_type][length - 1];
        } else {
            file = message[file_type];
        }
        let file_id = file["file_id"];
        let file_unique_id = file["file_unique_id"];
        let file_size = file["file_size"];

        let retry_count = 0;
        while (true) {
            try {
                await client.connect();
                let collection = await client.db(database_name).collection(files_collection_name);
                let exist = await collection.findOne({ _id: file_unique_id });
                if (exist) {
                    console.log(`File already exist, [_id: ${file_unique_id}]`);
                    await client.close();
                    return true;
                }
                break;
            } catch (error) {
                console.error(error);
                if (++retry_count < max_retry_count) {
                    continue;
                } else {
                    await client.close();
                    break;
                }
            }
        }
        if (file_size > max_file_size) {
            console.log(`A file is not stored, [reason: big size], [file_id: ${file_id}]`);
        } else {
            let file_path = await getFilePath(file_id);
            let file_name = file_path.substring(file_path.lastIndexOf("/")+1);
            if (file_path) {
                let full_file_path = `${bot_file_api_url}${file_path}`;
                let file_data = await axios(full_file_path);
                if (file_data.status == 200) {
                    let file_binary_data = Binary(file_data.data);
                    let file_doc = { _id: file_unique_id, file_name:file_name, file_data: file_binary_data };
                    let retry_count = 0;
                    while (true) {
                        try {
                            await client.connect();
                            let collection = await client.db(database_name).collection(files_collection_name);
                            let result = await collection.insertOne(file_doc);
                            console.log(`A file is stored, [_id: ${result.insertedId}]`);
                            break;
                        }
                        catch (error) {
                            console.error(error);
                            if (++retry_count < max_retry_count) {
                                continue;
                            } else {
                                console.log(`A file is not stored, [reason: file could not be inserted to database], [file_id: ${file_id}]`);
                                break;
                            }
                        }
                        finally {
                            await client.close();
                        }
                    }
                } else {
                    console.log(`A file is not stored, [reason: file could not be downloaded], [file_id: ${file_id}]`);
                }
            } else {
                console.log(`A file is not stored, [reason: file path could not be resolved], [file_id: ${file_id}]`);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
