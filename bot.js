const express = require("express");
const cors = require("cors");

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =========================
// CONTROLE GLOBAL
// =========================
let sock = null;
let isStarted = false;
let pairingCodeGenerated = false;

// =========================
// BOT PRINCIPAL
// =========================
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

        // 🔐 AUTH LOCAL (Render free - temporário)
        const { state, saveCreds } = await useMultiFileAuthState("./auth");

        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            browser: ["Ubuntu", "Chrome", "120.0.0"],
            markOnlineOnConnect: false
        });

        sock.ev.on("creds.update", saveCreds);

        // =========================
        // 🔑 PAREAMENTO (UMA VEZ)
        // =========================
        if (!sock.authState.creds.registered && !pairingCodeGenerated) {
            pairingCodeGenerated = true;

            const code = await sock.requestPairingCode("5592993278383");

            console.log("\n🔑 CÓDIGO DE PAREAMENTO:");
            console.log(code);
            console.log("\n👉 WhatsApp > Dispositivos conectados > Conectar\n");

            // ⏳ SEGURA PRA NÃO INVALIDAR
            await new Promise(resolve => setTimeout(resolve, 60000));
        }

        // =========================
        // CONEXÃO
        // =========================
        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                console.log("✅ BOT CONECTADO COM SUCESSO!");
            }

            if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log("❌ Desconectado:", statusCode);

                // 🔴 sessão inválida → não loopar código
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("⚠️ Sessão inválida. Reinicie manualmente.");
                    process.exit(0);
                }

                // 🔁 reconexão controlada
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
        console.error("❌ Erro geral:", err.message);

        setTimeout(() => {
            isStarted = false;
            startBot();
        }, 10000);
    }
}

// =========================
// SERVER (ANTI-SLEEP RENDER)
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
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// =========================
startBot();
