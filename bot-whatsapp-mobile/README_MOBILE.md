# 📱 Bot WhatsApp Mobile (Termux)

Versão otimizada do bot para rodar em **Termux no Android** (S20 FE ou outro celular).

## ⚡ Quick Start

```bash
pkg update && pkg install -y git nodejs-lts

git clone https://github.com/Kronah/bot-whatsapp.git
cd bot-whatsapp/bot-whatsapp-mobile

npm install
npm start
```

Pronto! Acesse: `http://localhost:8080/`

---

## 📖 Documentação Completa

Leia os arquivos:
- **TERMUX_SETUP.md** - Instalação passo a passo
- **AUTOAPRENDIZADO.md** - Como ensinar o bot
- **README.md** - Informações gerais

---

## 🎯 Funcionalidades

✅ Gerador de QR Code  
✅ Monitoramento de Bosses  
✅ Ranking OLY  
✅ Sistema de Autoaprendizado  
✅ Keep-Alive automático  
✅ Reconexão inteligente  

---

## 💬 Comandos Disponíveis

### Buscar MOB
```
.barqueata
.hydra
```

### Ensinar
```
.aprenda Barqueata | https://url
```

### Listar aprendizados
```
.aprendizados
```

### Ver Bosses vivos
```
Bosslive
```

### Ranking OLY
```
Oly
/classe_name
```

---

## 🔧 Manter rodando 24/7

### Opção 1: Screen
```bash
screen -S bot -d -m npm start
screen -r bot  # conectar depois
```

### Opção 2: PM2
```bash
npm install -g pm2
pm2 start bot.js
pm2 save
```

### Opção 3: Nohup
```bash
nohup npm start > bot.log 2>&1 &
```

---

## 🌐 Acessar do outro dispositivo

Descobrir IP:
```bash
ifconfig
```

No navegador:
```
http://<IP_DO_CELULAR>:8080/
```

---

## ⚠️ Troubleshooting

**Porta 8080 em uso?**
```bash
npm start PORT=8081
```

**Permissões de arquivo?**
```bash
chmod -R 755 ~
```

**Limpar cache?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Tudo pronto para rodar no seu S20 FE! 🚀**
