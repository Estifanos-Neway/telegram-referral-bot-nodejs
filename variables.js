
/**
 * this file will export all project variables needed in the program
 */

 require("dotenv").config();

 const MONGODB_CREDENTIALS = process.env.MONGODB_CREDENTIALS;
 const BOT_TOKEN = process.env.BOT_TOKEN;
 exports.ADMINS_CHAT_ID = process.env.ADMINS_CHAT_ID;

// the following must be edited before deployment
const remote_database_url = `mongodb+srv://${MONGODB_CREDENTIALS}@cluster0.p4mnf.mongodb.net/?retryWrites=true&w=majority`;
const local_database_url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";
const home_url = "https://telegram-referral-bot-nodejs.herokuapp.com/";

// change this variable to switch between local and remote databases
exports.database_url = remote_database_url;
 
// edit the following as of your preference and setting
 exports.default_port = 5000;
 exports.max_retry_count = 5; // this tells how many retries should happen while deferent errors accrue

 exports.referrer_request_identifier = "#ReferrerRequest";
 exports.referrerQuestion = (name,referral_code) => `Hi <b>${name}</b>, Welcome to our group. Your referral code is [<b>${referral_code}</b>]. Have you been referred by someone? please <b><i>replay</i></b> their code to this message. Thankyou. | ${exports.referrer_request_identifier}`;
 exports.newUserNotification = (user_id, group_username, referral_code) => `#NEW_MEMBER\n-- -- --\nId | <a href="tg://user?id=${user_id}">${user_id}</a>\nGroup | @${group_username}\nReferral | ${referral_code}`;
 exports.newFileNotification = (file_unique_name) => `#NEW_FILE\n-- -- --\n | <a href="${home_url}file/${file_unique_name}">${file_unique_name}</a>`;
 exports.invalid_referrer_code_message = "Referrer with this code doesn't exist.";
 exports.referrer_added_successfully_message = "Referrer is added successfully.";
 exports.referrer_not_added_message = "Sorry, we couldn't add the referrer. Please try again.";
 exports.big_file_size_message = `This file is bigger than the maximum limit (${exports.max_file_size/1000000} Mb), it is not stored in the database.`

// the following should be edited before deployment (first usage) only
 exports.database_name = "telegram_referral_bot_db";
 exports.users_collection_name = "users";
 exports.files_collection_name = "files";
 
 // the following should not be edited
 exports.bot_api_url = `https://api.telegram.org/bot${BOT_TOKEN}/`;
 exports.bot_file_api_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/`;
 exports.max_file_size = 16000000;
 exports.id_separator_character = ":"; // this character is used as a separator while creating
//  users database _id by combining their user_id and the groups chat_is

 // edit this if you like to exclude some file types from being stored
 exports.attachment_file_types = ["photo", "document", "video", "audio"];