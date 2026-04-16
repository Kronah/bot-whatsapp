const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode-terminal");

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let sock = null;
let isStarted = false;

async function startBot() {
    if (isStarted) return;
    isStarted = true;

    try {
        const baileys = await import("@whiskeysockets/baileys");

        const makeWASocket = baileys.default;
        const {
            fetchLatestBaileysVersion,
            useMultiFileAuthState,
            DisconnectReason
        } = baileys;

        const { state, saveCreds } = await useMultiFileAuthState("./auth");

        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            browser: ["Ubuntu", "Chrome", "120.0.0"]
        });

        sock.ev.on("creds.update", saveCreds);

        // =========================
        // QR CODE
        // =========================
        sock.ev.on("connection.update", (update) => {
            const { connection, qr, lastDisconnect } = update;

            if (qr) {
                console.log("\n📱 ESCANEIE O QR CODE:\n");
                qrcode.generate(qr, { small: true });
            }

            if (connection === "open") {
                console.log("✅ BOT CONECTADO!");
            }

            if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log("❌ Desconectado:", statusCode);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("⚠️ Sessão perdida. Escaneie novamente.");
                }

                setTimeout(() => {
                    isStarted = false;
                    startBot();
                }, 5000);
            }
        });

        // =========================
        // MENSAGENS
        // =========================
        sock.ev.on("messages.upsert", async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || "";

            console.log("📩", text);

            if (text.toLowerCase() === "ping") {
                await sock.sendMessage(from, { text: "pong 🟢" });
            }
        });

    } catch (err) {
        console.error("❌ Erro:", err.message);

        setTimeout(() => {
            isStarted = false;
            startBot();
        }, 10000);
    }
}

// =========================
// SERVIDOR (ANTI-SLEEP)
// =========================
app.get("/", (req, res) => {
    res.send("🤖 Bot online!");
});

app.get("/health", (req, res) => {
    res.json({
        status: "online",
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Rodando na porta ${PORT}`);
});

startBot();
