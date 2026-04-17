const axios = require('axios');
const cheerio = require('cheerio');

let bossCache = [];
let olyCache = [];
let lastUpdate = 0;

const getBosses = async (force = false) => {
    try {
        const now = Date.now();
        if (force || now - lastUpdate > 600000) {
            const { data } = await axios.get('https://divolion.net/?page=boss');
            const $ = cheerio.load(data);
            bossCache = [];

            $('tbody tr').each((i, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 4) {
                    bossCache.push({
                        nome: $(cells[0]).text().trim(),
                        level: $(cells[1]).text().trim(),
                        status: $(cells[2]).text().trim(),
                        respawn: $(cells[3]).text().trim()
                    });
                }
            });
            lastUpdate = now;
        }
        return bossCache;
    } catch (err) {
        console.error('❌ Erro ao buscar bosses:', err.message);
        return bossCache;
    }
};

const getOly = async (force = false) => {
    try {
        const now = Date.now();
        if (force || now - lastUpdate > 600000) {
            const { data } = await axios.get('https://divolion.net/?page=oly_rank');
            const $ = cheerio.load(data);
            olyCache = [];

            $('tbody tr').each((i, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 5) {
                    olyCache.push({
                        ranking: $(cells[0]).text().trim(),
                        nome: $(cells[1]).text().trim(),
                        classe: $(cells[2]).text().trim(),
                        pontos: $(cells[3]).text().trim(),
                        clan: $(cells[4]).text().trim()
                    });
                }
            });
            lastUpdate = now;
        }
        return olyCache;
    } catch (err) {
        console.error('❌ Erro ao buscar OLY:', err.message);
        return olyCache;
    }
};

module.exports = { getBosses, getOly };
