# ✅ CONFIGURAÇÃO COMPLETA PARA RENDER

## 📋 O QUE FOI FEITO

Seu bot WhatsApp foi preparado para rodar **24h no Render**! Aqui está o que foi configurado:

### 1️⃣ Arquivos Criados/Atualizados

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| **Procfile** | Config para Render (define o comando start) | ✅ Criado |
| **build.sh** | Script de build automático | ✅ Atualizado |
| **package.json** | Dependências + start script | ✅ Atualizado |
| **.gitignore** | Ignora node_modules e arquivos de auth | ✅ Criado |
| **README.md** | Documentação do projeto | ✅ Atualizado |
| **DEPLOY.md** | Guia passo-a-passo de deploy | ✅ Criado |
| **bot.js** | Bot principal (com PORT dinâmica) | ✅ Otimizado |

### 2️⃣ Principais Mudanças no `bot.js`

```javascript
// ✅ Adicionado variáveis de ambiente
const PORT = process.env.PORT || 3000;

// ✅ Endpoints para Status
GET /status  → Verifica se bot está online
GET /bosses  → Lista bosses
GET /qrcode  → Retorna QR Code pendente

// ✅ Melhor logging do QR Code
if (qr) {
    qrCodeData = qr;
    console.log("📱 QR CODE GERADO!");
    qrcode.generate(qr, { small: true });
}

// ✅ Server escutando PORT dinâmica
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

### 3️⃣ Configuração do `package.json`

```json
{
  "engines": {
    "node": "18.x"  // ✅ Versão Node compatível
  },
  "scripts": {
    "start": "node bot.js"  // ✅ Render vai usar isso
  }
}
```

---

## 🚀 PRÓXIMOS PASSOS

### PASSO 1: Fazer Push para GitHub

```bash
cd bot-whatsapp

# Adicionar e commitar mudanças
git add .
git commit -m "Preparado para Render deployment - Adiciona Procfile, build.sh e otimizações"
git push origin main
```

### PASSO 2: Deploy no Render

1. Acesse: https://render.com
2. Clique em **"+ New"** → **"Web Service"**
3. Selecione seu repositório `bot-whatsapp`
4. Configure:
   - **Name**: `bot-whatsapp` (ou outro nome)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node bot.js`
   - **Plan**: Free (ou Starter se quiser sem hibernação)
5. Clique em **"Create Web Service"**

### PASSO 3: Escanear QR Code

1. Após deploy (leva 2-5 min), vá em **"Logs"**
2. Procure pela mensagem: `📱 QR CODE GERADO!`
3. Você verá um QR Code em ASCII art
4. No seu celular, abra **WhatsApp**
5. **Configurações → Dispositivos vinculados → Vincular um dispositivo**
6. Aponte a câmera para o QR Code (ou se tiver app Render, veja no navegador)
7. Confirme no WhatsApp

### PASSO 4: Verificar se está Online

```bash
# Substituir pela URL do seu Render
curl https://seu-bot.onrender.com/status

# Deve retornar:
# {"status":"online","timestamp":"2026-04-15T...","qrCode":"not_needed"}
```

---

## ⏰ MANTER 24H ONLINE

### Opção 1: Free Plan (com hibernação)
- Hiberna após 15 min sem requisições
- **Solução**: Use um "pinger" externo (pode usar UptimeRobot.com gratuito)

### Opção 2: Starter Plan ($10/mês)
- Sempre online
- Recomendado para uso 24h

---

## 📊 VERIFICAR SAÚDE DO BOT

### Via Terminal
```bash
# Status geral
curl https://seu-bot.onrender.com/status

# Lista de bosses
curl https://seu-bot.onrender.com/bosses

# QR Code (se desvinculado)
curl https://seu-bot.onrender.com/qrcode
```

### Via Dashboard Render
- Vá em: https://dashboard.render.com
- Selecione seu serviço
- Veja: CPU, Memory, Logs em tempo real

---

## 🆘 TROUBLESHOOTING

### ❌ Build falha com erro de dependências
```
Error: Cannot find module '@whiskeysockets/baileys'
```
**Solução**: 
- Verifique `package.json` tem as dependências
- Execute localmente: `npm install`
- Push para GitHub de novo

### ❌ QR Code não aparece nos logs
**Solução**: 
- Bot pode estar já autenticado
- Pasta `auth/` pode estar persistida
- Recrie o serviço no Render

### ❌ Mensagens não chegam nos grupos
**Solução**: 
- Confirme que os IDs de grupo estão corretos em `bot.js`
- `GRUPO_BOSS = "120363426540795167@g.us"`
- `GRUPO_OLY = "120363426376971165@g.us"`

### ❌ Bot desconecta frequentemente
**Solução**: 
- Use Starter Plan (evita hibernação)
- Configure Health Checks no Render
- Restart manual: botão "Restart" na dashboard

---

## 📚 ARQUIVOS DE DOCUMENTAÇÃO

- **[README.md](README.md)** - Documentação geral do bot
- **[DEPLOY.md](DEPLOY.md)** - Guia detalhado de deployment
- **[package.json](package.json)** - Dependências do projeto
- **[Procfile](Procfile)** - Configuração Render
- **[.gitignore](.gitignore)** - Arquivos para ignorar no git

---

## ✨ FEATURES DO BOT

✅ Monitora bosses em tempo real (a cada 2 min)
✅ Mostra ranking de Olympiad
✅ Busca inteligente de mobs
✅ Endpoints REST para API
✅ QR Code display automático
✅ PORT dinâmica (compatível com Render)
✅ Logs detalhados

---

## 🎯 RESUMO

| Etapa | Status | Tempo |
|-------|--------|-------|
| ✅ Preparação local | Completo | - |
| ⏳ Push GitHub | Próximo passo | 1 min |
| ⏳ Deploy Render | Próximo passo | 5 min |
| ⏳ Escanear QR | Próximo passo | 1 min |
| 🎉 Bot 24h Online | Pronto! | - |

---

**Qualquer dúvida, veja [DEPLOY.md](DEPLOY.md) para passo-a-passo mais detalhado!** 🚀
