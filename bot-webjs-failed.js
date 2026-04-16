const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const GRUPO_BOSS = "120363426540795167@g.us";
const GRUPO_OLY  = "120363426376971165@g.us";
const PORT = process.env.PORT || 3000;

let mobs = [];
let bossesOnline = [];
let statusBossAnterior = {};
let qrCodeData = null;
let clientReady = false;

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
    try {
        const res = await axios.get("https://raw.githubusercontent.com/Kronah/mob-data/main/dados.json");
        mobs = res.data;
        console.log(`✅ ${mobs.length} mobs carregados`);
    } catch (error) {
        console.error("❌ Erro ao carregar mobs:", error.message);
    }
}

// =======================
function buscarMob(busca) {
    const termo = normalizar(busca);
    let encontrados = mobs.filter(m =>
        normalizar(m["Nome do Mob"]).includes(termo)
    );
    if (encontrados.length > 0) return encontrados;

    encontrados = mobs.filter(m =>
        normalizar(m["Nome do Mob"]).startsWith(termo)
    );
    if (encontrados.length > 0) return encontrados;

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
    return `🐉 MOB\n📌 Número: ${m["Número"] || "-"}\n📌 Nome: ${m["Nome do Mob"] || "-"}\n📂 PT: ${m["Arquivo"] || "-"}\n⭐ Pontos: ${m["Pontos"] || "-"}\n\n`;
}

// =======================
async function atualizarBosses() {
    try {
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
    } catch (error) {
        console.error("❌ Erro ao atualizar bosses:", error.message);
    }
}

// =======================
async function pegarOly() {
    try {
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
    } catch (error) {
        console.error("Erro ao pegar OLY:", error.message);
        return "❌ Erro ao buscar ranking OLY";
    }
}

// =======================
async function pegarOlyPorClasse(classeBusca) {
    try {
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
    } catch (error) {
        console.error("Erro ao buscar classe OLY:", error.message);
        return "❌ Erro ao buscar classe";
    }
}

// =======================
// ENDPOINTS HTTP
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

app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: clientReady ? "ready" : "connecting",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bosses: bossesOnline.length,
        qrPending: !!qrCodeData
    });
});

app.get("/status", (req, res) => {
    res.json({ 
        status: clientReady ? "online" : "connecting", 
        timestamp: new Date(),
        qrCode: qrCodeData ? "pending" : "not_needed" 
    });
});

// =======================
// WHATSAPP CLIENT
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "bot-lineage"
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
    }
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    console.log('\n📱 QR CODE GERADO! Escaneie com WhatsApp:\n');
    console.log(qr);
});

client.on('authenticated', () => {
    console.log('✅ Autenticado! Conectando...');
});

client.on('ready', () => {
    clientReady = true;
    qrCodeData = null;
    console.log('✅ BOT PRONTO! Conectado ao WhatsApp');
    
    // Monitorar bosses a cada 2 minutos
    setInterval(() => {
        atualizarBosses();
    }, 120000);
});

client.on('disconnect', (reason) => {
    clientReady = false;
    console.log('❌ Desconectado:', reason);
});

client.on('message', async (message) => {
    const texto = message.body.trim();
    const from = message.from;
    
    console.log(`📨 Mensagem recebida: "${texto}" de ${from}`);

    // GRUPO BOSS
    if (from === GRUPO_BOSS) {
        if (texto.startsWith(".")) {
            const busca = texto.replace(".", "");
            console.log(`🔎 Buscando mob: ${busca}`);
            const resultados = buscarMob(busca);

            if (resultados.length === 0) {
                await message.reply("❌ Nenhum mob encontrado");
                return;
            }

            let resposta = "";
            resultados.slice(0, 3).forEach(m => resposta += formatarMob(m));
            await message.reply(resposta);
        }

        if (texto === "Bosslive") {
            console.log("🐉 Comando Bosslive detectado");
            await atualizarBosses();
            let resposta = "🔥 BOSS ONLINE:\n\n";
            bossesOnline.slice(0, 10).forEach(b => {
                resposta += `🐉 ${b.nome}\n📊 ${b.status}\n⏰ ${b.tempo}\n\n`;
            });
            await message.reply(resposta);
        }
    }

    // GRUPO OLY
    if (from === GRUPO_OLY) {
        if (texto === "Oly") {
            console.log("🏆 Comando Oly detectado");
            const dados = await pegarOly();
            await message.reply(dados);
        }

        if (texto.startsWith("/")) {
            console.log("⚔️ Comando de classe detectado");
            const classe = texto.replace("/", "");
            const dados = await pegarOlyPorClasse(classe);
            await message.reply(dados);
        }
    }
});

// =======================
async function startServer() {
    try {
        await carregarMobs();
        console.log('🚀 Iniciando WhatsApp Bot com whatsapp-web.js...');
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        });

        await client.initialize();
    } catch (error) {
        console.error("❌ Erro ao iniciar:", error.message);
        setTimeout(() => startServer(), 10000);
    }
}

startServer();
