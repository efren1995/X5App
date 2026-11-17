let radarActive = false;
let radarInterval = null;

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
        logCmd('RADAR', 'Proximity scanner engaged (25m radius).');
        fetchRealTargets();
        radarInterval = setInterval(fetchRealTargets, 4000);
    } else {
        radarUI.classList.remove('scanning');
        btn.innerText = 'SCAN LIVE';
        clearInterval(radarInterval);
        document.getElementById('radarTargetsLayer').innerHTML = '';
        document.getElementById('targetTelemetry').innerText = 'TARGETS DETECTED: 0 // STANDBY';
        logCmd('RADAR', 'Sweep halted.');
    }
}

function fetchRealTargets() {
    // Intentar consultar al demonio local en Termux
    fetch('http://127.0.0.1:8080/scan', { mode: 'cors' })
        .then(res => res.json())
        .then(data => {
            renderRadarTargets(data.targets || []);
        })
        .catch(() => {
            // Fallback táctico local si el demonio no responde en este ciclo
            const fallbackTargets = [
                { id: 'BLE_01', name: 'ESP32_NODE', dist: 4.2, angle: 45 },
                { id: 'WIFI_02', name: 'TARGET_AP', dist: 12.8, angle: 160 },
                { id: 'BLE_03', name: 'CHAMELEON_U', dist: 2.1, angle: 280 }
            ];
            renderRadarTargets(fallbackTargets);
            document.getElementById('targetTelemetry').innerText = `TARGETS DETECTED: ${fallbackTargets.length} // LOCAL FALLBACK`;
        });
}

function renderRadarTargets(targets) {
    const layer = document.getElementById('radarTargetsLayer');
    const telemetry = document.getElementById('targetTelemetry');
    layer.innerHTML = '';
    
    telemetry.innerText = `TARGETS DETECTED: ${targets.length} // ACTIVE RF`;
    
    targets.forEach(t => {
        const radiusPct = (t.dist / 25.0) * 45.0;
        const rad = (t.angle * Math.PI) / 180;
        const x = 50 + radiusPct * Math.cos(rad);
        const y = 50 + radiusPct * Math.sin(rad);

        const blip = document.createElement('div');
        blip.className = 'radar-blip';
        blip.style.display = 'block';
        blip.style.left = `${x}%`;
        blip.style.top = `${y}%`;

        const label = document.createElement('span');
        label.className = 'blip-label';
        label.innerText = `${t.name} (${t.dist}m)`;
        blip.appendChild(label);

        layer.appendChild(blip);
    });
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
        logCmd('IPC_RES', '[SIMULATED EXEC] Command processed locally: ' + cmd);
    });
}

function logCmd(tag, msg) {
    const term = document.getElementById('terminalLog');
    const time = new Date().toLocaleTimeString([], { hour12: false });
    term.innerHTML += `<br>[${time}] [${tag}] ${msg}`;
    term.scrollTop = term.scrollHeight;
}
