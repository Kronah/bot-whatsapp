const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Importar Baileys dinamicamente (é ESM)
let makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion;

const GRUPO_BOSS = "120363426540795167@g.us";
const GRUPO_OLY  = "120363426376971165@g.us";
const PORT = process.env.PORT || 3000;

let mobs = [];
let bossesOnline = [];
let statusBossAnterior = {};
let qrCodeData = null;
let isConnecting = false;
let lastQRTime = 0;

// =======================
// NORMALIZAR TEXTO 🔥
function normalizar(texto) {
    return texto
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");
}

// =======================
async function carregarMobs() {
    const res = await axios.get("https://raw.githubusercontent.com/Kronah/mob-data/main/dados.json");
    mobs = res.data;
}

// =======================
// BUSCA INTELIGENTE REAL 🔥
// =======================
function buscarMob(busca) {
    const termo = normalizar(busca);

    // 1️⃣ busca direta (contém)
    let encontrados = mobs.filter(m =>
        normalizar(m["Nome do Mob"]).includes(termo)
    );

    if (encontrados.length > 0) return encontrados;

    // 2️⃣ busca por início
    encontrados = mobs.filter(m =>
        normalizar(m["Nome do Mob"]).startsWith(termo)
    );

    if (encontrados.length > 0) return encontrados;

    // 3️⃣ busca por similaridade simples
    let sugestoes = mobs.map(m => {
        const nome = normalizar(m["Nome do Mob"]);

        let score = 0;

        for (let i = 0; i < termo.length; i++) {
            if (nome.includes(termo[i])) score++;
        }

        return { mob: m, score };
    });

    sugestoes.sort((a, b) => b.score - a.score);

    return sugestoes.slice(0, 3).map(s => s.mob);
}

// =======================
function formatarMob(m) {
    return `🐉 MOB

📌 Número: ${m["Número"] || "-"}
📌 Nome: ${m["Nome do Mob"] || "-"}
📂 PT: ${m["Arquivo"] || "-"}
⭐ Pontos: ${m["Pontos"] || "-"}

`;
}

// =======================
async function atualizarBosses() {
    const { data } = await axios.get("https://divolion.net/?page=boss");
    const $ = cheerio.load(data);

    bossesOnline = [];

    $("table tr").each((i, el) => {
        const colunas = $(el).find("td");

        const nome = $(colunas[0]).text().trim();
        const status = $(colunas[2]).text().trim();
        const tempo = $(colunas[3]).text().trim();

        if (nome && status) {
            bossesOnline.push({ nome, status, tempo });
        }
    });
}

// =======================
async function monitorarBoss(sock) {
    const { data } = await axios.get("https://divolion.net/?page=boss");
    const $ = cheerio.load(data);

    $("table tr").each(async (i, el) => {
        const colunas = $(el).find("td");

        const nome = $(colunas[0]).text().trim();
        const status = $(colunas[2]).text().trim();

        if (!nome || !status) return;

        const antigo = statusBossAnterior[nome];

        if (antigo && antigo !== "Alive" && status === "Alive") {
            await sock.sendMessage(GRUPO_BOSS, {
                text: `🚨 BOSS NASCEU!\n\n🐉 ${nome}`
            });
        }

        statusBossAnterior[nome] = status;
    });
}

// =======================
async function pegarOly() {
    const { data } = await axios.get("https://divolion.net/?page=oly_rank");
    const $ = cheerio.load(data);

    let resposta = "🏆 OLY TOP\n\n";

    $("table tr").each((i, el) => {
        const colunas = $(el).find("td");

        const pos = $(colunas[0]).text().trim();
        const nome = $(colunas[1]).text().trim();
        const clan = $(colunas[2]).text().trim();
        const pontos = $(colunas[3]).text().trim();

        if (pos && nome) {
            resposta += `#${pos} ${nome}\n🏰 ${clan}\n⭐ ${pontos}\n\n`;
        }
    });

    return resposta;
}

