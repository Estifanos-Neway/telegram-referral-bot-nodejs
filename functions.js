
// importing necessary modules
const { MongoClient, Binary } = require("mongodb");
const shortid = require("shortid");
const axios = require("axios");
const fs = require("fs");

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
    newUserNotification,
    id_separator_character,
    referrer_request_identifier,
    attachment_file_types,
    newFileNotification } = require("./variables");

// initiating the mongodb client
const client = new MongoClient(database_url);

// the following are helper functions
// they will be used by the main function found at the bottom

// this function sends message to telegram client
async function sendMessage(chat_id, text, other_params) {
    text = encodeURIComponent(text);
    other_params = (new URLSearchParams(other_params)).toString();
    const url = (`${bot_api_url}sendMessage?chat_id=${chat_id}&text=${text}&${other_params ? other_params : ""}`);

    let retry_count = 0;
    while (true) {
        try {
            const res = await axios(url);
            return true;
        } catch (error) {
            console.error(`${++retry_count}| ${error} | in sendMessage`);
            if (retry_count < max_retry_count) {
                continue;
            } else {
                return false;
            }
        }
    }
}

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
async function addUser(user_id, chat_id, group_username, referral_code) {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);

            const new_user = { _id: `${user_id}:${chat_id}`, user_id: user_id, chat_id: chat_id, referral: referral_code };
            try {
                const result = await collection.insertOne(new_user);
                console.log(`#NEW | A user [ _id: ${result.insertedId}] added`);
                sendMessage(ADMINS_CHAT_ID, newUserNotification(user_id, group_username, referral_code), { parse_mode: "HTML" });
                return "true";
            } catch (error) {
                console.log(`#EXIST | The user [ _id: ${user_id}${id_separator_character}${chat_id} ] already exist`);
                return false;
            }
        }
        catch (error) {
            console.error(`${++retry_count}| ${error} | in addUser`);
            if (retry_count < max_retry_count) {
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

// this function sends a message to the group to ask new users for a referrer code
async function askReferrer(chat_id, first_name, referral_code) {
    try {
        const question = referrerQuestion(first_name, referral_code);
        const referrer_request_sent = await sendMessage(chat_id, question, { parse_mode: "HTML" });
        if (referrer_request_sent) {
            console.log(`Referrer request sent to chat id ${chat_id}`);
        } else {
            console.log(`Failed to send referrer request to chat id ${chat_id}`);
        }
    } catch (error) {
        console.error(`${error} | in askReferrer`)
    }
}

// this function checks is a referrer is valid code
async function checkReferrer(referrer_code) {
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
                console.error(`${++retry_count}| ${error} | in checkReferrer`);
                if (retry_count < max_retry_count) {
                    continue;
                } else {
                    return false;
                }
            }
        }
    }
    return false;
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
            console.error(`${++retry_count}| ${error} | in addReferrer`);
            if (retry_count < max_retry_count) {
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
            console.error(`${++retry_count}| ${error} | in getFilePath`);
            if (retry_count < max_retry_count) {
                continue;
            } else {
                return false;
            }
        }
    }
}

// this function checks if a file already exist in the database
// it is used while storing files
async function checkIfFileExist(file_unique_id) {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            let collection = await client.db(database_name).collection(files_collection_name);
            let exist = await collection.findOne({ _id: file_unique_id });
            if (exist) {
                await client.close();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error(`${++retry_count}| ${error} | in checkIfFileExist`);
            if (retry_count < max_retry_count) {
                continue;
            } else {
                await client.close();
                return;
            }
        }
    }
}

// this function download and return files in binary form
async function getFileData(full_file_path) {
    let retry_count = 0;
    while (true) {
        try {
            let buffered_data_array = [];
            let file_data = await axios(full_file_path, { responseType: 'stream' });
            file_data.data.on("data", chunk => buffered_data_array.push(chunk));
            return new Promise(resolve => {
                file_data.data.on("end", () => {
                    resolve(Binary(Buffer.concat(buffered_data_array)))
                })
            });
        } catch (error) {
            console.error(`${++retry_count}| ${error} | in getFileData`);
            if (retry_count < max_retry_count) {
                continue;
            } else {
                return false;
            }
        }
    }
}

// this function store files into database
async function insertFile(file_doc) {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            let collection = await client.db(database_name).collection(files_collection_name);
            let result = await collection.insertOne(file_doc);
            await client.close();
            return true;
        }
        catch (error) {
            console.error(`${++retry_count}| ${error} | in insertFile`);
            if (retry_count < max_retry_count) {
                continue;
            } else {
                await client.close();
                return false;
            }
        }
    }
}

// this function extract files from database so they can be downloaded
async function getFile(file_unique_id) {
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            let collection = await client.db(database_name).collection(files_collection_name);
            let exist = await collection.findOne({ _id: file_unique_id });
            return exist;
        } catch (error) {
            console.error(`${++retry_count}| ${error} | in getFile`);
            if (retry_count < max_retry_count) {
                continue;
            } else {
                return false;
            }
        }
    }
}

// the following are the main functions,
// they will handel main events

// this function deals with the handling of new users,
// adding them to database and ask for referrer
async function newUsersHandler(new_chat_members, chat_id, group_username) {
    try {
        let new_chat_members_count = new_chat_members.length;
        for (let index = 0; index < new_chat_members_count; index++) {
            let new_member = new_chat_members[index];
            let user_id = new_member["id"];
            let referral_code = generateReferral();
            let userAdded = await addUser(user_id, chat_id, group_username, referral_code);
            if (userAdded) {
                const first_name = new_member["first_name"];
                await askReferrer(chat_id, first_name, referral_code);
            }
        }
    } catch (error) {
        console.error(`${error} | in newUsersHandler`);
    }
}


