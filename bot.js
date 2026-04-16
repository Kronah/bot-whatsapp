const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode"); // ✅ QRCode library loaded
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
let globalSocket = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;

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
        return res.status(200).json({ 
            status: "waiting",
            message: "QR code não está disponível. Bot iniciando...",
            timestamp: new Date().toISOString()
        });
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
        res.status(500).json({ error: 'Erro ao gerar QR Code', message: err.message });
    }
});

// =======================
// GERAR QR CODE EM PNG
const QR_CODE_PATH = path.join(__dirname, 'qrcode.png');

function gerarQRCodePNG(qrData) {
    QRCode.toFile(QR_CODE_PATH, qrData, (err) => {
        if (err) {
            console.error('Erro ao gerar QR Code PNG:', err);
        } else {
            console.log('QR Code PNG gerado com sucesso:', QR_CODE_PATH);
        }
    });
}

// Exemplo de uso: gerarQRCodePNG('dados-do-qr-code');

// =======================
// ENDPOINT PARA SERVIR QR CODE PNG
app.get('/qrcode.png', (req, res) => {
    if (fs.existsSync(QR_CODE_PATH)) {
        res.sendFile(QR_CODE_PATH);
    } else {
        res.status(404).send('QR Code ainda não foi gerado.');
    }
});

// =======================
// ENDPOINT SIMPLES PARA QR CODE PNG
app.get('/png', async (req, res) => {
    if (!qrCodeData) {
        return res.status(200).json({ 
            status: "waiting",
            message: "QR code não está disponível. Bot iniciando...",
            timestamp: new Date().toISOString()
        });
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
        console.error('Erro ao gerar QR Code PNG:', err);
        res.status(500).json({ error: 'Erro ao gerar QR Code', message: err.message });
    }
});

// =======================
// =======================
// HEALTH CHECK ENDPOINTS
// =======================

// Ping simples (resposta rápida)
app.get("/ping", (req, res) => {
    res.status(200).send('pong');
});

