async function startBot() {
    // Evitar múltiplas conexões simultâneas
    if (isConnecting) {
        console.log("⏳ Já está conectando...");
        return;
    }

    isConnecting = true;

    try {
        if (!makeWASocket) {
            const baileys = await import("@whiskeysockets/baileys");
            makeWASocket = baileys.default;
            useMultiFileAuthState = baileys.useMultiFileAuthState;
            fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
            DisconnectReason = baileys.DisconnectReason;
        }

        const { state, saveCreds } = await useMultiFileAuthState("auth");
        const { version } = await fetchLatestBaileysVersion();

        await carregarMobs();

        // 🔥 FECHA SOCKET ANTIGO DE VERDADE
        if (globalSocket) {
            try {
                globalSocket.end();
                globalSocket = null;
                console.log("🔌 Socket antigo encerrado");
            } catch (e) {}
        }

        const sock = makeWASocket({
            version,
            auth: state,

            // 🔥 REMOVE TERMUX (MAIS SEGURO)
            browser: ["Ubuntu", "Chrome", "120.0.0"],

            printQRInTerminal: false,
            qrTimeout: 60000,

            markOnlineOnConnect: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        });

        globalSocket = sock;
        reconnectAttempts = 0;

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, qr, lastDisconnect } = update;

            // =========================
            // QR CODE
            // =========================
            if (qr) {
                qrCodeData = qr;
                console.log("\n📱 Novo QR Code gerado!\n");
                qrcodeTerminal.generate(qr, { small: true });
            }

            // =========================
            // CONECTADO
            // =========================
            if (connection === "open") {
                console.log("✅ BOT CONECTADO!");
                qrCodeData = null;
                isConnecting = false;

                // evitar múltiplos intervals
                if (!global.monitorInterval) {
                    global.monitorInterval = setInterval(() => {
                        monitorarBoss(sock);
                    }, 120000);
                }
            }

            // =========================
            // DESCONECTADO
            // =========================
            if (connection === "close") {
                isConnecting = false;

                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log(`❌ Conexão fechada. Código: ${statusCode}`);

                // 🔴 SESSÃO INVALIDA (PRINCIPAL PROBLEMA)
                if (
                    statusCode === DisconnectReason.loggedOut ||
                    statusCode === 401 ||
                    statusCode === 428
                ) {
                    console.log("🧹 Sessão inválida! Limpando auth...");

                    try {
                        fs.rmSync("auth", { recursive: true, force: true });
                    } catch (e) {}

                    setTimeout(() => startBot(), 3000);
                    return;
                }

                // 🔁 ERRO TEMPORÁRIO
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;

                    const delay = Math.min(2000 * reconnectAttempts, 15000);

                    console.log(
                        `🔄 Tentando reconectar (${reconnectAttempts}/${maxReconnectAttempts}) em ${delay}ms`
                    );

                    setTimeout(() => startBot(), delay);
                } else {
                    console.log("⛔ Limite de tentativas atingido.");
                }
            }
        });

        // =========================
        // MENSAGENS (MANTIVE SEU CÓDIGO)
        // =========================
        sock.ev.on("messages.upsert", async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const texto = msg.message.conversation || "";

            console.log(`📨 ${texto}`);

            if (!from.endsWith("@g.us")) return;

            // =======================
            if (from === GRUPO_BOSS) {
                if (texto.startsWith(".")) {
                    const busca = texto.replace(".", "");
                    const resultados = buscarMob(busca);

                    if (resultados.length === 0) {
                        await sock.sendMessage(from, {
                            text: "❌ Nenhum mob encontrado"
                        });
                        return;
                    }

                    let resposta = "";
                    resultados.forEach(m => resposta += formatarMob(m));

                    await sock.sendMessage(from, { text: resposta });
                }

                if (texto === "Bosslive") {
                    await atualizarBosses();

                    let resposta = "🔥 BOSS ONLINE:\n\n";

                    bossesOnline.forEach(b => {
                        resposta += `🐉 ${b.nome}\n📊 ${b.status}\n⏰ ${b.tempo}\n\n`;
                    });

                    await sock.sendMessage(from, { text: resposta });
                }
            }

            // =======================
            if (from === GRUPO_OLY) {
                if (texto === "Oly") {
                    const dados = await pegarOly();
                    await sock.sendMessage(from, { text: dados });
                }

                if (texto.startsWith("/")) {
                    const classe = texto.replace("/", "");
                    const dados = await pegarOlyPorClasse(classe);
                    await sock.sendMessage(from, { text: dados });
                }
            }
        });

    } catch (error) {
        console.error("❌ Erro geral:", error.message);
        isConnecting = false;

        setTimeout(() => startBot(), 10000);
    }
}
