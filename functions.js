
const { MongoClient } = require("mongodb");

const {
    database_url,
    users_collection_name,
    database_name,
    max_retry_count } = require("./variables");

const client = new MongoClient(database_url);

async function generateReferral(){
    // unimplemented
    try {

    } catch (error) {

    }
    return 67;
}

async function checkExistence(user_id){
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);
            const result = await collection.findOne({ _id: user_id });
            return !!result;

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

async function addUser(user_id, referral){
    let retry_count = 0;
    while (true) {
        try {
            await client.connect();
            const collection = await client.db(database_name).collection(users_collection_name);

            const new_user = { _id: user_id, referral: referral };
            const result = await collection.insertOne(new_user);

            console.log(`#NEW | A user [ id: ${result.insertedId} ] added`);
            break;
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

exports.newUsersHandler = (new_chat_members) => {
    try {
        new_chat_members.forEach(
            async user => {
                const id = user["id"];
                const user_exist = await checkExistence(id);
                if (!user_exist) {
                    const referral = await generateReferral();
                    await addUser(id, referral);
                }
            });
    } catch (error) {
        console.error(error);
    }
}
