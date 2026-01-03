@echo off
chcp 65001 >nul
echo ========================================
echo   تشغيل موقع إدارة الاشتراكات
echo ========================================
echo.

if not exist "node_modules" (
    echo جاري تثبيت المكتبات لأول مرة...
    echo هذا قد يستغرق دقيقة أو دقيقتين...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ حدث خطأ في التثبيت!
        echo تأكد من تثبيت Node.js من https://nodejs.org
        pause
        exit /b 1
    )
    echo.
    echo ✓ تم التثبيت بنجاح!
    echo.
)

echo جاري تشغيل الموقع...
echo.
echo بعد التشغيل، افتح المتصفح واذهب إلى:
echo http://localhost:5173
echo.
echo لإيقاف المشروع: اضغط Ctrl + C
echo.
echo ========================================
echo.

call npm run dev

pause

