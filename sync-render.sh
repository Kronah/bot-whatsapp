#!/bin/bash

# Script para enviar arquivo de auth para Render via terminal

echo "🚀 Sincronizando bot com GitHub..."

# 1. Remover auth do .gitignore temporariamente
sed -i '/auth\//d' .gitignore

# 2. Adicionar tudo
git add .

# 3. Commit
git commit -m "Bot + Auth files - Ready for Render"

# 4. Push
git push origin main

# 5. Restaurar .gitignore (opcional, se quiser)
# echo "auth/" >> .gitignore
# git add .gitignore
# git commit -m "Restore .gitignore"
# git push origin main

echo "✅ Push completo!"
echo "📱 Agora vá em: https://render.com e crie o Web Service"
