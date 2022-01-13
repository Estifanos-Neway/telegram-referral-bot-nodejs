
/**
 * this file will export all project variables needed in the program
 */
 
 require("dotenv").config();

const MONGODB_CREDENTIALS = "gideon:BHlii76gGVvGff54rtf";
const remote_database_url = `mongodb+srv://${MONGODB_CREDENTIALS}@cluster0.p4mnf.mongodb.net/?retryWrites=true&w=majority`;
const local_database_url = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000"; 

exports.default_port = 5000;
exports.users_collection_name = "users";
exports.database_url = remote_database_url;
exports.database_name = "telegram_referral_bot_db";
exports.max_retry_count = 10;