// Conexión real del Bridge hacia el demonio local en Termux (http://127.0.0.1:8080)
function sendBridgeCmd() {
    const input = document.getElementById('ipcInput');
    const cmd = input.value.trim();
    if (!cmd) return;

    logCmd('IPC_REQ', '$ ' + cmd);
    input.value = '';

    fetch('http://127.0.0.1:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: cmd })
    })
    .then(response => response.json())
    .then(data => {
        const lines = data.output.split('\n');
        lines.forEach(line => {
            if(line.trim()) logCmd('IPC_RES', line);
        });
    })
    .catch(error => {
        logCmd('IPC_ERR', 'Bridge connection failed: Is bridge_daemon.py running?');
    });
}
