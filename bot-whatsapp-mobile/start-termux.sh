#!/bin/bash
# Bot WhatsApp - Termux Startup Script

echo "======================================"
echo "  Bot WhatsApp - Termux"
echo "======================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${YELLOW}📦 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado!${NC}"
    echo "Instale com: pkg install -y nodejs-lts"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# Verificar dependências
echo ""
echo -e "${YELLOW}📦 Verificando dependências...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando npm packages...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Dependências OK${NC}"

# Informações úteis
echo ""
echo -e "${GREEN}======================================"
echo "  Bot pronto para rodar!"
echo "======================================${NC}"
echo ""
echo "Endpoints disponíveis:"
echo "  🌐 QR Code: http://localhost:8080/"
echo "  💓 Health: http://localhost:8080/health"
echo "  🏓 Ping: http://localhost:8080/ping"
echo ""
echo -e "${YELLOW}Dica: Use Ctrl+C para parar${NC}"
echo ""

# Iniciar bot
npm start
