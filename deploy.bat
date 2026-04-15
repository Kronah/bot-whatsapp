@echo off
cd /d "C:\Users\Adalberto\Desktop\bot-whatsapp\bot-whatsapp-main"

echo.
echo ============================================
echo    BOT WHATSAPP - GITHUB PUSH SCRIPT
echo ============================================
echo.

set GIT="C:\Program Files\Git\bin\git.exe"

echo 1. Git Status
%GIT% status -s | findstr /v "^$" > NUL
if errorlevel 1 (
    echo   Nenhum arquivo modificado localmente
) else (
    %GIT% status -s
)

echo.
echo 2. Tentando Pull do GitHub...
%GIT% pull origin main --allow-unrelated-histories

echo.
echo 3. Fazendo Push para GitHub...
%GIT% push -u origin main

if errorlevel 0 (
    echo.
    echo ✅ SUCESSO! Bot enviado para GitHub!
    echo.
    echo Proximos passos:
    echo 1. Acesse: https://render.com
    echo 2. Create New ^> Web Service
    echo 3. Conecte seu repo GitHub
    echo 4. Build: npm install
    echo 5. Start: node bot.js
    echo 6. Create Web Service
) else (
    echo.
    echo ❌ Erro ao fazer push!
)

echo.
pause
