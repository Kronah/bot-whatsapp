const { getConfig, isAdmin } = require('../utils/config');

module.exports = {
    name: 'adm',
    run: async (sock, msg, args, numero, from) => {
        const config = getConfig();

        // 🔒 Apenas admin
        if (!isAdmin(numero, config)) {
            return '❌ Apenas admin pode usar este comando';
        }

        const subcomando = args[0]?.toLowerCase();

        if (subcomando === 'id') {
            return `🔑 ID do Grupo:\n\`${from}\``;
        }

        return '❌ Use: .adm id';
    }
};
