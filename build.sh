#!/bin/bash

# Instalação das dependências
npm install

# Verificar se instalou corretamente
if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro na instalação de dependências"
    exit 1
fi
