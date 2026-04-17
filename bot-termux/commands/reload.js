const { getConfig, isAdmin } = require('../utils/config');

module.exports = {
    name: 'reload',
    run: async (sock, msg, args, numero, from) => {
        const config = getConfig();

        // 🔒 Apenas admin
        if (!isAdmin(numero, config)) {
            return '❌ Apenas admin pode usar este comando';
        }

        return '♻️ Bot recarregando...';
    }
};
