/**
 * Yerli Milli Hesap - Enhanced Features Extension (app2.js)
 * Implements: Scientific Calculator Mode, Haptic/Sound Feedback, PWA Registration
 */

// Sound Synthesizer via Web Audio API (No external mp3 assets needed)
class SoundEffects {
    constructor() {
        this.audioCtx = null;
        this.enabled = true;
    }

    initCtx() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playClickSound(freq = 600, duration = 0.04) {
        if (!this.enabled) return;
        try {
            this.initCtx();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            console.error("Sound play error:", e);
        }
    }
}

const sfx = new SoundEffects();

// Haptic Vibration Feedback Function
function triggerHaptic(ms = 25) {
    if ("vibrate" in navigator) {
        try {
            navigator.vibrate(ms);
        } catch (e) {
            // Ignore if vibration permissions are restricted
        }
    }
}

// Extension to Scientific Math Operations
function applyScientificOp(op) {
    if (!calculator) return;
    sfx.playClickSound(700, 0.05);
    triggerHaptic(30);

    let current = parseFloat(calculator.currentOperand);
    if (isNaN(current)) return;

    let res = 0;
    let expr = '';

    switch (op) {
        case 'sin':
            res = Math.sin(current * (Math.PI / 180)); // Degree based sin
            expr = `sin(${current}°)`;
            break;
        case 'cos':
            res = Math.cos(current * (Math.PI / 180));
            expr = `cos(${current}°)`;
            break;
        case 'tan':
            res = Math.tan(current * (Math.PI / 180));
            expr = `tan(${current}°)`;
            break;
        case 'sqrt':
            if (current < 0) {
                calculator.handleError("Geçersiz Girdi");
                return;
            }
            res = Math.sqrt(current);
            expr = `√(${current})`;
            break;
        case 'square':
            res = Math.pow(current, 2);
            expr = `sqr(${current})`;
            break;
        case 'log':
            if (current <= 0) {
                calculator.handleError("Geçersiz Girdi");
                return;
            }
            res = Math.log10(current);
            expr = `log(${current})`;
            break;
        case 'ln':
            if (current <= 0) {
                calculator.handleError("Geçersiz Girdi");
                return;
            }
            res = Math.log(current);
            expr = `ln(${current})`;
            break;
        case 'pi':
            res = Math.PI;
            expr = 'π';
            break;
        case 'e':
            res = Math.E;
            expr = 'e';
            break;
        case 'fact':
            if (current < 0 || !Number.isInteger(current)) {
                calculator.handleError("Sadece Pozitif Tam Sayı");
                return;
            }
            res = factorial(current);
            expr = `${current}!`;
            break;
        default:
            return;
    }

    res = Math.round(res * 1e10) / 1e10;
    calculator.addHistoryEntry(expr, res.toString());
    calculator.currentOperand = res.toString();
    calculator.shouldResetScreen = true;
    calculator.updateDisplay();
}

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// DOM Initialization on Load
document.addEventListener('DOMContentLoaded', () => {

    // 1. Extend Mode Selector Options with Scientific Mode
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
        const sciOption = document.createElement('option');
        sciOption.value = 'scientific';
        sciOption.innerText = '🔬 Bilimsel Mod';
        modeSelect.appendChild(sciOption);

        const originalChange = modeSelect.onchange;
        modeSelect.addEventListener('change', (e) => {
            const sciGrid = document.getElementById('scientific-grid');
            if (e.target.value === 'scientific') {
                document.getElementById('calc-section').classList.remove('hidden');
                document.getElementById('converter-section').classList.add('hidden');
                if (sciGrid) sciGrid.classList.remove('hidden');
            } else {
                if (sciGrid) sciGrid.classList.add('hidden');
            }
        });
    }

    // 2. Attach Haptic & Sound Feedback to All Calculator Buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playClickSound(500, 0.03);
            triggerHaptic(20);
        });
    });

    // 3. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        const swBlob = new Blob([`
            const CACHE_NAME = 'yerli-hesap-v1';
            self.addEventListener('install', (e) => {
                e.waitUntil(
                    caches.open(CACHE_NAME).then((cache) => {
                        return cache.addAll(['./', './index.html', './app.js', './app2.js', './logo.png', './music.mp3']);
                    }).catch(() => {})
                );
            });
            self.addEventListener('fetch', (e) => {
                e.respondWith(
                    caches.match(e.request).then((res) => res || fetch(e.request))
                );
            });
        `], { type: 'text/javascript' });

        const swUrl = URL.createObjectURL(swBlob);
        navigator.serviceWorker.register(swUrl).catch(err => console.log('SW registration skipped:', err));
    }
});