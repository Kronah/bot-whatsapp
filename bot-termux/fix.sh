#!/bin/bash
# Script para corrigir SyntaxError no bot.js diretamente no Termux

echo "Corrigindo bot.js..."

sed -i '/retryRequestDelayMs/d' bot.js
sed -i '/maxRetries/d' bot.js  
sed -i '/emitOwnEvents/d' bot.js

echo "Verificando se ainda tem o erro..."
if grep -q "retryRequestDelayMs" bot.js; then
    echo "ERRO: Linha ainda existe!"
else
    echo "OK: Linha removida com sucesso!"
fi

echo ""
echo "Iniciando bot..."
npm start
