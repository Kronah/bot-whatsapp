# 🤖 Bot WhatsApp Modular

## 📁 Estrutura

```
bot-termux/
├── bot.js          # Arquivo principal
├── package.json    # Dependências
├── config.json     # Configuração (admin, grupos)
├── commands/       # Comandos modulares
│   ├── mob.js
│   ├── bosslive.js
│   ├── oly.js
│   ├── addbot.js
│   ├── rmbot.js
│   ├── adm.js
│   └── reload.js
└── utils/          # Utilitários
    ├── config.js   # Gerenciar config
    ├── scraper.js  # Buscar dados
    └── db.js       # Base de dados
```

## 🚀 Como Usar

### 1. Instalar dependências

```bash
cd bot-termux
npm install
```

### 2. Configurar

Edite `config.json` e coloque seu número:

```json
{
  "admin": "5511987654321",
  "grupos": {}
}
```

### 3. Iniciar

```bash
npm start
```

Acesse: `http://localhost:8080`

## 📱 Comandos

### Usuários normais:
- `.antharas` - Buscar mob
- `.bosslive` - Ver bosses online
- `.oly` - Ver ranking OLY

### Admin (protegido):
- `.addbot` - Cadastrar grupo
- `.rmbot` - Remover grupo
- `.adm id` - Pegar ID do grupo
- `.reload` - Recarregar bot

## 🔧 Adicionar novo comando

Crie um arquivo em `commands/seu-comando.js`:

```javascript
module.exports = {
    name: 'seu-comando',
    run: async (sock, msg, args, numero, from) => {
        return '✅ Funcionou!';
    }
};
```

O bot carrega automaticamente!
