const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const GRUPO_BOSS = "120363426540795167@g.us";
const GRUPO_OLY  = "120363426376971165@g.us";

let mobs = [];
let bossesOnline = [];
let statusBossAnterior = {};

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
async function startBot() {
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
        const { connection, qr } = update;

        if (qr) qrcode.generate(qr, { small: true });

        if (connection === "open") {
            console.log("✅ BOT ONLINE!");

            setInterval(() => {
                monitorarBoss(sock);
            }, 120000);
        }

        if (connection === "close") startBot();
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const texto = msg.message.conversation || "";

        if (!from.endsWith("@g.us")) return;

        // =======================
        if (from === GRUPO_BOSS) {

            if (texto.startsWith(".")) {
                const busca = texto.replace(".", "");

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
}

app.listen(3000);
setInterval(atualizarBosses, 30000);

startBot();

