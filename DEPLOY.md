# 🚀 DEPLOY NO RENDER - PASSO A PASSO

## ✅ CHECKLIST PRÉ-DEPLOY

- [x] `package.json` com dependências corretas
- [x] `Procfile` configurado (`web: node bot.js`)
- [x] `bot.js` com PORT dinâmica (`process.env.PORT || 3000`)
- [x] `build.sh` para instalar dependências
- [x] `.gitignore` para não carregar `node_modules`

## 📋 PASSO 1: Preparar o Repositório

```bash
cd bot-whatsapp
git add .
git commit -m "Preparado para deploy Render"
git push origin main
```

## 🌐 PASSO 2: Deploy no Render

1. Acesse: https://render.com
2. Clique em **"+ New"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:

```
┌─────────────────────────────────────────┐
│ Name: bot-whatsapp                      │
│ Environment: Node                       │
│ Build Command: npm install              │
│ Start Command: node bot.js              │
│ Plan: Free (ou Starter conforme uso)    │
└─────────────────────────────────────────┘
```

## 📱 PASSO 3: Escanear QR Code

1. Após deploy, vá em **"Logs"**
2. Procure por: `📱 QR CODE GERADO!`
3. Você verá o QR Code em texto
4. Abra WhatsApp no celular
5. Vá em **Configurações → Dispositivos vinculados → Vincular um dispositivo**
6. Escaneie o QR Code exibido nos logs

## ✅ VERIFICAR SE ESTÁ ONLINE

```bash
# Status da aplicação (substitua URL)
curl https://seu-bot.onrender.com/status

# Ver bosses online
curl https://seu-bot.onrender.com/bosses

# Ver QR Code (se ainda não vinculado)
curl https://seu-bot.onrender.com/qrcode
```

## ⏰ MANTER BOT 24H ONLINE

### Opção 1: Plan Pago (Render)
- Use o plano **Starter** ou superior
- Custa ~$10/mês
- Nunca hiberna

### Opção 2: Gratuito (com hibernação)
- Free tier hiberna após 15 min de inatividade
- Para evitar: Adicionar um "pinger"
  
**Adicionar na raiz do projeto (`pinger.js`):**

```javascript
const https = require('https');

setInterval(() => {
    const url = process.env.APP_URL || 'https://seu-bot.onrender.com';
    https.get(url, (res) => {
        console.log(`[${new Date().toISOString()}] Ping: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Ping failed: ${e.message}`);
    });
}, 300000); // A cada 5 minutos
```

Depois atualizar `Procfile`:
```
web: node bot.js
pinger: node pinger.js
```

## 🔧 TROUBLESHOOTING

### Bot não inicia (Build falha)
```
❌ Erro: Cannot find module '@whiskeysockets/baileys'
✅ Solução: Verifique package.json tem todas as dependências
```

### QR Code não aparece nos logs
```
❌ Problema: Bot conectado mas sem logs de QR
✅ Solução: Pode estar já autenticado (pasta auth/ persistente)
```

### Bot cai frequentemente
```
❌ Problema: Conexão WhatsApp desconecta
✅ Solução: Use Auto-Deploy + Health Checks
```

## 📊 MONITORAR DESEMPENHO

**Dashboard do Render mostra:**
- CPU usage
- Memory usage
- Requests
- Logs em tempo real

**Para logs em tempo real:**
```bash
# No terminal do seu PC
curl -N https://seu-bot.onrender.com/logs 2>&1 | tee bot.log
```

## 🆘 SUPORTE

- **Render Docs**: https://render.com/docs
- **Baileys Issues**: https://github.com/WhiskeySockets/Baileys
- **Comunidade Render**: Discord/Forum no site

---

**Pronto!** Seu bot deve estar rodando 24h! 🎉
