# Bot WhatsApp Lineage 2 - Render Deployment

Bot automático para monitorar e gerenciar o jogo Lineage 2 via WhatsApp.

## Recursos
- 🐉 Monitora status de bosses online
- 📊 Mostra ranking de Olympiad (OLY)
- 🔍 Busca inteligente de mobs
- ⚡ Funciona 24h no Render

## Instalação Local (Termux/Linux)

```bash
git clone https://github.com/Kronah/bot-whatsapp.git
cd bot-whatsapp
npm install
node bot.js
```

## Deploy no Render

### Pré-requisitos
- Conta GitHub com o repositório
- Conta Render (render.com)

### Passos para Deploy

1. **Fazer push do repositório para GitHub:**
   ```bash
   git add .
   git commit -m "Preparado para Render"
   git push origin main
   ```

2. **No Render:**
   - Vá em: https://render.com
   - Clique em "+ New" → "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Name:** bot-whatsapp
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `node bot.js`
     - **Plan:** Free (ou pago conforme necessário)

3. **Após o deploy:**
   - O Render vai exibir um QR Code nos logs
   - Abra os logs em tempo real
   - Escaneie o QR Code com o WhatsApp

### Monitorar Logs
- Vá em "Logs" na dashboard do Render
- Você verá o QR Code para escanear com WhatsApp

## Estrutura de Pastas

```
bot-whatsapp/
├── bot.js              # Código principal do bot
├── auth/               # Arquivos de autenticação (gerado automaticamente)
├── package.json        # Dependências
├── Procfile            # Configuração para Render/Heroku
├── build.sh            # Script de build
└── README.md           # Este arquivo
```

## Comandos do Bot

### No grupo Boss:
- `.nome_do_mob` - Busca informações do mob
- `Bosslive` - Mostra bosses online
- `OLY` - Ranking de Olympiad
- `OLY [classe]` - Ranking por classe específica

## Troubleshooting

### Bot não inicia no Render
- ✅ Verifique se o `Procfile` existe
- ✅ Verifique se `package.json` tem `"start": "node bot.js"`
- ✅ Veja os logs do Render para erros específicos
- ✅ Certifique-se que PORT está disponível

### "Dependência não encontrada"
```bash
npm install @whiskeysockets/baileys axios cheerio express cors qrcode-terminal
```

### Sessão expira no Render
- A autenticação é persistida na pasta `auth/`
- No Render, use volumes ou storage persistente se necessário
- Alternativamente, re-escaneie o QR Code periodicamente

## Variáveis de Ambiente (Opcional)

Se quiser usar variáveis de ambiente no Render:
1. Vá em "Environment" na dashboard do Render
2. Adicione variáveis conforme necessário

## Licença
MIT
