@echo off
echo.
echo ========================================
echo   ReachFlow - Auto Setup Script
echo ========================================
echo.

set ROOT=%~dp0

echo [1/6] Creating folder structure...

:: Frontend folders
mkdir "%ROOT%frontend\src\app\(auth)\login" 2>nul
mkdir "%ROOT%frontend\src\app\dashboard\advertiser\wallet" 2>nul
mkdir "%ROOT%frontend\src\app\dashboard\promoter" 2>nul
mkdir "%ROOT%frontend\src\app\admin" 2>nul
mkdir "%ROOT%frontend\src\components\layout" 2>nul
mkdir "%ROOT%frontend\src\components\campaigns" 2>nul
mkdir "%ROOT%frontend\src\lib" 2>nul
mkdir "%ROOT%frontend\src\store" 2>nul

:: Backend folders
mkdir "%ROOT%backend\src\routes" 2>nul
mkdir "%ROOT%backend\src\services" 2>nul
mkdir "%ROOT%backend\prisma" 2>nul

echo [2/6] Moving frontend files...

:: Landing page
if exist "%ROOT%page.jsx" move "%ROOT%page.jsx" "%ROOT%frontend\src\app\page.jsx" >nul

:: Auth pages (login page - there may be multiple page files)
:: We need to handle this carefully
if exist "%ROOT%mnt\user-data\outputs\ReachFlow\frontend\src\app\(auth)\login\page.jsx" (
  copy "%ROOT%mnt\user-data\outputs\ReachFlow\frontend\src\app\(auth)\login\page.jsx" "%ROOT%frontend\src\app\(auth)\login\page.jsx" >nul
)

:: Sidebar and TopBar
if exist "%ROOT%Sidebar.jsx" move "%ROOT%Sidebar.jsx" "%ROOT%frontend\src\components\layout\Sidebar.jsx" >nul
if exist "%ROOT%Sidebar" move "%ROOT%Sidebar" "%ROOT%frontend\src\components\layout\Sidebar.jsx" >nul
if exist "%ROOT%TopBar.jsx" move "%ROOT%TopBar.jsx" "%ROOT%frontend\src\components\layout\TopBar.jsx" >nul
if exist "%ROOT%TopBar" move "%ROOT%TopBar" "%ROOT%frontend\src\components\layout\TopBar.jsx" >nul

echo [3/6] Moving backend files...

:: Backend main files
if exist "%ROOT%index.js" move "%ROOT%index.js" "%ROOT%backend\src\index.js" >nul
if exist "%ROOT%payment.js" move "%ROOT%payment.js" "%ROOT%backend\src\routes\payment.js" >nul
if exist "%ROOT%aiService.js" move "%ROOT%aiService.js" "%ROOT%backend\src\services\aiService.js" >nul
if exist "%ROOT%schema.prisma" move "%ROOT%schema.prisma" "%ROOT%backend\prisma\schema.prisma" >nul

echo [4/6] Creating config files...

:: Frontend .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:4000 > "%ROOT%frontend\.env.local"
echo NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key_here >> "%ROOT%frontend\.env.local"

:: Frontend package.json
echo { > "%ROOT%frontend\package.json"
echo   "name": "reachflow-frontend", >> "%ROOT%frontend\package.json"
echo   "version": "1.0.0", >> "%ROOT%frontend\package.json"
echo   "scripts": { >> "%ROOT%frontend\package.json"
echo     "dev": "next dev", >> "%ROOT%frontend\package.json"
echo     "build": "next build", >> "%ROOT%frontend\package.json"
echo     "start": "next start" >> "%ROOT%frontend\package.json"
echo   }, >> "%ROOT%frontend\package.json"
echo   "dependencies": { >> "%ROOT%frontend\package.json"
echo     "next": "14.0.4", >> "%ROOT%frontend\package.json"
echo     "react": "^18.2.0", >> "%ROOT%frontend\package.json"
echo     "react-dom": "^18.2.0", >> "%ROOT%frontend\package.json"
echo     "axios": "^1.6.0", >> "%ROOT%frontend\package.json"
echo     "@tanstack/react-query": "^5.0.0", >> "%ROOT%frontend\package.json"
echo     "zustand": "^4.4.7", >> "%ROOT%frontend\package.json"
echo     "framer-motion": "^10.16.0", >> "%ROOT%frontend\package.json"
echo     "recharts": "^2.10.0", >> "%ROOT%frontend\package.json"
echo     "@stripe/stripe-js": "^2.2.0", >> "%ROOT%frontend\package.json"
echo     "@stripe/react-stripe-js": "^2.4.0", >> "%ROOT%frontend\package.json"
echo     "socket.io-client": "^4.6.1", >> "%ROOT%frontend\package.json"
echo     "react-hot-toast": "^2.4.1", >> "%ROOT%frontend\package.json"
echo     "react-hook-form": "^7.49.0", >> "%ROOT%frontend\package.json"
echo     "zod": "^3.22.4", >> "%ROOT%frontend\package.json"
echo     "@hookform/resolvers": "^3.3.2", >> "%ROOT%frontend\package.json"
echo     "date-fns": "^3.0.0", >> "%ROOT%frontend\package.json"
echo     "lucide-react": "^0.300.0", >> "%ROOT%frontend\package.json"
echo     "clsx": "^2.0.0" >> "%ROOT%frontend\package.json"
echo   } >> "%ROOT%frontend\package.json"
echo } >> "%ROOT%frontend\package.json"

:: Tailwind config
echo /** @type {import('tailwindcss').Config} */ > "%ROOT%frontend\tailwind.config.js"
echo module.exports = { >> "%ROOT%frontend\tailwind.config.js"
echo   content: ['./src/**/*.{js,jsx,ts,tsx}'], >> "%ROOT%frontend\tailwind.config.js"
echo   theme: { extend: {} }, >> "%ROOT%frontend\tailwind.config.js"
echo   plugins: [], >> "%ROOT%frontend\tailwind.config.js"
echo } >> "%ROOT%frontend\tailwind.config.js"

:: globals.css
echo @tailwind base; > "%ROOT%frontend\src\app\globals.css"
echo @tailwind components; >> "%ROOT%frontend\src\app\globals.css"
echo @tailwind utilities; >> "%ROOT%frontend\src\app\globals.css"

:: Backend .env
if exist "%ROOT%.env.example" move "%ROOT%.env.example" "%ROOT%backend\.env.example" >nul
copy "%ROOT%backend\.env.example" "%ROOT%backend\.env" >nul 2>&1

echo [5/6] Moving deployment docs...
if exist "%ROOT%DEPLOYMENT.md" move "%ROOT%DEPLOYMENT.md" "%ROOT%DEPLOYMENT.md" >nul

echo [6/6] Done!
echo.
echo ========================================
echo   Setup Complete! 
echo ========================================
echo.
echo Next steps:
echo.
echo   1. Open VS Code in this folder
echo   2. Open terminal and run:
echo.
echo      cd backend
echo      npm install
echo.
echo      cd ../frontend  
echo      npm install
echo      npm run dev
echo.
echo   3. Open http://localhost:3000
echo.
echo ========================================
pause
