
/**
 * this file will export all project variables needed in the program
 */

 require("dotenv").config();

 const MONGODB_CREDENTIALS = process.env.MONGODB_CREDENTIALS;
 const BOT_TOKEN = process.env.BOT_TOKEN;
 exports.ADMINS_CHAT_ID = process.env.ADMINS_CHAT_ID;
 
 const remote_database_url = `mongodb+srv://${MONGODB_CREDENTIALS}@cluster0.p4mnf.mongodb.net/?retryWrites=true&w=majority`;
 const local_database_url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";
 
 exports.default_port = 5000;
 exports.database_url = local_database_url;
 exports.users_collection_name = "users";
 exports.files_collection_name = "files";
 exports.database_name = "telegram_referral_bot_db";
 
 exports.bot_api_url = `https://api.telegram.org/bot${BOT_TOKEN}/`;
 exports.bot_file_api_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/`;
 
 exports.max_retry_count = 10;
 exports.max_file_size = 16000000;
 
 exports.referrer_request_identifier = "#ReferrerRequest";
 exports.referrerQuestion = (name,referral_code) => `Hi <b>${name}</b>, Welcome to our group. Your referral code is [<b>${referral_code}</b>]. Have you been referred by someone? please <b><i>replay</i></b> their code to this message. Thankyou. | ${exports.referrer_request_identifier}`;
 exports.newUserNotification = (user_id,referral_code) => `#NEW_MEMBER\n-- -- --\n<a href="tg://user?id=${user_id}">${user_id}</a> | ${referral_code}`;
 exports.invalid_referrer_code_message = "Referrer with this code doesn't exist.";
 exports.referrer_added_successfully_message = "Referrer is added successfully.";
 exports.referrer_not_added_message = "Sorry, we couldn't add the referrer. Please try again.";
 exports.big_file_size_message = `This file is bigger than the maximum limit (${exports.max_file_size/1000000} Mb), it is not stored in the database.`
 
 exports.attachment_file_types = ["photo", "document", "video", "audio"];