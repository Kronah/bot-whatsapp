const express = require("express");
const cors = require("cors");
const qrcodeTerminal = require("qrcode-terminal");

// 🔥 LOG DE ERROS (IMPORTANTE)
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// =========================
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =========================
let makeWASocket, fetchLatestBaileysVersion, DisconnectReason;
let globalSocket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// =========================
// 🚀 BOT PRINCIPAL
// =========================
async function startBot() {
    if (isConnecting) return;
    isConnecting = true;

    try {
        const baileys = await import("@whiskeysockets/baileys");
        makeWASocket = baileys.default;
        fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
        DisconnectReason = baileys.DisconnectReason;

        const { useMongoDBAuthState } = require("./mongoAuth");
        const { state, saveCreds } = await useMongoDBAuthState();

        const { version } = await fetchLatestBaileysVersion();

        // 🔥 FECHA SOCKET ANTIGO
        if (globalSocket) {
            try { globalSocket.end(); } catch {}
        }

        const sock = makeWASocket({
            version,
            auth: state,

            // 🔥 SEM TERMUX
            browser: ["Ubuntu", "Chrome", "120.0.0"],

            markOnlineOnConnect: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        });

        globalSocket = sock;

        // salvar sessão
        sock.ev.on("creds.update", saveCreds);

        // =========================
        // 🔑 LOGIN POR NÚMERO
        // =========================
        if (!sock.authState.creds.registered) {
            const code = await sock.requestPairingCode("5592993278383");

            console.log("\n🔑 CÓDIGO DE PAREAMENTO:");
            console.log(code);
            console.log("\n👉 WhatsApp > Dispositivos conectados > Conectar\n");
        }

        // =========================
        // CONEXÃO
        // =========================
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                console.log("✅ BOT CONECTADO!");
                isConnecting = false;
                reconnectAttempts = 0;
            }

            if (connection === "close") {
                isConnecting = false;

                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log("❌ Desconectado:", statusCode);

                // 🔴 sessão inválida
                if (
                    statusCode === DisconnectReason.loggedOut ||
                    statusCode === 401 ||
                    statusCode === 428
                ) {
                    console.log("🧹 Limpando sessão no Mongo...");

                    const { MongoClient } = require("mongodb");
                    const client = new MongoClient(process.env.MONGO_URI);
                    await client.connect();
                    const db = client.db("whatsapp_bot");
                    await db.collection("auth").deleteMany({});
                    await client.close();

                    setTimeout(startBot, 3000);
                    return;
                }

                // 🔁 reconexão
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(`🔄 Reconectando (${reconnectAttempts})...`);
                    setTimeout(startBot, 3000);
                } else {
                    console.log("⛔ Limite de reconexões atingido");
                }
            }
        });

        // =========================
        // MENSAGENS
        // =========================
        sock.ev.on("messages.upsert", async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const texto = msg.message.conversation || "";

            console.log("📨", texto);

            if (!from.endsWith("@g.us")) return;

            if (texto === "ping") {
                await sock.sendMessage(from, { text: "pong 🟢" });
            }
        });

    } catch (err) {
        console.error("❌ Erro geral:", err.message);
        isConnecting = false;
        setTimeout(startBot, 10000);
    }
}

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
    res.send("🤖 Bot rodando!");
});

app.get("/health", (req, res) => {
    res.json({
        status: "online",
        uptime: process.uptime()
    });
});

// =========================
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// =========================
startBot();
