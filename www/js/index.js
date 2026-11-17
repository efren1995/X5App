let radarActive = false;

document.addEventListener('deviceready', () => {
    logCmd('CORDOVA', 'Hardware bridge initialized.');
}, false);

function openTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
    logCmd('UI', 'Switched view -> ' + btnElement.innerText);
}

function toggleRadar() {
    const radarUI = document.getElementById('radarDisplay');
    const btn = document.getElementById('radarBtn');
    radarActive = !radarActive;
    
    if (radarActive) {
        radarUI.classList.add('scanning');
        btn.innerText = 'STOP';
        logCmd('RADAR', 'Active sweep engaged (25m radius).');
    } else {
        radarUI.classList.remove('scanning');
        btn.innerText = 'ACTIVATE';
        logCmd('RADAR', 'Sweep halted.');
    }
}

function runDucky() {
    const lines = document.getElementById('duckyScript').value.split('\n').filter(l => l.trim() !== '');
    logCmd('HID', `Queued ${lines.length} DuckyScript instructions for USB-OTG injection.`);
}

function execQuickCmd(command) {
    const input = document.getElementById('ipcInput');
    input.value = command;
    sendBridgeCmd();
}

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
            if (line.trim()) logCmd('IPC_RES', line);
        });
    })
    .catch(() => {
        logCmd('IPC_ERR', 'Connection refused. Run: python3 bridge_daemon.py &');
    });
}

function logCmd(tag, msg) {
    const term = document.getElementById('terminalLog');
    const time = new Date().toLocaleTimeString([], { hour12: false });
    term.innerHTML += `<br>[${time}] [${tag}] ${msg}`;
    term.scrollTop = term.scrollHeight;
}
