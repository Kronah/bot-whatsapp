# 📱 Bot WhatsApp no Termux (S20 FE)

## ✅ Instruções de Instalação

### 1️⃣ Instalar Termux
- Baixe do F-Droid: https://f-droid.org/packages/com.termux/
- **NÃO use a versão do Play Store** (desatualizada)

### 2️⃣ Instalar Node.js no Termux
```bash
pkg update
pkg install -y nodejs-lts
node -v  # Verificar instalação
npm -v
```

### 3️⃣ Clonar o repositório
```bash
cd ~
git clone https://github.com/Kronah/bot-whatsapp.git
cd bot-whatsapp
```

### 4️⃣ Instalar dependências
```bash
npm install
```

### 5️⃣ Iniciar o bot
```bash
npm start
# ou
node bot.js
```

---

## 🎯 Como usar

### Acessar a página com QR Code
No navegador do celular:
```
http://localhost:8080/
```

### Endpoints disponíveis
- `http://localhost:8080/` → Página com QR Code
- `http://localhost:8080/health` → Status do bot
- `http://localhost:8080/ping` → Teste rápido

---

## 🔧 Manter rodando

### Opção 1: Usar `screen` (Recomendado)
```bash
# Iniciar em background
screen -S bot -d -m bash -c 'cd ~/bot-whatsapp && npm start'

# Conectar à sessão
screen -r bot

# Desconectar (Ctrl + A + D)
```

### Opção 2: Usar `nohup`
```bash
nohup npm start > bot.log 2>&1 &
```

### Opção 3: Daemon com `pm2`
```bash
npm install -g pm2
pm2 start bot.js --name "whatsapp-bot"
pm2 save
pm2 startup
```

---

## 📊 Monitoramento

Ver logs em tempo real:
```bash
# Se usando screen
screen -r bot

# Se usando nohup
tail -f bot.log
```

---

## ⚠️ Troubleshooting

### Porta 8080 já está em uso
```bash
npm start PORT=8081  # Usar outra porta
```

### Permissões de arquivo
```bash
chmod -R 755 ~/bot-whatsapp
```

### Limpar cache Node
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Do seu PC/Notebook

Se estiver na mesma rede WiFi que o S20:

1. Discover IP do S20 no Termux:
```bash
ifconfig  # procurar por "inet"
```

2. No seu PC:
```
http://<IP_DO_S20>:8080/
```

---

## 🛡️ Dicas de Estabilidade

✅ **Manter Termux rodando:**
- Desabilite "Otimização de bateria" para o Termux
- Não feche a aba do Termux
- Use screen/pm2 para manter em background

✅ **Evite travamentos:**
- Reinicie o Termux se ficar lento
- Feche outros apps pesados
- Libere espaço em disco

✅ **WhatsApp:**
- Mantenha o WhatsApp ligado no celular
- Aceite as notificações de sincronização
- Não desative permissões do WhatsApp

---

## 🚀 Comandos úteis

```bash
# Ver uso de memória
free -h

# Ver processos Node
ps aux | grep node

# Matar processo node
pkill -f "node bot.js"

# Ver porta 8080 em uso
netstat -tlnp | grep 8080
```

---

**Bora lá! Bot rodando no seu celular! 📱🚀**
