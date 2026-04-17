const { getConfig, saveConfig, isAdmin } = require('../utils/config');

module.exports = {
    name: 'rmbot',
    run: async (sock, msg, args, numero, from) => {
        const config = getConfig();

        // 🔒 Apenas admin
        if (!isAdmin(numero, config)) {
            return '❌ Apenas admin pode usar este comando';
        }

        if (!config.grupos[from]) {
            return '❌ Grupo não cadastrado';
        }

        delete config.grupos[from];
        saveConfig(config);

        return '🗑️ Grupo removido!';
    }
};
