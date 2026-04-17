const { searchMob } = require('../utils/db');

module.exports = {
    name: 'mob',
    run: async (sock, msg, args, from) => {
        const termo = args.join(' ');
        if (!termo) return '❌ Use: .antharas ou .korim';

        const mob = searchMob(termo);
        if (!mob) {
            return `❌ Mob "${termo}" não encontrado`;
        }

        return `🐉 *${mob.nome}*\n📊 Level: ${mob.level}\n❤️ HP: ${mob.hp}`;
    }
};