// Health check detalhado para UptimeRobot
app.get("/health", (req, res) => {
    const isWhatsAppConnected = globalSocket && globalSocket.ws && globalSocket.ws.readyState === 1;
    
    res.status(200).json({ 
        status: isWhatsAppConnected ? "connected" : "disconnected",
        whatsapp: isWhatsAppConnected ? "online" : "offline",
        qrPending: !!qrCodeData,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        bosses: bossesOnline.length,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
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
    console.log("📱 startBot() chamado");
    
    // Fechar socket anterior se existir
    if (globalSocket && globalSocket.ws && globalSocket.ws.readyState !== globalSocket.ws.CLOSED) {
        try {
            globalSocket.ws.close();
            console.log("🔌 Socket anterior fechada");
        } catch (e) {
            console.log("⚠️ Erro ao fechar socket anterior:", e.message);
        }
    }
    
    // Evitar múltiplas tentativas simultâneas
    if (isConnecting) {
        console.log("⏳ Já está tentando conectar...");
        return;
    }
    
    isConnecting = true;
    console.log("🔄 Iniciando conexão com WhatsApp...");
    
    try {
        // Importar Baileys dinamicamente (ESM module)
        if (!makeWASocket) {
            console.log("📦 Importando Baileys...");
            const baileys = await import("@whiskeysockets/baileys");
            makeWASocket = baileys.default;
            useMultiFileAuthState = baileys.useMultiFileAuthState;
            fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
            console.log("✅ Baileys importado com sucesso");
        }

        console.log("🔐 Carregando autenticação...");
        const { state, saveCreds } = await useMultiFileAuthState("auth");
        const { version } = await fetchLatestBaileysVersion();
        console.log(`✅ Versão Baileys: ${version.version}`);

        // Carregar mobs de forma assíncrona (não bloqueia o início do bot)
        carregarMobs().catch(err => {
            console.warn("⚠️ Erro ao carregar mobs (bot continuará funcionando):", err.message);
            mobs = []; // Mobs vazios, mas o bot continua
        });

        console.log("🔌 Conectando ao WebSocket...");
        const sock = makeWASocket({
            version,
            auth: state,
            browser: ["Ubuntu", "Chrome", "20.0.0"],
            qrTimeout: 120000, // 2 minutos para escanear QR code
            retryRequestDelayMs: 100,
            shouldSyncHistoryMessage: () => false,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
            markOnlineThreshold: 15000,
            keepAliveIntervalMs: 30000,
            printQRInTerminal: true,
            defaultQueryTimeoutMs: 60000
        });

        // Armazenar referência global
        globalSocket = sock;
        reconnectAttempts = 0;

    sock.ev.on("creds.update", saveCreds);

    // Keep-alive: Enviar ping periodicamente para manter a conexão
    const keepAliveInterval = setInterval(() => {
        if (sock.ws && sock.ws.readyState === 1) { // WebSocket OPEN
            try {
                sock.ws.ping();
            } catch (e) {
                console.log("⚠️ Erro ao enviar keep-alive:", e.message);
            }
        }
    }, 30000);

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        console.log(`🔍 connection.update: connection=${connection}, qr=${!!qr}`);

        // Apenas gerar QR code se necessário (sem credenciais válidas)
        if (qr) {
            const now = Date.now();
            // Delay de 5 minutos para trocar QR code (dar tempo pro WhatsApp conectar)
            if (now - lastQRTime > 300000) {
                qrCodeData = qr;
                lastQRTime = now;
                console.log("\n✅ QR CODE GERADO COM SUCESSO!\n");
                console.log("📱 ESCANEIE O QR CODE:\n");
                qrcodeTerminal.generate(qr, { small: true });
                console.log("\n🌐 Ou acesse: https://bot-whatsapp-sw6u.onrender.com/\n");
            } else {
                console.log(`⏭️ QR Code será regenerado em ${Math.floor((300000 - (now - lastQRTime)) / 1000)}s`);
            }
        }

        if (connection === "open") {
            qrCodeData = null;
            isConnecting = false;
            reconnectAttempts = 0;
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
            // 515 = Stream error (device rejection after pairing)
            if (statusCode === 401 || statusCode === 428) {
                console.log("🔄 Credenciais inválidas. Reconectando com novo QR code...");
                isConnecting = false;
                reconnectAttempts = 0;
                setTimeout(() => startBot(), 3000);
            } else if (statusCode === 515) {
                console.log("⚠️ Dispositivo rejeitado pelo WhatsApp (515). Aguardando 10 segundos...");
                isConnecting = false;
                reconnectAttempts = 0;
                setTimeout(() => startBot(), 10000);
            } else if (statusCode === 408 || statusCode === 500 || statusCode === 503) {
                // Erros de servidor/timeout - reconectar com backoff
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`⚠️ Erro ${statusCode}. Tentativa ${reconnectAttempts}/${maxReconnectAttempts} em ${delay}ms...`);
                isConnecting = false;
                if (reconnectAttempts < maxReconnectAttempts) {
                    setTimeout(() => startBot(), delay);
                } else {
                    console.log("❌ Máximo de tentativas atingido. Aguardando ação do usuário...");
                }
            } else if (statusCode === undefined) {
                // Desconexão sem status code específico - reconectar rápido
                reconnectAttempts++;
                const delay = Math.min(3000 * reconnectAttempts, 15000);
                console.log(`⚠️ Desconexão inesperada. Tentativa ${reconnectAttempts}/${maxReconnectAttempts} em ${delay}ms...`);
                isConnecting = false;
                if (reconnectAttempts < maxReconnectAttempts) {
                    setTimeout(() => startBot(), delay);
                } else {
                    console.log("⏸️ Muitas desconexões. Aguardando ação do usuário...");
                }
            } else {
                console.log("⏸️ Conexão fechada. Aguardando ação do usuário...");
                isConnecting = false;
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

    // Sincronizar participantes do grupo
    sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
        console.log(`👥 Atualização no grupo ${id}: ${action} (${participants.length} participantes)`);
    });

    // Sincronizar chats
    sock.ev.on("chats.update", (chatsUpdate) => {
        console.log(`💬 Sincronização de chats: ${chatsUpdate.length} atualizações`);
    });
    } catch (error) {
        console.error("❌ Erro ao inicializar bot:", error.message);
        console.error("🔄 Tentando reconectar em 10 segundos...");
        isConnecting = false;
        setTimeout(() => startBot(), 10000);
    }
}

// =======================
// KEEP-ALIVE ENDPOINT
app.get('/', (req, res) => {
    res.status(200).send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// =======================
// INICIAR BOT E MONITORAMENTO
console.log("⏳ Iniciando bot WhatsApp...");
console.log(`🌐 Health check disponível em: /health e /ping`);
setInterval(atualizarBosses, 30000);
startBot();

