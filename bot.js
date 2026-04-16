const express = require("express");
const cors = require("cors");

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// controle global
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

        // ⚠️ usa memória local temporária (Render free)
        const { state, saveCreds } = await useMultiFileAuthState("./auth");

        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            browser: ["Ubuntu", "Chrome", "120.0.0"]
        });

        sock.ev.on("creds.update", saveCreds);

        // 🔐 GERA CÓDIGO APENAS UMA VEZ
        if (!sock.authState.creds.registered) {
            const code = await sock.requestPairingCode("5592993278383");

            console.log("\n🔑 CÓDIGO:");
            console.log(code);
            console.log("\n👉 Use rápido no WhatsApp!\n");
        }

        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                console.log("✅ CONECTADO COM SUCESSO!");
            }

            if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log("❌ Desconectado:", statusCode);

                // 🔴 NÃO ficar gerando código infinito
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("⚠️ Sessão inválida. Reinicie manualmente.");
                    process.exit(0);
                }

                // reconectar simples
                setTimeout(() => {
                    isStarted = false;
                    startBot();
                }, 5000);
            }
        });

        sock.ev.on("messages.upsert", async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || "";

            console.log("📩", text);

            if (text === "ping") {
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
// SERVER (anti sleep Render)
// =========================
app.get("/", (req, res) => {
    res.send("🤖 Bot online");
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`🚀 Rodando na porta ${PORT}`);
});

startBot();
