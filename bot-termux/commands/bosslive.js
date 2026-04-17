const { getBosses } = require('../utils/scraper');

module.exports = {
    name: 'bosslive',
    run: async (sock, msg, args, from) => {
        const bosses = await getBosses();
        
        if (bosses.length === 0) {
            return '❌ Não foi possível carregar os bosses';
        }

        let texto = '🏆 *BOSSES ONLINE*\n\n';
        bosses.slice(0, 10).forEach(b => {
            const emoji = b.status.includes('Vivo') ? '✅' : '❌';
            texto += `${emoji} ${b.nome}\n📊 Level: ${b.level}\n⏰ Respawn: ${b.respawn}\n\n`;
        });

        return texto;
    }
};
