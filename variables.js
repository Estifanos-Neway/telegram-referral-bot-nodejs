
/**
 * this file will export all project variables needed in the program
 */

require("dotenv").config();

const MONGODB_CREDENTIALS = process.env.MONGODB_CREDENTIALS;
const BOT_TOKEN = process.env.BOT_TOKEN;

const remote_database_url = `mongodb+srv://${MONGODB_CREDENTIALS}@cluster0.p4mnf.mongodb.net/?retryWrites=true&w=majority`;
const local_database_url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";
const referrer_request_identifier = "#ReferrerRequest";
exports.default_port = 5000;
exports.users_collection_name = "users";
exports.database_url = local_database_url;
exports.database_name = "telegram_referral_bot_db";
exports.max_retry_count = 10;
exports.referrerQuestion = (name) => `Hi <b>${name}</b>, Welcome to our group. Have you been referred? please <b><i>replay</i></b> your referrers code for this message. Thankyou. | ${referrer_request_identifier}`;
exports.referrer_request_identifier = referrer_request_identifier;
exports.bot_api_url = `https://api.telegram.org/bot${BOT_TOKEN}/`;
exports.invalid_referrer_code_message = "Referrer with this code doesn't exist.";
exports.referrer_added_successfully_message = "Referrer is added successfully.";
exports.referrer_not_added_message = "Sorry, we couldn't add the referrer. Please try again.";