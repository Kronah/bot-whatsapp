const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./utils/config');

const PORT = process.env.PORT || 8080;
const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let qrCode = null;
let commands = {};
let isConnected = false;

// Carregar Baileys dinamicamente (ESM)
let makeWASocket, useMultiFileAuthState, DisconnectReason;

// ============ CARREGAR COMANDOS ============
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    
    files.forEach(file => {
        const cmd = require(path.join(commandsPath, file));
        commands[cmd.name] = cmd;
        console.log(`✅ Comando carregado: ${cmd.name}`);
    });

    console.log(`\n📦 ${files.length} comandos carregados\n`);
}

// ============ PROCESSAR COMANDO ============
async function processCommand(sock, msg, from, sender, text) {
    if (!text.startsWith('.')) return null;

    const [cmd, ...args] = text.slice(1).split(' ');
    
    if (commands[cmd]) {
        try {
            const result = await commands[cmd].run(sock, msg, args, sender, from);
            if (result) {
                await sock.sendMessage(from, { text: result });
            }
        } catch (err) {
            console.error(`❌ Erro no comando ${cmd}:`, err.message);
            await sock.sendMessage(from, { text: `❌ Erro: ${err.message}` });
        }
        return true;
    }

    return null;
}

// ============ INICIAR BOT ============
async function startBot() {
    try {
        // Importar Baileys dinamicamente
        if (!makeWASocket) {
            const module = await import('@whiskeysockets/baileys');
            makeWASocket = module.default;
            useMultiFileAuthState = module.useMultiFileAuthState;
            DisconnectReason = module.DisconnectReason;
        }

        const { state, saveCreds } = await useMultiFileAuthState('auth');

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '120.0'],
            qrTimeout: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true
        });

        // QR Code
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCode = qr;
                console.log('📱 QR gerado! Acesse: http://localhost:' + PORT);
            }

            if (connection === 'open') {
                isConnected = true;
                console.log('✅ BOT ONLINE!');
            }

            if (connection === 'close') {
                isConnected = false;
                const code = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = code !== DisconnectReason.loggedOut;
                console.log(`⚠️ Desconectado (${code}):`, shouldReconnect ? 'reconectando...' : 'logout');
                if (shouldReconnect) {
                    setTimeout(startBot, 5000);
                }
            }

            if (connection === 'connecting') {
                console.log('🔄 Conectando...');
            }
        });

        // Salvar credenciais
        sock.ev.on('creds.update', saveCreds);

        // Mensagens
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.includes('@g.us');
            const sender = msg.key.participant || msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

            if (!isGroup || !text.trim()) return;

            console.log(`📨 ${sender}: ${text}`);

            // Processar comando
            await processCommand(sock, msg, from, sender, text.trim());
        });

    } catch (err) {
        console.error('❌ Erro ao iniciar bot:', err.message);
        setTimeout(startBot, 5000);
    }
}

// ============ EXPRESS ENDPOINTS ============
app.get('/', (req, res) => {
    if (!qrCode) {
        return res.send(`
            <html>
                <head>
                    <title>WhatsApp Bot</title>
                    <meta http-equiv="refresh" content="3">
                </head>
                <body style="text-align: center; padding: 20px; font-family: Arial;">
                    <h1>🤖 WhatsApp Bot</h1>
                    <p style="font-size: 18px;">
                        ${isConnected ? '✅ Conectado' : '🔄 Aguardando QR Code...'}
                    </p>
                    <p><a href="/" style="font-size: 16px;">Atualizar</a></p>
                </body>
            </html>
        `);
    }

    res.send(`
        <html>
            <head>
                <title>WhatsApp Bot</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <style>
                    body { 
                        font-family: Arial; 
                        text-align: center; 
                        padding: 20px; 
                        background: #f0f0f0;
                    }
                    #qr { 
                        display: inline-block; 
                        padding: 20px; 
                        background: white; 
                        border-radius: 10px; 
                        margin: 20px 0;
                    }
                    h1 { color: #25D366; }
                    p { font-size: 16px; }
                </style>
            </head>
            <body>
                <h1>📱 Escanear QR Code</h1>
                <p>Abra WhatsApp no seu celular e toque em:<br><strong>Configurações > Aparelhos conectados > Conectar aparelho</strong></p>
                <p>Depois escanear este código:</p>
                <div id="qr"></div>
                <p style="color: #666;">A página atualiza automaticamente</p>
                <script>
                    if (document.getElementById("qr").innerHTML === '') {
                        new QRCode(document.getElementById("qr"), "${qrCode}");
                    }
                    setTimeout(() => location.reload(), 3000);
                </script>
            </body>
        </html>
    `);
});

app.get('/qrcode-image', (req, res) => {
    if (!qrCode) {
        return res.json({ status: 'pending', message: 'QR code não gerado ainda' });
    }

    QRCode.toDataURL(qrCode, (err, url) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'ok', qr: url });
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: isConnected ? 'online' : 'offline', 
        qr: qrCode ? 'pending' : 'ready',
        timestamp: new Date() 
    });
});

// ============ INICIAR ============
console.log('🚀 Iniciando bot modular...\n');
loadCommands();

// Iniciar servidor Express ANTES do bot
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}\n`);
    console.log(`📱 Acesse: http://localhost:${PORT} para ver o QR code\n`);
});

// Depois iniciar o bot
startBot();
