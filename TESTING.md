# 🧪 TESTES E VERIFICAÇÕES

## ✅ Teste Local Rápido

Antes de fazer push para o Render, teste localmente:

### 1. Instalar dependências
```bash
cd bot-whatsapp
npm install
```

### 2. Rodar bot localmente
```bash
npm start
```

### 3. Verificar se iniciou
Você deve ver:
```
✅ BOT ONLINE!
🚀 Servidor rodando em http://localhost:3000
```

### 4. Testar endpoints (em outro terminal)
```bash
# Status
curl http://localhost:3000/status

# Bosses
curl http://localhost:3000/bosses

# QR Code (se não vinculado)
curl http://localhost:3000/qrcode
```

---

## 📱 Teste de Vinculação WhatsApp

### Passo 1: Iniciar bot
```bash
npm start
```

### Passo 2: Apareça o QR Code
Você verá algo assim:
```
📱 QR CODE GERADO! Escaneie com WhatsApp:

█████████████████████████████████
██ ▄▄▄▄▄ █▀▀▄▀▀█▀ ▄▄█ ▄▄▄▄▄ ██
██ █   █ █ ▀▄▄  ▀█▀▀▀█ █   █ ██
██ █▄▄▄█ █  ▄█▀ █  ▄ █ █▄▄▄█ ██
██ █  ▄▄ █▄ █▀▀▀ ▄▄▀▄  █▄▄▄  ██
██ █▄▄▄▄ █▀█ █▀█▀▄ ▀▀▄▄█    █ ██
██ ███████▄██ █ █▄█ █ █████████ ██
██
```

### Passo 3: Escanear
No celular:
1. Abra **WhatsApp**
2. **Configurações → Dispositivos vinculados → Vincular um dispositivo**
3. Aponte a câmera para o QR Code
4. Confirme em **"Vincular"**

### Passo 4: Confirmar vinculação
No terminal deve aparecer:
```
✅ BOT ONLINE!
```

### Passo 5: Enviar mensagens de teste
Nos grupos configurados:
- `.slime` - Busca por "slime"
- `Bosslive` - Ver bosses online
- `OLY` - Ver ranking Olympiad
- `OLY mage` - Ver ranking de mages

---

## 🔍 Verificações Importantes

### Verificar IDs dos grupos
```bash
# Para descobrir ID do grupo, envie qualquer mensagem e veja o console
# Deve mostrar algo como: "120363426540795167@g.us"
```

### Verificar se a autenticação persistiu
```bash
ls -la auth/
# Deve ter arquivos como:
# - app-state-sync-version-critical.json
# - creds.json
```

### Verificar conexão com dados remotos
```bash
# Os dados de mobs vêm de:
# https://raw.githubusercontent.com/Kronah/mob-data/main/dados.json

# Os dados de bosses vêm de:
# https://divolion.net/?page=boss

# Verifique se pode acessar essas URLs
curl https://raw.githubusercontent.com/Kronah/mob-data/main/dados.json | jq . | head
```

---

## 🚀 Teste no Render

### Após deploy, verificar:

1. **Logs aparecem**
   - Dashboard Render → Logs
   - Deve mostrar: `✅ BOT ONLINE!`

2. **Status endpoint funciona**
   ```bash
   curl https://seu-bot.onrender.com/status
   # Deve retornar JSON com status="online"
   ```

3. **Testar vinculação**
   - Escaneie o QR Code que aparece nos logs
   - Envie um comando no grupo

---

## 📊 Monitorar em Tempo Real

### Ver logs ao vivo
```bash
# Na dashboard Render, vá em "Logs"
# Ou use webhook para notificações em Discord/Slack
```

### Ver metrics
- CPU: deve ficar abaixo de 50% idle
- Memory: deve ficar abaixo de 200MB
- Requests: monitore quantidade de requisições

---

## 🐛 Debug Mode

Se tiver problemas, ative debug:

**No bot.js, adicione:**
```javascript
process.env.DEBUG = 'baileys:*';
```

Isso vai mostrar muitos mais logs (útil para troubleshooting).

---

## ✅ Checklist Final Antes de Deploy

- [ ] `npm install` executa sem erros
- [ ] `npm start` inicia o bot
- [ ] QR Code aparece no terminal
- [ ] Bot vincula com WhatsApp
- [ ] Mensagens são enviadas com sucesso
- [ ] `Procfile` existe e está correto
- [ ] `package.json` tem `"start": "node bot.js"`
- [ ] `.gitignore` ignora `node_modules/`
- [ ] Todos os commits foram feitos em main
- [ ] GitHub está atualizado com as mudanças

Se tudo passar, seu deploy no Render vai funcionar! 🎉