// this function deals with the handling users answer for referrer request and
// store their answer in the database
async function referrerAnswerHandler(replayed_message, reply_to_message_id) {
    try {
        let replayed_text = replayed_message["text"];
        let chat_id = replayed_message["chat"]["id"];
        let message_id = replayed_message["message_id"];

        let other_params = { reply_to_message_id: message_id, allow_sending_without_reply: "true" };
        let is_valid_referrer_code = await checkReferrer(replayed_text);

        if (is_valid_referrer_code) {
            let referred_user_id = `${replayed_message["from"]["id"]}${id_separator_character}${chat_id}`;
            let referrer_added = await addReferrer(replayed_text, referred_user_id);
            if (referrer_added) {
                await sendMessage(chat_id, referrer_added_successfully_message, other_params);
                // await deleteMessage(chat_id,reply_to_message_id);
            } else {
                await sendMessage(chat_id, referrer_not_added_message, other_params);
            }
        }
        else {
            await sendMessage(chat_id, invalid_referrer_code_message, other_params);
        }
    } catch (error) {
        console.error(`${error} | in referrerAnswerHandler`)
    }
}

// this function deals with the handling of attached files
async function attachmentHandler(message, file_type) {
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

        let fileExist = await checkIfFileExist(file_unique_id);
        if (fileExist === undefined) {
            console.log(`File not stored [reason: could not connect with the server], [_id: ${file_unique_id}]`);
            return;
        } else if (fileExist) {
            console.log(`File already exist, [_id: ${file_unique_id}]`);
            return;
        }

        if (file_size > max_file_size) {
            console.log(`A file is not stored, [reason: big size], [file_id: ${file_id}]`);
            return;
        }

        let file_path = await getFilePath(file_id);
        if (!file_path) {
            console.log(`A file is not stored, [reason: file path could not be resolved], [file_id: ${file_id}]`);
            return;
        }

        let file_name = file_path.substring(file_path.lastIndexOf("/") + 1);
        let full_file_path = `${bot_file_api_url}${file_path}`;
        let binary_data = await getFileData(full_file_path);

        if (!binary_data) {
            console.log(`A file is not stored, [reason: file could not be downloaded], [file_id: ${file_id}]`);
            return;
        }

        let file_doc = { _id: file_unique_id, file_name: file_name, file_data: binary_data };
        let data_inserted = await insertFile(file_doc);
        if (!data_inserted) {
            console.log(`A file is not stored, [reason: file could not be inserted to database], [file_id: ${file_id}]`);
            return;
        }

        let file_extension = file_path.substring(file_path.lastIndexOf(".") + 1);
        let file_unique_name = `${file_unique_id}.${file_extension}`;
        console.log(`A file is stored, [_id: ${file_unique_id}]`);
        sendMessage(ADMINS_CHAT_ID, newFileNotification(file_unique_name), { parse_mode: "HTML" });
    } catch (error) {
        console.error(`${error} | in attachmentHandler`);
    }
}

// this function will be used to handle incoming post requests
exports.postHandler = async (req, res) => {
    try {
        let message = req.body?.["message"];
        if (!message) return;
        let user_id = message["from"]["id"];

        // here we check for new chat members
        if (message["new_chat_members"]) {
            let new_chat_members = message["new_chat_members"];
            let chat_id = message["chat"]["id"];
            let group_username = message["chat"]["username"];

            console.log(`Handling new_chat_member [id: ${user_id}]...`);
            await newUsersHandler(new_chat_members, chat_id, group_username);
            console.log(`New_chat_member [id: ${user_id}] handled`);
        }

        // here we check for messages replies
        // if there this is a replay message then
        // we will check if it is answer for referrer code request
        else if (message["reply_to_message"]?.["text"]) {
            let reply_to_text = message["reply_to_message"]?.["text"];
            if (reply_to_text) {
                if (reply_to_text.endsWith(referrer_request_identifier)) {
                    console.log(`Handling referrer_request_answer from [id: ${user_id}]...`);
                    await referrerAnswerHandler(message, message["reply_to_message"]["message_id"]);
                    console.log(`Referrer_request_answer from [id: ${user_id}] handled.`);
                }
            }
        }
        else {
            attachment_file_types.forEach(async file_type => {
                if (message[file_type]) {
                    console.log(`Handling attached file by [id: ${user_id}]...`);
                    await attachmentHandler(message, file_type);
                    console.log(`File attached by [id: ${user_id}] handled.`);

                }
            })
        }
    } catch (error) {
        console.error(`${error} | in postHandler`);
    }
    finally {
        res.end();
    }
}

// this function will be called when a user ask to download a file
exports.fileDownloadHandler = async (req, res) => {
    try {
        let file_unique_name = req.params.file_unique_id;
        let file_unique_id = file_unique_name.substring(0, file_unique_name.lastIndexOf("."));
        let file = await getFile(file_unique_id);
        if (file) {
            res.set({
                "Content-Disposition": "attachment",
                "filename": "filename.jpg"
            });
            res.end(file.file_data.buffer);
        } else {
            res.status(400);
            res.end("File not found.");
        }
    } catch (error) {
        console.error(`${error} | in fileDownloadHandler`);
        res.status(400);
        res.end("File not found.");
    }
}