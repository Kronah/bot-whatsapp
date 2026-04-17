const { getOly } = require('../utils/scraper');

module.exports = {
    name: 'oly',
    run: async (sock, msg, args, from) => {
        const oly = await getOly();
        
        if (oly.length === 0) {
            return '❌ Não foi possível carregar OLY';
        }

        let texto = '🏅 *TOP 10 OLY*\n\n';
        oly.slice(0, 10).forEach(o => {
            texto += `${o.ranking}º ${o.nome}\n⚔️ ${o.classe}\n📊 ${o.pontos} pts | ${o.clan}\n\n`;
        });

        return texto;
    }
};
