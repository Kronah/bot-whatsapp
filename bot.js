const express = require("express");
const cors = require("cors");

// 🔥 LOG DE ERROS
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// =========================
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =========================
let isConnecting = false;

// =========================
// 🚀 BOT PRINCIPAL
// =========================
async function startBot() {
    if (isConnecting) return;
    isConnecting = true;

    try {
        const baileys = await import("@whiskeysockets/baileys");

        const makeWASocket = baileys.default;
        const {
            fetchLatestBaileysVersion,
            useMemoryAuthState // 🔥 ESSENCIAL
        } = baileys;

        const { version } = await fetchLatestBaileysVersion();

        // 🔥 AUTH EM MEMÓRIA (RESOLVE SEU ERRO)
        const { state, saveCreds } = useMemoryAuthState();

        const sock = makeWASocket({
            version,
            auth: state, // 🔥 AGORA TEM AUTH

            browser: ["Ubuntu", "Chrome", "120.0.0"],

            markOnlineOnConnect: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        });

        // salvar em memória (necessário pro fluxo interno)
        sock.ev.on("creds.update", saveCreds);

        // =========================
        // 🔑 LOGIN POR NÚMERO
        // =========================
        if (!state.creds.registered) {
            try {
                const code = await sock.requestPairingCode("5592993278383");

                console.log("\n🔑 CÓDIGO DE PAREAMENTO:");
                console.log(code);
                console.log("\n👉 WhatsApp > Dispositivos conectados > Conectar\n");
            } catch (err) {
                console.log("⚠️ Erro ao gerar código:", err.message);
            }
        }

        // =========================
        // CONEXÃO
        // =========================
        sock.ev.on("connection.update", (update) => {
            const { connection } = update;

            if (connection === "open") {
                console.log("✅ BOT CONECTADO!");
                isConnecting = false;
            }

            if (connection === "close") {
                console.log("❌ Conexão perdida...");
                isConnecting = false;

                console.log("🔄 Reconectando em 5 segundos...");
                setTimeout(startBot, 5000);
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

            if (!from) return;

            if (texto.toLowerCase() === "ping") {
                await sock.sendMessage(from, { text: "pong 🟢" });
            }
        });

    } catch (err) {
        console.error("❌ Erro geral:", err.message);
        isConnecting = false;

        console.log("🔄 Tentando reiniciar em 10s...");
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
