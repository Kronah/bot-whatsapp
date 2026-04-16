const { MongoClient } = require("mongodb");
const { BufferJSON } = require("@whiskeysockets/baileys");

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

    const writeData = async (data) => {
        await collection.updateOne(
            { _id: "auth" },
            { $set: JSON.parse(JSON.stringify(data, BufferJSON.replacer)) },
            { upsert: true }
        );
    };

    const readData = async () => {
        const data = await collection.findOne({ _id: "auth" });
        return data
            ? JSON.parse(JSON.stringify(data, BufferJSON.reviver))
            : {};
    };

    const state = await readData();

    return {
        state,
        saveCreds: writeData
    };
}

module.exports = { useMongoDBAuthState };