// =======================
async function pegarOlyPorClasse(classeBusca) {
    const { data } = await axios.get("https://divolion.net/?page=oly_rank");
    const $ = cheerio.load(data);

    let resposta = `🏆 OLY - ${classeBusca.toUpperCase()}\n\n`;

    $("table tr").each((i, el) => {
        const linha = $(el).text().toLowerCase();

        if (linha.includes(classeBusca.toLowerCase())) {
            const colunas = $(el).find("td");

            const pos = $(colunas[0]).text().trim();
            const nome = $(colunas[1]).text().trim();
            const clan = $(colunas[2]).text().trim();
            const pontos = $(colunas[3]).text().trim();

            if (pos && nome) {
                resposta += `#${pos} ${nome}\n🏰 ${clan}\n⭐ ${pontos}\n\n`;
            }
        }
    });

    return resposta;
}

// =======================
app.get("/bosses", (req, res) => {
    res.json(bossesOnline);
});

// =======================
app.get("/qrcode", (req, res) => {
    res.json({ qrcode: qrCodeData });
});

// =======================
app.get("/status", (req, res) => {
    res.json({ 
        status: "online", 
        timestamp: new Date(),
        qrCode: qrCodeData ? "pending" : "not_needed" 
    });
});

// =======================
// Página HTML para escanear QR Code
app.get("/", (req, res) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot - QR Code</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        #qr-container {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #qr-image {
            max-width: 100%;
            height: auto;
        }
        .loading {
            color: #667eea;
            font-size: 16px;
        }
        .error {
            background: #fee;
            color: #c00;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .instructions {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 15px;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.6;
            margin-top: 20px;
        }
        .status {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Bot WhatsApp</h1>
        <p class="subtitle">Escaneie o QR Code com seu WhatsApp</p>
        
        <div class="error" id="error"></div>
        
        <div id="qr-container">
            <p class="loading">Carregando QR Code...</p>
        </div>
        
        <div class="instructions">
            <strong>Como vincular:</strong><br>
            1. Abra WhatsApp no seu celular<br>
            2. Vá em: Configurações → Dispositivos vinculados → Vincular um dispositivo<br>
            3. Escaneie o QR Code acima
        </div>
        
        <div class="status">
            Atualiza a cada 2 segundos | Servidor Online ✅
        </div>
    </div>

    <script>
        const qrContainer = document.getElementById('qr-container');
        const errorDiv = document.getElementById('error');

        async function loadQRCode() {
            try {
                const response = await fetch('/qrcode-image');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    qrContainer.innerHTML = '<img id="qr-image" src="' + url + '" alt="QR Code">';
                    errorDiv.style.display = 'none';
                } else if (response.status === 204) {
                    qrContainer.innerHTML = '<p style="color: #4caf50; font-size: 18px;">✅ Bot Conectado!<br><br>Nenhum QR Code necessário</p>';
                    errorDiv.style.display = 'none';
                }
            } catch (err) {
                qrContainer.innerHTML = '<p class="loading">Aguardando servidor...</p>';
            }
        }

        loadQRCode();
        setInterval(loadQRCode, 2000);
    </script>
