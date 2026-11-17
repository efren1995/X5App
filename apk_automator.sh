#!/bin/bash
echo "[APK_AUTOMATOR] Starting package inspection routine..."

# Listar paquetes de usuario instalados
echo "--- Installed User Packages ---"
pm list packages -3

# Ejemplo de extracción si se especifica un paquete
if [ ! -z "$1" ]; then
    PKG_PATH=$(pm path $1 | grep package | cut -d':' -f2)
    if [ ! -z "$PKG_PATH" ]; then
        echo "[+] Found package at: $PKG_PATH"
        cp "$PKG_PATH" ./extracted_target.apk
        echo "[+] Copied base.apk to current directory as extracted_target.apk"
    else
        echo "[-] Package $1 not found."
    fi
fi
