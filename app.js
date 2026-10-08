/**
 * Yerli Milli Hesap - Main Application Script (app.js)
 */

// Core Calculator Engine
class Calculator {
    constructor(mainDisplayElem, expressionDisplayElem, historyListElem) {
        this.mainDisplayElem = mainDisplayElem;
        this.expressionDisplayElem = expressionDisplayElem;
        this.historyListElem = historyListElem;
        
        this.history = JSON.parse(localStorage.getItem('calc_history') || '[]');
        this.resetAll();
        this.renderHistory();
    }

    resetAll() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
        this.updateDisplay();
    }

    clear() {
        this.resetAll();
    }

    delete() {
        if (this.shouldResetScreen) return;
        if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
        this.updateDisplay();
    }

    appendNumber(number) {
        if (this.currentOperand === '0' || this.shouldResetScreen) {
            this.currentOperand = number;
            this.shouldResetScreen = false;
        } else {
            if (this.currentOperand.replace('.', '').length >= 12) return;
            this.currentOperand += number;
        }
        this.updateDisplay();
    }

    appendDecimal() {
        if (this.shouldResetScreen) {
            this.currentOperand = '0.';
            this.shouldResetScreen = false;
        } else if (!this.currentOperand.includes('.')) {
            this.currentOperand += '.';
        }
        this.updateDisplay();
    }

    negate() {
        if (this.currentOperand === '0') return;
        if (this.currentOperand.startsWith('-')) {
            this.currentOperand = this.currentOperand.slice(1);
        } else {
            this.currentOperand = '-' + this.currentOperand;
        }
        this.updateDisplay();
    }

    percentage() {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;
        this.currentOperand = (current / 100).toString();
        this.updateDisplay();
    }

    chooseOperation(op) {
        if (this.currentOperand === '' && this.previousOperand === '') return;

        if (this.previousOperand !== '' && !this.shouldResetScreen) {
            this.compute();
        } else {
            this.previousOperand = this.currentOperand;
        }

        this.operation = op;
        this.shouldResetScreen = true;
        this.updateDisplay();
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                if (current === 0) {
                    this.handleError("Sıfıra bölünemez");
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        const fullExpr = `${this.formatDisplayNumber(prev)} ${this.getSymbol(this.operation)} ${this.formatDisplayNumber(current)}`;
        const result = Math.round(computation * 1e10) / 1e10;
        
        this.addHistoryEntry(fullExpr, result.toString());

        this.currentOperand = result.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
        this.updateDisplay();
    }

    handleError(msg) {
        this.mainDisplayElem.innerText = msg;
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = true;
    }

    getSymbol(op) {
        switch(op) {
            case '*': return '×';
            case '/': return '÷';
            case '-': return '−';
            default: return op;
        }
    }

    formatDisplayNumber(numberStr) {
        if (!numberStr && numberStr !== 0) return '';
        const str = numberStr.toString();
        const split = str.split('.');
        const integerDigits = parseFloat(split[0]);
        const decimalDigits = split[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
        }

        if (decimalDigits != null) {
            return `${integerDisplay},${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.mainDisplayElem.innerText = this.formatDisplayNumber(this.currentOperand) || '0';
        
        if (this.operation != null) {
            this.expressionDisplayElem.innerText = `${this.formatDisplayNumber(this.previousOperand)} ${this.getSymbol(this.operation)}`;
        } else {
            this.expressionDisplayElem.innerText = '';
        }
    }

    addHistoryEntry(expression, result) {
        const item = {
            id: Date.now(),
            expression: expression,
            result: result
        };
        this.history.unshift(item);
        if (this.history.length > 30) this.history.pop();
        localStorage.setItem('calc_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calc_history');
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyListElem.innerHTML = `<div class="text-center text-slate-500 my-10 text-sm">Henüz işlem yapılmadı</div>`;
            return;
        }

        this.historyListElem.innerHTML = this.history.map(item => `
            <div data-result="${item.result}" class="history-item bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl cursor-pointer border border-slate-700/50 transition-all">
                <div class="text-xs text-slate-400 font-mono-calc text-right">${item.expression} =</div>
                <div class="text-lg text-sky-400 font-mono-calc font-semibold text-right">${this.formatDisplayNumber(item.result)}</div>
            </div>
        `).join('');

        this.historyListElem.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                this.currentOperand = el.getAttribute('data-result');
                this.shouldResetScreen = false;
                this.updateDisplay();
                toggleHistoryPanel(false);
            });
        });
    }
}

// Global Variables & Initialization
let calculator;

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mainDisplay = document.getElementById('main-display');
    const expressionDisplay = document.getElementById('expression-display');
    const historyList = document.getElementById('history-list');
    const historyPanel = document.getElementById('history-panel');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const closeHistoryBtn = document.getElementById('close-history');
    const clearHistoryBtn = document.getElementById('clear-history');
    const themeSelect = document.getElementById('theme-select');
    const modeSelect = document.getElementById('mode-select');
    const calcSection = document.getElementById('calc-section');
    const converterSection = document.getElementById('converter-section');
    
    // Audio Elements
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('toggle-music');
    const musicIcon = document.getElementById('music-icon');

    // Instantiate Calculator
    calculator = new Calculator(mainDisplay, expressionDisplay, historyList);

    // Theme Switcher Logic
    const savedTheme = localStorage.getItem('calc_theme') || 'dark';
    document.body.className = `${savedTheme}-theme min-h-screen flex items-center justify-center p-4 sm:p-6 select-none font-sans`;
    if (themeSelect) themeSelect.value = savedTheme;

    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            document.body.className = `${selectedTheme}-theme min-h-screen flex items-center justify-center p-4 sm:p-6 select-none font-sans`;
            localStorage.setItem('calc_theme', selectedTheme);
        });
    }

    // Mode Switcher Logic (Calculator vs Converters)
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            if (mode === 'calc') {
                calcSection.classList.remove('hidden');
                converterSection.classList.add('hidden');
            } else {
                calcSection.classList.add('hidden');
                converterSection.classList.remove('hidden');
                initConverterMode(mode);
            }
        });
    }

    // Unit Converter Conversion Rates & Data
    const convertUnits = {
        length: {
            m: 1,
            km: 1000,
            cm: 0.01,
            mm: 0.001,
            ft: 0.3048,
            in: 0.0254,
            mi: 1609.34,
            yd: 0.9144
        },
        weight: {
            kg: 1,
            g: 0.001,
            mg: 0.000001,
            lb: 0.453592,
            oz: 0.0283495
        }
    };

    const unitOptions = {
        length: [
            { v: 'm', label: 'Metre (m)' },
            { v: 'km', label: 'Kilometre (km)' },
            { v: 'cm', label: 'Santimetre (cm)' },
            { v: 'mm', label: 'Milimetre (mm)' },
            { v: 'ft', label: 'Ayak / Foot (ft)' },
            { v: 'in', label: 'İnç (in)' },
            { v: 'mi', label: 'Mil (mi)' },
            { v: 'yd', label: 'Yarda (yd)' }
        ],
        weight: [
            { v: 'kg', label: 'Kilogram (kg)' },
            { v: 'g', label: 'Gram (g)' },
            { v: 'mg', label: 'Miligram (mg)' },
            { v: 'lb', label: 'Libre / Pound (lb)' },
            { v: 'oz', label: 'Ons (oz)' }
        ],
        temp: [
            { v: 'c', label: 'Santigrat (°C)' },
            { v: 'f', label: 'Fahrenhayt (°F)' },
            { v: 'k', label: 'Kelvin (K)' }
        ]
    };

    function initConverterMode(mode) {
        const fromUnitSelect = document.getElementById('converter-from-unit');
        const toUnitSelect = document.getElementById('converter-to-unit');
        
        const options = unitOptions[mode] || [];
        fromUnitSelect.innerHTML = options.map(o => `<option value="${o.v}">${o.label}</option>`).join('');
        toUnitSelect.innerHTML = options.map((o, idx) => `<option value="${o.v}" ${idx === 1 ? 'selected' : ''}>${o.label}</option>`).join('');
        
        document.getElementById('converter-input').value = '1';
        calculateConversion();
    }

    function calculateConversion() {
        const mode = modeSelect.value;
        const val = parseFloat(document.getElementById('converter-input').value);
        const from = document.getElementById('converter-from-unit').value;
        const to = document.getElementById('converter-to-unit').value;
        const resultElem = document.getElementById('converter-result');

        if (isNaN(val)) {
            resultElem.innerText = '0';
            return;
        }

        let res = 0;
        if (mode === 'temp') {
            res = convertTemperature(val, from, to);
        } else {
            const baseValue = val * convertUnits[mode][from];
            res = baseValue / convertUnits[mode][to];
        }

        resultElem.innerText = Math.round(res * 1e6) / 1e6;
    }

    function convertTemperature(val, from, to) {
        if (from === to) return val;
        let celsius = val;
        if (from === 'f') celsius = (val - 32) * (5/9);
        if (from === 'k') celsius = val - 273.15;

        if (to === 'c') return celsius;
        if (to === 'f') return (celsius * (9/5)) + 32;
        if (to === 'k') return celsius + 273.15;
    }

    // Converter Event Listeners
    document.getElementById('converter-input').addEventListener('input', calculateConversion);
    document.getElementById('converter-from-unit').addEventListener('change', calculateConversion);
    document.getElementById('converter-to-unit').addEventListener('change', calculateConversion);

    // Audio Autoplay & Controls
    let isPlaying = false;
    
    function tryPlayMusic() {
        if (bgMusic) {
            bgMusic.play().then(() => {
                isPlaying = true;
                updateMusicUI(true);
            }).catch(e => {
                isPlaying = false;
                updateMusicUI(false);
            });
        }
    }

    function updateMusicUI(active) {
        if (!musicIcon) return;
        if (active) {
            musicIcon.className = 'fa-solid fa-music text-emerald-400 animate-pulse';
            musicBtn.title = 'Müziği Durdur';
        } else {
            musicIcon.className = 'fa-solid fa-volume-xmark text-slate-400';
            musicBtn.title = 'Müziği Başlat';
        }
    }

    if (musicBtn && bgMusic) {
        musicBtn.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                isPlaying = false;
                updateMusicUI(false);
            } else {
                bgMusic.play();
                isPlaying = true;
                updateMusicUI(true);
            }
        });
    }

    // Fallback: Start music on user interaction if autoplay was blocked
    const enableAudioOnInteraction = () => {
        if (!isPlaying && bgMusic) {
            tryPlayMusic();
        }
        window.removeEventListener('click', enableAudioOnInteraction);
        window.removeEventListener('keydown', enableAudioOnInteraction);
    };
    window.addEventListener('click', enableAudioOnInteraction);
    window.addEventListener('keydown', enableAudioOnInteraction);

    // Auto-attempt playback on load
    tryPlayMusic();

    // Toggle History panel state
    function toggleHistoryPanel(show) {
        if (show === undefined) {
            historyPanel.classList.toggle('closed');
        } else if (show) {
            historyPanel.classList.remove('closed');
        } else {
            historyPanel.classList.add('closed');
        }
    }

    if (toggleHistoryBtn) toggleHistoryBtn.addEventListener('click', () => toggleHistoryPanel());
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => calculator.clearHistory());

    // Button Keypad Listeners
    document.querySelectorAll('button[data-number]').forEach(button => {
        button.addEventListener('click', () => {
            calculator.appendNumber(button.getAttribute('data-number'));
        });
    });

    document.querySelectorAll('button[data-operator]').forEach(button => {
        button.addEventListener('click', () => {
            calculator.chooseOperation(button.getAttribute('data-operator'));
        });
    });

    document.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            switch (action) {
                case 'clear':
                    calculator.clear();
                    break;
                case 'delete':
                    calculator.delete();
                    break;
                case 'decimal':
                    calculator.appendDecimal();
                    break;
                case 'negate':
                    calculator.negate();
                    break;
                case 'percent':
                    calculator.percentage();
                    break;
                case 'calculate':
                    calculator.compute();
                    break;
            }
        });
    });

    // Keyboard Support
    window.addEventListener('keydown', (e) => {
        if (modeSelect && modeSelect.value !== 'calc') return; // Disable keyboard calc when in converter mode

        if (e.key >= '0' && e.key <= '9') {
            calculator.appendNumber(e.key);
        } else if (e.key === '.' || e.key === ',') {
            calculator.appendDecimal();
        } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            calculator.chooseOperation(e.key);
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            calculator.compute();
        } else if (e.key === 'Backspace') {
            calculator.delete();
        } else if (e.key === 'Escape') {
            calculator.clear();
        } else if (e.key === '%') {
            calculator.percentage();
        }
    });
});