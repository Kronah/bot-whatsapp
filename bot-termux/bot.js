const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
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
        const { state, saveCreds } = await useMultiFileAuthState('auth');

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '120.0']
        });

        // QR Code
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCode = qr;
                console.log('📱 QR gerado! Acesse: http://localhost:' + PORT);
            }

            if (connection === 'open') {
                console.log('✅ BOT ONLINE!');
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('⚠️ Desconectado:', shouldReconnect ? 'reconectando...' : 'logout');
                if (shouldReconnect) {
                    setTimeout(startBot, 3000);
                }
            }
        });

        // Salvar credenciais
        sock.ev.on('creds.update', saveCreds);

        // Mensagens
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message) return;

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
                <head><title>WhatsApp Bot</title></head>
                <body style="text-align: center; padding: 20px; font-family: Arial;">
                    <h1>🤖 WhatsApp Bot</h1>
                    <p>Iniciando...</p>
                    <p><a href="/">Atualizar</a></p>
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
                        padding: 10px; 
                        background: white; 
                        border-radius: 10px; 
                    }
                    h1 { color: #25D366; }
                </style>
            </head>
            <body>
                <h1>📱 Escanear QR Code</h1>
                <p>Abra WhatsApp no seu celular e escanear este código</p>
                <div id="qr"></div>
                <script>
                    new QRCode(document.getElementById("qr"), "${qrCode}");
                    setTimeout(() => location.reload(), 2000);
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
    res.json({ status: sock ? 'online' : 'offline', timestamp: new Date() });
});

// ============ INICIAR ============
console.log('🚀 Iniciando bot modular...\n');
loadCommands();
startBot();

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
