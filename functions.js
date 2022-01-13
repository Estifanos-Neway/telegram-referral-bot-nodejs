
const { MongoClient } = require("mongodb");
const shortid = require("shortid");

const {
    database_url,
    users_collection_name,
    database_name,
    max_retry_count } = require("./variables");

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
function askReferrer(user_id) {
    //unimplemented
}
exports.newUsersHandler = async new_chat_members => {
    try {
        new_chat_members.forEach(
            async user => {
                const id = user["id"];
                const referral = await generateReferral();
                const userAdded = await addUser(id, referral);
                console.log(`c:${userAdded}`);
                if (userAdded) {
                    askReferrer(id);
                }
            });
    } catch (error) {
        console.error(error);
    }
}
