from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import subprocess
import json
import math
import hashlib
import time

# Variables de caché para evitar sobrecargar la antena Wi-Fi y ahorrar batería
_cached_targets = []
_last_scan_time = 0
CACHE_TTL = 4.0  # Segundos de validez para la caché de escaneo

def rssi_to_meters(rssi):
    try:
        rssi = float(rssi)
        dist = 10 ** ((-55.0 - rssi) / (10.0 * 2.5))
        return round(min(max(dist, 0.5), 25.0), 1)
    except:
        return 12.5

def get_angle_from_mac(mac):
    h = int(hashlib.md5(mac.encode()).hexdigest()[:4], 16)
    return h % 360

def scan_real_targets():
    global _cached_targets, _last_scan_time
    now = time.time()
    if now - _last_scan_time < CACHE_TTL:
        return _cached_targets

    targets = []
    # Escaneo Wi-Fi optimizado con timeout estricto de 2.5s
    try:
        res = subprocess.run(["termux-wifi-scaninfo"], capture_output=True, text=True, timeout=2.5)
        if res.returncode == 0 and res.stdout.strip():
            wifi_list = json.loads(res.stdout)
            for item in wifi_list:
                bssid = item.get("bssid", "00:00:00:00:00:00")
                ssid = item.get("ssid", "") or "[HIDDEN_NODE]"
                rssi = item.get("rssi", -75)
                dist = rssi_to_meters(rssi)
                if dist <= 25.0:
                    targets.append({
                        "id": bssid,
                        "name": ssid[:14],
                        "type": "WIFI",
                        "rssi": rssi,
                        "dist": dist,
                        "angle": get_angle_from_mac(bssid)
                    })
    except Exception:
        pass

    # Fallback ARP local si no hay datos Wi-Fi
    if not targets:
        try:
            res = subprocess.run(["ip", "neigh"], capture_output=True, text=True, timeout=1.5)
            for idx, line in enumerate(res.stdout.splitlines()):
                parts = line.split()
                if len(parts) >= 5 and "FAILED" not in line:
                    ip_addr = parts[0]
                    mac = parts[4]
                    targets.append({
                        "id": mac,
                        "name": f"NET:{ip_addr.split('.')[-1]}",
                        "type": "LAN",
                        "rssi": -60 - (idx * 4),
                        "dist": round(min(3.5 + (idx * 2.8), 24.0), 1),
                        "angle": get_angle_from_mac(mac)
                    })
        except Exception:
            pass

    _cached_targets = targets
    _last_scan_time = now
    return targets

class BridgeHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        if self.path == '/scan':
            targets = scan_real_targets()
            self._set_headers(200)
            self.wfile.write(json.dumps({'targets': targets}).encode('utf-8'))
        else:
            self._set_headers(404)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            command = data.get('cmd', '')
            
            if not command:
                self._set_headers(400)
                self.wfile.write(json.dumps({'output': 'Error: Empty command'}).encode('utf-8'))
                return

            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=15)
            output = result.stdout if result.returncode == 0 else result.stderr
            if not output.strip():
                output = "[INFO] Command executed successfully."
        except Exception as e:
            output = f"[ERROR] Execution failed: {str(e)}"
            
        self._set_headers(200)
        self.wfile.write(json.dumps({'output': output}).encode('utf-8'))

    def log_message(self, format, *args):
        # Silenciar logs en consola para ahorrar recursos de E/S y batería
        return

print("[OPTIMIZED_DAEMON] Low-power IPC server listening on 127.0.0.1:8080...")
server = ThreadingHTTPServer(('127.0.0.1', 8080), BridgeHandler)
server.serve_forever()
