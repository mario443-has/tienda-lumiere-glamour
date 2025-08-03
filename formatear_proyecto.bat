@echo off
setlocal

echo ================================
echo 🔧 Activando entorno virtual...
call env\Scripts\activate
if %ERRORLEVEL% neq 0 (
  echo ❌ No se pudo activar el entorno virtual.
  goto :error
)

echo ================================
echo 🐍 Formateando archivos Python con Black...
black .
if %ERRORLEVEL% neq 0 (
  echo ❌ Error: Black encontró errores de sintaxis. Deteniendo.
  goto :error
)

echo ================================
echo 📦 Ordenando imports con isort...
isort .
if %ERRORLEVEL% neq 0 (
  echo ❌ Error: isort falló. Deteniendo.
  goto :error
)

echo ================================
echo 🧾 Haciendo backup de templates HTML (*.html)...
xcopy /S /Y /I /Q store\templates store\templates_backup
if %ERRORLEVEL% neq 0 (
  echo ⚠️ Advertencia: No se pudo hacer backup de templates.
)

echo ================================
echo 🔍 Verificando templates HTML con Djlint...
djlint . --check
if %ERRORLEVEL% neq 0 (
  echo ⚠️ Djlint encontró errores de estilo, intentando formatear...
  djlint . --reformat --quiet
  if %ERRORLEVEL% neq 0 (
    echo ❌ Error al intentar formatear los templates con Djlint.
    goto :error
  ) else (
    echo ✅ Templates corregidos exitosamente.
  )
) else (
  echo ✅ Templates verificados, sin errores de estilo.
)

echo ================================
echo ✅ ¡Proyecto limpio y seguro! Código y templates organizados.
goto :end

:error
echo ⚠️ El proceso se detuvo debido a un error. Revisa los mensajes anteriores.

:end
pause
