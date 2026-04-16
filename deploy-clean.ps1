# Script PowerShell para limpar auth e fazer push otimizado

Write-Host "🧹 Limpando pasta auth/ (mantendo apenas essencial)..." -ForegroundColor Cyan

cd 'C:\Users\Adalberto\Desktop\bot-whatsapp\bot-whatsapp-main'

# 1. Manter apenas os arquivos essenciais de auth
# creds.json - credencial principal
# app-state-sync-* - estado de sincronização

Write-Host "📊 Arquivos antes: $($(Get-ChildItem auth/ | Measure-Object).Count)" -ForegroundColor Yellow

# Removar device-list antigos (manter apenas 5 mais recentes)
$deviceLists = Get-ChildItem auth/ -Filter "device-list-*.json" | Sort-Object LastWriteTime -Descending
$toDelete = $deviceLists | Select-Object -Skip 5

Write-Host "🗑️  Removendo device-list antigos..." -ForegroundColor Yellow
$toDelete | ForEach-Object { 
    Remove-Item $_.FullName -Force
    Write-Host "  Deletado: $($_.Name)"
}

# 2. Remover auth/ do .gitignore
Write-Host "`n📝 Removendo auth/ do .gitignore..." -ForegroundColor Yellow
$gitignore = @()
Get-Content '.gitignore' | ForEach-Object {
    if ($_ -notlike '*auth*' -and $_ -ne "") {
        $gitignore += $_
    }
}
$gitignore | Out-File -Encoding UTF8 '.gitignore'

# 3. Adicionar arquivos
Write-Host "`n📦 Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .

# 4. Status
Write-Host "`n📋 Status do Git:" -ForegroundColor Yellow
git status --short

# 5. Commit
Write-Host "`n💾 Fazendo commit..." -ForegroundColor Yellow
$commitMsg = "Deploy Render: Bot + Auth core files (cleaned) + Procfile + build scripts"
git commit -m $commitMsg

# 6. Push
Write-Host "`n🌐 Enviando para GitHub..." -ForegroundColor Cyan
Write-Host "⏳ Isso pode levar alguns minutos..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    $finalCount = $(Get-ChildItem auth/ | Measure-Object).Count
    Write-Host "`n✅ Push completado com sucesso!" -ForegroundColor Green
    Write-Host "`n📊 Estatísticas:" -ForegroundColor Cyan
    Write-Host "  - Arquivos de auth após limpeza: $finalCount"
    Write-Host "  - Total de arquivos no projeto: $($(Get-ChildItem -Recurse -File | Measure-Object).Count)"
    Write-Host "`n🚀 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Acesse: https://render.com"
    Write-Host "  2. New → Web Service"
    Write-Host "  3. Conecte seu repositório GitHub"
    Write-Host "  4. Configure:"
    Write-Host "     - Build Command: npm install"
    Write-Host "     - Start Command: node bot.js"
    Write-Host "  5. Create Web Service"
    Write-Host "`n📱 Após deploy, escaneie o QR Code nos logs!"
} else {
    Write-Host "`n"
}