</body>
</html>
    `;
    res.send(htmlContent);
});

// =======================
// Endpoint para gerar QR Code como PNG
app.get("/qrcode-image", async (req, res) => {
    if (!qrCodeData) {
        return res.status(204).send();
    }

    try {
        const qrImage = await QRCode.toDataURL(qrCodeData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 10,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            }
        });

        const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(buffer);
    } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        res.status(500).json({ error: 'Erro ao gerar QR Code' });
    }
});

// =======================
// Health Check para UptimeRobot (mantém bot acordado)
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bosses: bossesOnline.length,
        qrPending: !!qrCodeData
    });
});

// =======================
// Reset Auth - Deleta credenciais e força novo QR code
app.get("/reset-auth", async (req, res) => {
    try {
        const authPath = path.join(process.cwd(), "auth");
        
        // Deletar pasta auth
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log("🗑️ Pasta auth deletada!");
        }
        
        qrCodeData = null;
        isConnecting = false;
        
        res.json({ 
            status: "success",
            message: "Auth folder deleted. Restarting bot...",
            timestamp: new Date().toISOString()
        });
        
        // Reiniciar bot após 2 segundos
        setTimeout(() => startBot(), 2000);
        
    } catch (error) {
        console.error("Erro ao deletar auth:", error.message);
        res.status(500).json({ 
            status: "error",
            message: error.message 
        });
    }
});

// =======================
async function startBot() {
    // Evitar múltiplas tentativas simultâneas
    if (isConnecting) {
        console.log("⏳ Já está tentando conectar...");
        return;
    }
    
    isConnecting = true;
    
    try {
        // Importar Baileys dinamicamente (ESM module)
        if (!makeWASocket) {
            const baileys = await import("@whiskeysockets/baileys");
            makeWASocket = baileys.default;
            useMultiFileAuthState = baileys.useMultiFileAuthState;
            fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
        }

        const { state, saveCreds } = await useMultiFileAuthState("auth");
        const { version } = await fetchLatestBaileysVersion();

        await carregarMobs();

        const sock = makeWASocket({
            version,
            auth: state,
            browser: ["Termux", "Chrome", "1.0.0"]
        });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        // Apenas gerar QR code se necessário (sem credenciais válidas)
        if (qr) {
            const now = Date.now();
            if (now - lastQRTime > 10000) {
                qrCodeData = qr;
                lastQRTime = now;
                console.log("\n📱 QR CODE GERADO! Escaneie com WhatsApp:\n");
                qrcodeTerminal.generate(qr, { small: true });
                console.log("\n⚠️ Se estiver usando Render, verifique os logs para o QR Code!\n");
            }
        }

        if (connection === "open") {
            qrCodeData = null;
            isConnecting = false;
            console.log("✅ BOT ONLINE! Conectado ao WhatsApp com sucesso");

            setInterval(() => {
                monitorarBoss(sock);
            }, 120000);
        }

        if (connection === "close") {
            // Apenas reconectar se for desconexão por expiração de credenciais
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`❌ Conexão fechada (código: ${statusCode})`);
            
            // 401 = Desautorizado (credenciais inválidas/expiradas)
            // 428 = Precondition Required (sessão expirada)
            if (statusCode === 401 || statusCode === 428) {
                console.log("🔄 Credenciais inválidas. Reconectando com novo QR code...");
                isConnecting = false;
                setTimeout(() => startBot(), 3000);
            } else {
                console.log("⏸️ Conexão fechada normalmente. Aguardando...");
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const texto = msg.message.conversation || "";
        
        console.log(`📨 Mensagem recebida: "${texto}" de ${from}`);

        if (!from.endsWith("@g.us")) {
            console.log("⏭️ Ignorado: não é um grupo");
            return;
        }

        console.log(`\n🔍 Verificando grupos...`);
        console.log(`   GRUPO_BOSS: ${GRUPO_BOSS}`);
        console.log(`   GRUPO_OLY: ${GRUPO_OLY}`);
        console.log(`   FROM: ${from}\n`);

        // =======================
        if (from === GRUPO_BOSS) {
            console.log("✅ Mensagem do GRUPO_BOSS detectada");

            if (texto.startsWith(".")) {
                const busca = texto.replace(".", "");
                console.log(`🔎 Buscando mob: ${busca}`);

                const resultados = buscarMob(busca);

                if (resultados.length === 0) {
                    await sock.sendMessage(from, { text: "❌ Nenhum mob encontrado" });
                    return;
                }

                let resposta = "";
                resultados.slice(0, 3).forEach(m => resposta += formatarMob(m));

                await sock.sendMessage(from, { text: resposta });
            }

            if (texto === "Bosslive") {
                console.log("🐉 Comando Bosslive detectado");
                await atualizarBosses();

                let resposta = "🔥 BOSS ONLINE:\n\n";

                bossesOnline.slice(0, 10).forEach(b => {
                    resposta += `🐉 ${b.nome}\n📊 ${b.status}\n⏰ ${b.tempo}\n\n`;
                });

                await sock.sendMessage(from, { text: resposta });
            }
        }

        // =======================
        if (from === GRUPO_OLY) {
            console.log("✅ Mensagem do GRUPO_OLY detectada");

            if (texto === "Oly") {
                console.log("🏆 Comando Oly detectado");
                const dados = await pegarOly();
                await sock.sendMessage(from, { text: dados });
            }

            if (texto.startsWith("/")) {
                console.log("⚔️ Comando de classe detectado");
                const classe = texto.replace("/", "");
                const dados = await pegarOlyPorClasse(classe);
                await sock.sendMessage(from, { text: dados });
            }
        }
    });
    } catch (error) {
        console.error("❌ Erro ao inicializar bot:", error.message);
        console.error("🔄 Tentando reconectar em 10 segundos...");
        isConnecting = false;
        setTimeout(() => startBot(), 10000);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

setInterval(atualizarBosses, 30000);

startBot();

