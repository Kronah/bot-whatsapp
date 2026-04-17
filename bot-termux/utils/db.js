const fs = require('fs');

const mobs = [
    { nome: 'Antharas', level: 79, hp: 6000 },
    { nome: 'Korim', level: 75, hp: 4000 },
    { nome: 'Lindvior', level: 76, hp: 5000 },
    { nome: 'Orfen', level: 76, hp: 4500 },
    { nome: 'Tanta', level: 72, hp: 3000 },
    { nome: 'Frintezza', level: 77, hp: 5500 },
    { nome: 'Barakiel', level: 80, hp: 6500 }
];

const normalizar = (texto) => {
    return texto.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
};

const searchMob = (termo) => {
    const normalized = normalizar(termo);
    
    // Busca exata
    let mob = mobs.find(m => normalizar(m.nome) === normalized);
    if (mob) return mob;
    
    // Busca parcial
    mob = mobs.find(m => normalizar(m.nome).includes(normalized));
    if (mob) return mob;
    
    // Começa com
    mob = mobs.find(m => normalizar(m.nome).startsWith(normalized));
    if (mob) return mob;
    
    return null;
};

module.exports = { mobs, searchMob, normalizar };
