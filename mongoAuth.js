const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;

let client;
let collection;

async function connectMongo() {
    if (!client) {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db("whatsapp_bot");
        collection = db.collection("auth");
        console.log("🍃 MongoDB conectado");
    }
}

async function useMongoDBAuthState() {
    await connectMongo();

    const data = await collection.findOne({ _id: "auth_info" }) || {};

    const saveCreds = async (creds) => {
        await collection.updateOne(
            { _id: "auth_info" },
            { $set: creds },
            { upsert: true }
        );
    };

    return {
        state: data,
        saveCreds
    };
}

module.exports = { useMongoDBAuthState };
