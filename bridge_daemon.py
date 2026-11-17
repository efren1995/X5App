from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import json

class BridgeHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

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

            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
            output = result.stdout if result.returncode == 0 else result.stderr
            if not output.strip():
                output = "[INFO] Command executed successfully (no stdout)."
        except Exception as e:
            output = f"[ERROR] Execution failed: {str(e)}"
            
        self._set_headers(200)
        self.wfile.write(json.dumps({'output': output}).encode('utf-8'))

    def log_message(self, format, *args):
        return

print("[BRIDGE_DAEMON] IPC server listening on 127.0.0.1:8080 (CORS enabled)...")
HTTPServer(('127.0.0.1', 8080), BridgeHandler).serve_forever()
