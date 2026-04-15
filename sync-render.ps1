# Script PowerShell para enviar bot com auth para GitHub

Write-Host "🚀 Sincronizando bot com GitHub..." -ForegroundColor Cyan

# 1. Verificar se está em um repo git
if (-not (Test-Path '.git')) {
    Write-Host "❌ Não está em um repositório Git!" -ForegroundColor Red
    exit 1
}

# 2. Remover linhas de auth/ do .gitignore
$gitignore = Get-Content '.gitignore'
$gitignore = $gitignore | Where-Object { $_ -notlike '*auth*' }
$gitignore | Out-File -Encoding UTF8 '.gitignore'

# 3. Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos..." -ForegroundColor Yellow
git add .

# 4. Verificar status
Write-Host "`n📋 Status:" -ForegroundColor Yellow
git status

# 5. Commit
Write-Host "`n💾 Fazendo commit..." -ForegroundColor Yellow
git commit -m "Bot + Auth files - Ready for Render 24h"

# 6. Push
Write-Host "`n🌐 Enviando para GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push completado com sucesso!" -ForegroundColor Green
    Write-Host "`n📱 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://render.com"
    Write-Host "2. Create Web Service"
    Write-Host "3. Conecte seu repositório"
    Write-Host "4. Build Command: npm install"
    Write-Host "5. Start Command: node bot.js"
} else {
    Write-Host "`n❌ Erro ao fazer push!" -ForegroundColor Red
}
