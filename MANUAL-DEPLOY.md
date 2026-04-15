# 🔧 DEPLOY MANUAL PASSO-A-PASSO

## ❌ PROBLEMA IDENTIFICADO
- Git não está instalado ou não está no PATH
- Pasta não é um repositório Git ainda

---

## ✅ SOLUÇÃO 1: Instalar Git (Recomendado)

### Para Windows:

1. **Baixar Git:**
   - Acesse: https://git-scm.com/download/win
   - Download a versão 64-bit

2. **Instalar:**
   - Execute o instalador
   - Deixe as opções padrão
   - Marque: "Use Git from Windows Command Prompt"

3. **Verificar instalação:**
   ```
   git --version
   ```

---

## ✅ SOLUÇÃO 2: Inicializar repositório Git

Após instalar Git, execute estes comandos:

### Abra: Git Bash ou Windows Terminal

```bash
# 1. Navegue para a pasta
cd Desktop/bot-whatsapp/bot-whatsapp-main

# 2. Inicializar git
git init

# 3. Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/bot-whatsapp.git

# 4. Configurar usuário git
git config user.email "seu@email.com"
git config user.name "Seu Nome"

# 5. Remover auth do .gitignore
# Abra o arquivo .gitignore e remova a linha "auth/"
# Ou execute:
(Get-Content .gitignore | Select-String -NotMatch "auth" | Out-String).Trim() | Out-File .gitignore

# 6. Adicionar todos os arquivos
git add .

# 7. Fazer commit
git commit -m "Bot WhatsApp com Auth - Pronto para Render"

# 8. Push
git branch -M main
git push -u origin main
```

---

## ⚠️ SE JÁ CLONOU DO GITHUB

Se você já tem um repositório clonado do GitHub, execute:

```bash
# 1. Entrar na pasta
cd Desktop/bot-whatsapp/bot-whatsapp-main

# 2. Verificar remote
git remote -v
# Deve mostrar: origin https://github.com/Kronah/bot-whatsapp.git

# 3. Remover auth do .gitignore
# Abra e remova a linha "auth/"

# 4. Adicionar mudanças
git add .

# 5. Commit
git commit -m "Preparado para Render: Procfile + Scripts + Auth core"

# 6. Push
git push origin main
```

---

## 📝 OPÇÃO 3: Fazer Upload Manual via GitHub Web

Se Git continuar problemático:

1. **Abra:** https://github.com/Kronah/bot-whatsapp
2. **Clique em:** "+ Add file" → "Upload files"
3. **Selecione:**
   - Procfile
   - package.json
   - build.sh
   - bot.js
   - README.md
   - DEPLOY.md
   - Toda pasta auth/
4. **Clique:** "Commit changes"

---

## ✅ APÓS FAZER PUSH

1. Vá em: https://render.com
2. Create Web Service
3. Selecione seu repositório
4. Configure:
   - Build: npm install
   - Start: node bot.js
5. Deploy!

---

## 🆘 PRECISA DE AJUDA?

Se tiver problema com Git:

- **Git Bash:** Abra o Git Bash do Menu Iniciar
- **Windows Terminal:** Microsoft Store → Windows Terminal
- **Cmd:** Windows + R → cmd

Então execute os comandos acima.

---

**Qual opção você prefere? 1, 2 ou 3?**
