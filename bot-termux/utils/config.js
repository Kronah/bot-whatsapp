const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../config.json');

const getConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
    } catch (err) {
        console.log('⚠️ Erro ao carregar config');
    }
    return { admin: '', grupos: {} };
};

const saveConfig = (config) => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.log('❌ Erro ao salvar config:', err.message);
    }
};

const isAdmin = (numero, config) => {
    return numero === config.admin;
};

module.exports = { getConfig, saveConfig, isAdmin };
