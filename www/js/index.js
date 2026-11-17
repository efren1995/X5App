let radarActive = false;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    logMessage('[CORDOVA] Device ready initialized.');
}

function toggleRadar() {
    const radarUI = document.getElementById('radarDisplay');
    const statusText = document.getElementById('radarStatus');
    
    radarActive = !radarActive;
    if (radarActive) {
        radarUI.style.display = 'block';
        statusText.innerText = 'Status: SCANNING (25m)';
        logMessage('[RADAR] 25m proximity scanner engaged.');
    } else {
        radarUI.style.display = 'none';
        statusText.innerText = 'Status: TAP TO ACTIVATE';
        logMessage('[RADAR] Scanner disengaged.');
    }
}

function triggerModule(name) {
    logMessage('[MODULE_EXEC] Engaging tactical subsystem: ' + name);
}

function logMessage(msg) {
    const term = document.getElementById('terminalLog');
    const time = new Date().toLocaleTimeString();
    term.innerHTML += `<br>[${time}] ${msg}`;
    term.scrollTop = term.scrollHeight;
}
