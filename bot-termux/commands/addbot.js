const { getConfig, saveConfig, isAdmin } = require('../utils/config');

module.exports = {
    name: 'addbot',
    run: async (sock, msg, args, numero, from) => {
        const config = getConfig();

        // 🔒 Apenas admin
        if (!isAdmin(numero, config)) {
            return '❌ Apenas admin pode usar este comando';
        }

        if (config.grupos[from]) {
            return '✅ Grupo já cadastrado';
        }

        config.grupos[from] = { tipo: 'geral', ativo: true };
        saveConfig(config);

        return '✅ Grupo cadastrado! Use .help para ver comandos';
    }
};
