/* ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================== */
const DEFAULT_HSL = { h: 39, s: 87, l: 60 }; // золотой акцент

function readSavedHSL() {
    try {
        const v = JSON.parse(localStorage.getItem('spatium_glow_hsl'));
        if (v && Number.isFinite(v.h) && Number.isFinite(v.s) && Number.isFinite(v.l)) return v;
    } catch (e) {}
    return { ...DEFAULT_HSL };
}

const RU_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
function parseRuDate(str) {
    const m = String(str).trim().split(/\s+/);
    const idx = RU_MONTHS.indexOf((m[1] || '').toLowerCase().slice(0, 3));
    return new Date(parseInt(m[2], 10), idx < 0 ? 0 : idx, parseInt(m[0], 10) || 1).getTime();
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function stripTags(html) {
    return String(html).replace(/<[^>]*>/g, ' ');
}

/* индекс для поиска, время чтения и теги считаем один раз, а не при каждом запросе */
const WORDS_PER_MIN = 180; // русский текст читается чуть медленнее английского
WIKI_DATA.articles.forEach(a => {
    const text = stripTags(a.content);
    a.tags = Array.isArray(a.tags) ? a.tags.map(String) : [];
    a._search = `${a.title} ${a.subtitle} ${a.tags.join(' ')} ${text}`.toLowerCase();
    a._read = Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / WORDS_PER_MIN));
});

/* кто на кого ссылается (navigateTo('article', 'id') внутри текста) - нужно для «Похожих статей» */
const ARTICLE_LINKS = {};
WIKI_DATA.articles.forEach(a => {
    const out = new Set();
    const re = /navigateTo\(\s*['"]article['"]\s*,\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(a.content))) if (m[1] !== a.id) out.add(m[1]);
    ARTICLE_LINKS[a.id] = out;
});

function articleById(id) {
    return WIKI_DATA.articles.find(a => a.id === id);
}

/* ==================== СИСТЕМА УПРАВЛЕНИЯ ВЕРСИЕЙ ==================== */
function updateVersion() {
    let currentVer = localStorage.getItem('spatium_wiki_version') || '0.0.0';
    let parts = currentVer.split('.').map(n => parseInt(n, 10) || 0);
    while (parts.length < 3) parts.push(0);
    
    parts[2] += 1;
    if (parts[2] >= 10) {
        parts[2] = 0;
        parts[1] += 1;
    }
    if (parts[1] >= 10) {
        parts[1] = 0;
        parts[0] += 1;
    }

    const newVer = `v${parts.join('.')}`;
    localStorage.setItem('spatium_wiki_version', parts.join('.'));

    const versionElem = document.getElementById('sidebarVersion');
    if (versionElem) {
        versionElem.innerText = newVer;
    }
}

/* ==================== ВОСПРОИЗВЕДЕНИЕ ЗВУКА КЛИКА ==================== */
let selectAudio = null;

function playSelectSound() {
    if (!selectAudio) selectAudio = new Audio('sound/wiki_select.mp3');
    selectAudio.currentTime = 0;
    selectAudio.play().catch(() => {});
}

/* ==================== ПУНКТЫ БЕЗОПАСНОГО РЕЖИМА ==================== */
const SAFE_OPTIONS = [
    { id: 'glitch',     name: 'Глитч при переходе в консоль', desc: 'Вместо мигающего глитча — мягкое затемнение' },
    { id: 'consolefx',  name: 'Глитч на кнопке «В консоль»',  desc: 'Без дрожания и мерцания при наведении' },
    { id: 'glowmotion', name: 'Движение свечения',            desc: 'Фоновое свечение почти не двигается' },
    { id: 'glowdim',    name: 'Яркость свечения',             desc: 'Свечение тусклее и размытее' },
    { id: 'loader',     name: 'Анимации загрузки',            desc: 'Спати просто заполняется вместо сценок' },
    { id: 'navicons',   name: 'Анимированные значки шапки',   desc: '«Главная», «Закладки», «Карта» без движения' },
    { id: 'reveal',     name: 'Анимации появления',           desc: 'Карточки и блоки не выезжают при прокрутке, без «прыжков» при наведении' }
];

function readSafeOpts() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('spatium_safe_opts') || '{}') || {}; } catch (e) {}
    const opts = {};
    SAFE_OPTIONS.forEach(o => { opts[o.id] = saved[o.id] !== false; });
    return opts;
}

/* ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==================== */
let state = {
    theme: localStorage.getItem('spatium_theme') || 'dark',
    epilepsySafe: localStorage.getItem('spatium_epilepsy_safe') === 'true',
    safeOpts: readSafeOpts(),
    glowPosition: localStorage.getItem('spatium_glow_position') || 'left',
    glowEnabled: localStorage.getItem('spatium_glow_enabled') !== 'false',
    colorHSL: readSavedHSL(),
    currentPage: 'home',
    currentParam: null
};

const GLOW_POSITIONS = [
    { id: 'left', name: 'Слева' },
    { id: 'center', name: 'По центру' },
    { id: 'right', name: 'Справа' }
];

/* ==================== ИНИЦИАЛИЗАЦИЯ ==================== */
document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('spatium_glow_shape');
    initTheme();
    initGlowPosition();
    initGlowState();
    initEpilepsyCheck();
    initGlowButtonEvents();
    initColorWheel();
    applyGlowColor();
    renderSidebar();
    updateVersion();
    syncBookmarkUI();
    handleRoute();

    document.addEventListener('click', (e) => {
        if (e.target.closest('button, a, .category-card, .article-card, .article-list-item, .logo')) {
            playSelectSound();
        }
    });

    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
});

/* ==================== УПРАВЛЕНИЕ СВЕЧЕНИЕМ ФОНА ==================== */
function initGlowPosition() {
    applyGlowPositionClass(state.glowPosition);
}

function initGlowState() {
    const container = document.getElementById('glowContainer');
    if (!state.glowEnabled) {
        container.classList.add('glow-disabled');
        document.body.classList.add('glow-off');
    } else {
        container.classList.remove('glow-disabled');
        document.body.classList.remove('glow-off');
    }
    updateGlowPowerUI();
}

function updateGlowPowerUI() {
    const btn = document.getElementById('glowPowerBtn');
    if (!btn) return;
    btn.classList.toggle('is-off', !state.glowEnabled);
    btn.setAttribute('aria-pressed', String(state.glowEnabled));
    document.getElementById('glowPowerLabel').textContent =
        state.glowEnabled ? 'Выключить свечение' : 'Включить свечение';
}

function toggleGlowEnabled() {
    state.glowEnabled = !state.glowEnabled;
    localStorage.setItem('spatium_glow_enabled', state.glowEnabled);
    initGlowState();
}

function toggleGlowPosition() {
    const currentIndex = GLOW_POSITIONS.findIndex(p => p.id === state.glowPosition);
    const nextIndex = (currentIndex + 1) % GLOW_POSITIONS.length;
    const nextPos = GLOW_POSITIONS[nextIndex].id;

    state.glowPosition = nextPos;
    localStorage.setItem('spatium_glow_position', nextPos);
    
    applyGlowPositionClass(nextPos);
}

function applyGlowPositionClass(pos) {
    document.body.classList.remove('glow-left', 'glow-center', 'glow-right');
    document.body.classList.add(`glow-${pos}`);
}

/* ==================== ОБРАБОТЧИКИ ПКМ / ЛКМ ==================== */
function initGlowButtonEvents() {
    const toggleBtn = document.getElementById('glowToggleBtn');

    toggleBtn.addEventListener('click', (e) => {
        toggleGlowPosition();
    });

    toggleBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleGlowEnabled();
        playSelectSound();
    });
}

/* ==================== КРУГОВАЯ ПАЛИТРА И ЦВЕТА СВЕЧЕНИЯ ==================== */
let wheelCanvas, wheelCtx;
let isDraggingWheel = false;

function initColorWheel() {
    wheelCanvas = document.getElementById('colorWheel');
    if (!wheelCanvas) return;
    wheelCtx = wheelCanvas.getContext('2d');

    // колесо рисуется при первом открытии окна настроек
    wheelCanvas.addEventListener('mousedown', startWheelDrag);
    wheelCanvas.addEventListener('touchstart', (e) => startWheelDrag(e.touches[0]), { passive: true });

    document.getElementById('hueSlider').addEventListener('input', (e) => {
        state.colorHSL.h = parseInt(e.target.value);
        updateColorFromHSL();
    });

    document.getElementById('satSlider').addEventListener('input', (e) => {
        state.colorHSL.s = parseInt(e.target.value);
        updateColorFromHSL();
    });

    document.getElementById('lightSlider').addEventListener('input', (e) => {
        state.colorHSL.l = parseInt(e.target.value);
        updateColorFromHSL();
    });

    document.getElementById('hexInput').addEventListener('change', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            const hsl = hexToHSL(val);
            state.colorHSL = hsl;
            updateColorFromHSL();
        } else {
            updateColorUI();
        }
    });
}

let wheelDrawn = false;

function drawWheel() {
    const size = wheelCanvas.width;
    const radius = size / 2;
    const img = wheelCtx.createImageData(size, size);
    const data = img.data;

    for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
            const x = px - radius;
            const y = py - radius;
            const dist = Math.sqrt(x * x + y * y);
            if (dist > radius) continue;

            let angle = Math.atan2(y, x) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            const { r, g, b } = hslToRgb(angle, (dist / radius) * 100, 50);
            const i = (py * size + px) * 4;
            data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
        }
    }
    wheelCtx.putImageData(img, 0, 0);
    wheelDrawn = true;
}

function onWheelMouseMove(e) { handleWheelMove(e); }
function onWheelTouchMove(e) { handleWheelMove(e.touches[0]); }

function startWheelDrag(e) {
    isDraggingWheel = true;
    window.addEventListener('mousemove', onWheelMouseMove);
    window.addEventListener('mouseup', stopWheelDrag);
    window.addEventListener('touchmove', onWheelTouchMove, { passive: true });
    window.addEventListener('touchend', stopWheelDrag);
    handleWheelMove(e);
}

function stopWheelDrag() {
    isDraggingWheel = false;
    window.removeEventListener('mousemove', onWheelMouseMove);
    window.removeEventListener('mouseup', stopWheelDrag);
    window.removeEventListener('touchmove', onWheelTouchMove);
    window.removeEventListener('touchend', stopWheelDrag);
}

function handleWheelMove(e) {
    if (!isDraggingWheel) return;

    const rect = wheelCanvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const x = e.clientX - cx;
    const y = e.clientY - cy;

    const radius = rect.width / 2;
    const dist = Math.min(Math.sqrt(x * x + y * y), radius);

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const sat = Math.round((dist / radius) * 100);

    state.colorHSL.h = Math.round(angle);
    state.colorHSL.s = sat;

    updateColorFromHSL();
}

let colorRaf = 0;
let colorSaveTimer = 0;

function updateColorFromHSL() {
    if (!state.glowEnabled) {
        toggleGlowEnabled();
    }

    // обновляем DOM не чаще одного раза за кадр, а в localStorage пишем с задержкой
    if (!colorRaf) {
        colorRaf = requestAnimationFrame(() => {
            colorRaf = 0;
            applyGlowColor();
            updateColorUI();
        });
    }
    clearTimeout(colorSaveTimer);
    colorSaveTimer = setTimeout(() => {
        localStorage.setItem('spatium_glow_hsl', JSON.stringify(state.colorHSL));
    }, 250);
}

function updateColorUI() {
    const { h, s, l } = state.colorHSL;

    document.getElementById('hueSlider').value = h;
    document.getElementById('satSlider').value = s;
    document.getElementById('lightSlider').value = l;

    document.getElementById('hueValue').innerText = `${h}°`;
    document.getElementById('satValue').innerText = `${s}%`;
    document.getElementById('lightValue').innerText = `${l}%`;

    const hex = hslToHex(h, s, l);
    document.getElementById('hexInput').value = hex;
    document.getElementById('colorPreviewBox').style.backgroundColor = hex;

    const wheelWrapper = document.querySelector('.wheel-wrapper');
    const handle = document.getElementById('wheelHandle');
    if (wheelWrapper && handle) {
        const radius = wheelWrapper.clientWidth / 2;
        const rad = (h * Math.PI) / 180;
        const dist = (s / 100) * radius;

        const handleX = radius + dist * Math.cos(rad);
        const handleY = radius + dist * Math.sin(rad);

        handle.style.left = `${handleX}px`;
        handle.style.top = `${handleY}px`;
        handle.style.backgroundColor = hex;
    }
}

function applyGlowColor() {
    const { h, s, l } = state.colorHSL;
    const rgb = hslToRgb(h, s, l);
    const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

    const root = document.documentElement;
    root.style.setProperty('--glow-rgb', rgbStr);
    root.style.setProperty('--glow-color-1', `rgba(${rgbStr}, 0.6)`);
    root.style.setProperty('--glow-color-2', `rgba(${rgbStr}, 0.5)`);
    root.style.setProperty('--glow-color-3', `rgba(${rgbStr}, 0.4)`);
}

function resetGlowSettings() {
    clearTimeout(colorSaveTimer);
    state.colorHSL = { ...DEFAULT_HSL };
    
    localStorage.removeItem('spatium_glow_hsl');

    applyGlowColor();
    updateColorUI();
    toggleColorPickerModal(false);
}

function toggleColorPickerModal(show) {
    const modal = document.getElementById('colorPickerModal');
    if (show) {
        if (wheelCtx && !wheelDrawn) drawWheel();
        modal.classList.add('active');
        updateColorUI();
        } else {
        modal.classList.remove('active');
    }
}

function closeColorPicker(e) {
    if (e.target.id === 'colorPickerModal') {
        toggleColorPickerModal(false);
    }
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4))
    };
}

function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToHSL(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 50 };
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/* ==================== ЭПИЛЕПСИЯ И БЕЗОПАСНЫЙ РЕЖИМ ==================== */
// безопасный режим включён И этот пункт отмечен в настройках
function safeOn(id) {
    return state.epilepsySafe && state.safeOpts[id] !== false;
}

function applySafeClasses() {
    document.body.classList.toggle('epilepsy-safe', state.epilepsySafe);
    SAFE_OPTIONS.forEach(o => document.body.classList.toggle('safe-' + o.id, safeOn(o.id)));
    // все функции безопасного режима включены - вся кнопка в зелёной рамке
    document.body.classList.toggle('safe-all', state.epilepsySafe && SAFE_OPTIONS.every(o => state.safeOpts[o.id] !== false));
}

function initEpilepsyCheck() {
    const isChoiceMade = localStorage.getItem('spatium_epilepsy_safe') !== null;
    applySafeClasses();

    if (!isChoiceMade) {
        document.getElementById('epilepsyModal').classList.add('active');
    }
}

function setEpilepsySafeMode(isSafe) {
    state.epilepsySafe = isSafe;
    localStorage.setItem('spatium_epilepsy_safe', isSafe ? 'true' : 'false');
    applySafeClasses();
    syncSafeSettingsUI();
    document.getElementById('epilepsyModal').classList.remove('active');
}

function toggleEpilepsyMode() {
    setEpilepsySafeMode(!state.epilepsySafe);
}

function setSafeOpt(id, value) {
    state.safeOpts[id] = value;
    localStorage.setItem('spatium_safe_opts', JSON.stringify(state.safeOpts));
    applySafeClasses();
}

function resetSafeOptions() {
    SAFE_OPTIONS.forEach(o => { state.safeOpts[o.id] = true; });
    localStorage.removeItem('spatium_safe_opts');
    applySafeClasses();
    renderSafeOptions();
}

function renderSafeOptions() {
    const list = document.getElementById('safeOptsList');
    if (!list) return;
    list.innerHTML = SAFE_OPTIONS.map(o => `
        <label class="safe-row">
            <span class="safe-row-text"><b>${o.name}</b><small>${o.desc}</small></span>
            <input type="checkbox" class="safe-switch" ${state.safeOpts[o.id] ? 'checked' : ''} onchange="setSafeOpt('${o.id}', this.checked)">
        </label>
    `).join('');
    syncSafeSettingsUI();
}

function syncSafeSettingsUI() {
    const master = document.getElementById('safeMasterSwitch');
    if (master) master.checked = state.epilepsySafe;
    const list = document.getElementById('safeOptsList');
    if (list) list.classList.toggle('off', !state.epilepsySafe);
}

function toggleSafeSettings(show) {
    const modal = document.getElementById('safeSettingsModal');
    if (show) {
        renderSafeOptions();
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

function closeSafeSettings(e) {
    if (e.target.id === 'safeSettingsModal') toggleSafeSettings(false);
}

/* ==================== ПЕРЕХОД В КОНСОЛЬ ====================
   1) страница «рвётся»: горизонтальные сдвиги + RGB-разъезд, сверху вниз проходит полоса «трекинга» (как на VHS);
   2) экран схлопывается в светящуюся линию, как старый ТВ/ЭЛТ;
   3) на чёрном «грузится» терминал Spatium OS (с полосой прогресса), и только потом открывается консоль.
   В безопасном режиме (пункт «Глитч при переходе») или при prefers-reduced-motion
   остаётся мягкое затемнение — без искажений и вспышек.                              */
const CONSOLE_BOOT_LINES = [
    '> SPATIUM OS // подключение...',
    '> загрузка ядра .............. OK',
    '> монтирование /wiki ......... OK'
];
let consoleFxBusy = false;

function ensureGlitchFilter() {
    if (document.getElementById('spGlitchSvg')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<svg id="spGlitchSvg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
        <defs><filter id="spGlitch" x="-6%" y="-2%" width="112%" height="104%" color-interpolation-filters="sRGB">
            <feTurbulence id="spGlitchNoise" type="fractalNoise" baseFrequency="0 0.05" numOctaves="1" seed="1" result="n"/>
            <feComponentTransfer in="n" result="n2">
                <feFuncR type="discrete" tableValues="0.5 0.5 0.5 0.5 0.12 0.5 0.5 0.88 0.5 0.5 0.5 0.28 0.5 0.5 0.72 0.5"/>
                <feFuncG type="discrete" tableValues="0.5"/>
            </feComponentTransfer>
            <feDisplacementMap id="spGlitchDisp" in="SourceGraphic" in2="n2" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
            <feOffset id="spGlitchR" in="r" dx="0" dy="0" result="r2"/>
            <feOffset id="spGlitchB" in="b" dx="0" dy="0" result="b2"/>
            <feBlend in="r2" in2="g" mode="screen" result="rg"/>
            <feBlend in="rg" in2="b2" mode="screen"/>
        </filter></defs></svg>`;
    document.body.appendChild(wrap.firstElementChild);
}

// «дёргает» параметры фильтра ~18 раз в секунду, амплитуда растёт к концу
function startGlitchWarp(ms) {
    const $id = id => document.getElementById(id);
    const noise = $id('spGlitchNoise'), disp = $id('spGlitchDisp'), r = $id('spGlitchR'), b = $id('spGlitchB');
    if (!noise || !disp || !r || !b) return () => {};
    const t0 = performance.now();
    let last = 0, raf = 0;
    const loop = now => {
        if (now - last > 55) {
            last = now;
            const k = Math.min(1, (now - t0) / ms);
            noise.setAttribute('seed', String(Math.floor(Math.random() * 900)));
            noise.setAttribute('baseFrequency', '0 ' + (0.012 + Math.random() * 0.05).toFixed(3));
            disp.setAttribute('scale', String(Math.round((30 + k * 90) * (0.5 + Math.random() * 0.5))));
            const sp = 2 + k * 7;
            r.setAttribute('dx', (-sp * (0.5 + Math.random())).toFixed(1));
            b.setAttribute('dx', (sp * (0.5 + Math.random())).toFixed(1));
        }
        raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
}

function triggerConsoleTransition(e) {
    e.preventDefault();
    if (consoleFxBusy) return;
    const targetUrl = e.currentTarget.href;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openConsole = () => {
        const win = window.open(targetUrl, '_blank');
        if (!win) window.location.href = targetUrl; // попап заблокирован — открываем в этой вкладке
    };

    if (safeOn('glitch') || reduced) { // мягкое затемнение
        const cls = 'safe-fade-active';
        document.body.classList.add(cls);
        setTimeout(() => { openConsole(); setTimeout(() => document.body.classList.remove(cls), 500); }, 500);
        return;
    }

    consoleFxBusy = true;
    ensureGlitchFilter();
    const body = document.body;
    const ov = document.createElement('div');
    ov.className = 'cg-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="cg-track"></div><div class="cg-shutter cg-top"></div><div class="cg-shutter cg-bot"></div><div class="cg-beam"></div><pre class="cg-term"></pre>';
    body.appendChild(ov);
    const term = ov.querySelector('.cg-term');
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    // терминал: строки + полоса прогресса + итоговая строка
    const lines = [];
    const draw = ok => { term.innerHTML = lines.join('\n') + (ok ? '\n<b>> доступ разрешён</b>' : ''); };
    const BAR = 10;
    const bar = n => '> [' + '█'.repeat(n) + '░'.repeat(BAR - n) + '] ' + (n * 10) + '%';

    body.classList.add('cg-active', 'cg-warp');
    const stopWarp = startGlitchWarp(380);

    at(380, () => ov.classList.add('cg-close'));                                   // шторки сходятся
    at(640, () => { body.classList.remove('cg-warp'); stopWarp(); ov.classList.add('cg-beam-on'); }); // линия
    at(820, () => ov.classList.add('cg-beam-off'));                                // линия гаснет в точку
    at(880, () => {                                                                // «загрузка» терминала
        ov.classList.add('cg-term-on');
        CONSOLE_BOOT_LINES.forEach((line, i) => at(i * 90, () => { lines.push(line); draw(false); }));
        const t1 = CONSOLE_BOOT_LINES.length * 90;
        at(t1, () => { lines.push(bar(0)); draw(false); });
        for (let n = 1; n <= BAR; n++) at(t1 + n * 22, () => { lines[lines.length - 1] = bar(n); draw(false); });
        at(t1 + BAR * 22 + 40, () => draw(true));                                  // «доступ разрешён»
    });
    const OPEN_AT = 880 + CONSOLE_BOOT_LINES.length * 90 + BAR * 22 + 40 + 170;
    at(OPEN_AT, openConsole);
    at(OPEN_AT + 250, () => ov.classList.add('cg-out'));                           // возвращаемся на сайт
    at(OPEN_AT + 750, () => {
        ov.remove();
        body.classList.remove('cg-active', 'cg-warp');
        consoleFxBusy = false;
    });
}

/* ==================== ТЕМЫ И ЛОГОТИП ==================== */
function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeAssets();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('spatium_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeAssets();
}

function updateThemeAssets() {
    const btn = document.getElementById('themeToggleBtn');
    const logo = document.getElementById('siteLogo');

    if (state.theme === 'dark') {
        btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        logo.src = 'img/spatium_logo_black.png';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        logo.src = 'img/spatium_logo_white.png';
    }
}

/* ==================== НАВИГАЦИЯ И РОУТИНГ ==================== */
function navigateTo(page, param = null, push = true) {
    state.currentPage = page;
    state.currentParam = param;

    document.getElementById('sidebar').classList.remove('open');

    const navHomeBtn = document.getElementById('navHome');
    if (navHomeBtn) {
        navHomeBtn.classList.toggle('active', page === 'home');
    }
    const navBmBtn = document.getElementById('navBookmarks');
    if (navBmBtn) {
        navBmBtn.classList.toggle('active', page === 'bookmarks');
    }
    document.body.classList.toggle('map-mode', page === 'map');
    const navMapBtn = document.getElementById('navMap');
    if (navMapBtn) {
        navMapBtn.classList.toggle('active', page === 'map');
    }

    if (push) {
        const hash = page === 'home' ? '#/' : (param == null ? `#/${page}` : `#/${page}/${encodeURIComponent(param)}`);
        try { history.pushState(null, '', hash); } catch (e) {}
    }

    document.body.classList.remove('map-ready');
    if (page === 'map') ensureMapFrame(); // карта начинает грузиться уже во время фейковой загрузки

    renderSidebar();
    startFakeLoad(renderContent);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
    if (/^#heading-/.test(location.hash)) return;
    if (/^#\/bookmarks\/?$/.test(location.hash)) {
        navigateTo('bookmarks', null, false);
        return;
    }
    if (/^#\/map\/?$/.test(location.hash)) {
        navigateTo('map', null, false);
        return;
    }
    const m = location.hash.match(/^#\/(category|article|search)\/(.+)$/);
    if (m) {
        let p = m[2];
        try { p = decodeURIComponent(p); } catch (e) {}
        navigateTo(m[1], p, false);
    } else {
        navigateTo('home', null, false);
    }
}

window.addEventListener('popstate', handleRoute);

/* ==================== ФЕЙК-ЗАГРУЗКА СТРАНИЦ ==================== */
let loadToken = 0;
let loadTimers = [];

function getLoaderBar() {
    let bar = document.getElementById('pageLoader');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'pageLoader';
        bar.className = 'page-loader';
        bar.innerHTML = '<div class="page-loader-fill"></div>';
        document.body.appendChild(bar);
    }
    return bar;
}

const SPATI_SVG = `
<svg viewBox="0 0 9 10" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g class="sl-body">
        <rect x="2" y="0" width="5" height="1"/>
        <rect x="1" y="1" width="7" height="1"/>
        <rect x="0" y="2" width="9" height="7"/>
        <rect x="0" y="9" width="2" height="1"/>
        <rect x="3" y="9" width="3" height="1"/>
        <rect x="7" y="9" width="2" height="1"/>
    </g>
    <g class="sl-eyes">
        <rect class="sl-eye" x="3" y="3" width="1" height="1"/>
        <rect class="sl-eye" x="5" y="3" width="1" height="1"/>
    </g>
    <rect class="sl-mouth" x="4" y="5" width="1" height="2"/>
</svg>`;

// Варианты загрузки: что делает Спати и что пишется в облачке над ним
const SPATI_VARIANTS = {
    sleep:  { text: 'ХРРР',  end: 'surprised' },  // спит на боку, потом резко просыпается
    look:   { text: '...',   end: 'happy' },      // осматривается по сторонам
    dance:  { text: 'ЛА-ЛА', end: 'happy' },      // пританцовывает
    dizzy:  { text: '@_@',   end: 'surprised' },  // кружится
    think:  { text: 'ХММ',   end: 'surprised' },  // задумался
    yawn:   { text: 'АААХ', end: 'happy' },      // зевает и потягивается
    hiccup: { text: 'ИК',    end: 'happy' },      // икает
    shiver: { text: 'БРР',   end: 'happy' },      // дрожит от холода
    peek:   { text: 'КУ-КУ',  end: 'surprised' },  // прячется и выглядывает
    sneeze: { text: 'АПЧХИ', end: 'happy' },      // собирается чихнуть
    wink:   { text: ';)',    end: 'happy' }       // подмигивает
};

let hasLoadedOnce = false;
let lastVariant = null;

function pickVariant() {
    const keys = Object.keys(SPATI_VARIANTS).filter(k => k !== lastVariant);
    lastVariant = keys[Math.floor(Math.random() * keys.length)];
    return lastVariant;
}

function spatiLoaderHtml(variant, calm, fillMs = 800) {
    const text = SPATI_VARIANTS[variant].text;
    return `
    <div class="spati-loader page-animated v-${variant}${calm ? ' is-calm' : ''}" role="status" aria-label="Загрузка">
        <div class="sl-bubble" style="--n:${text.length}">
            <span class="sl-bubble-text">${text}</span>
        </div>
        <div class="sl-stage" id="slStage" data-var="${variant}" data-end="${SPATI_VARIANTS[variant].end}" data-state="${calm ? 'calm' : 'idle'}">
            <div class="sl-glow"></div>
            <div class="sl-mascot"><div class="sl-lie">${calm
                ? `<div class="sl-ghost">${SPATI_SVG}</div><div class="sl-fillclip" style="--fill-ms:${fillMs}ms">${SPATI_SVG}</div>`
                : SPATI_SVG}</div></div>
        </div>
        <div class="sl-text">Загрузка</div>
    </div>`;
}

function startFakeLoad(render) {
    const token = ++loadToken;
    loadTimers.forEach(clearTimeout);
    loadTimers = [];

    const reduce = safeOn('loader') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const first = !hasLoadedOnce;
    hasLoadedOnce = true;

    // сколько длится «занятие» и сколько - финальная реакция; каждый раз случайно
    const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
    const idleMs = reduce ? 0 : (first ? rnd(900, 2000) : rnd(300, 1200));
    const endMs  = reduce ? rnd(700, 1200) : (first ? rnd(550, 950) : rnd(350, 700));
    const total = idleMs + endMs;

    const bar = getLoaderBar();
    const fill = bar.firstElementChild;
    bar.classList.remove('done');
    fill.style.transition = 'none';
    fill.style.transform = 'scaleX(0)';
    void fill.offsetWidth;
    bar.classList.add('active');

    const setP = (p, ms) => {
        fill.style.transition = `transform ${ms}ms cubic-bezier(0.22, 0.8, 0.3, 1)`;
        fill.style.transform = `scaleX(${p})`;
    };
    const at = (ms, fn) => loadTimers.push(setTimeout(() => { if (token === loadToken) fn(); }, ms));

    document.getElementById('mainContent').innerHTML = spatiLoaderHtml(pickVariant(), reduce, endMs);

    at(30, () => setP(0.6, Math.max(idleMs, 200)));

    if (!reduce) {
        at(idleMs, () => {
            const stage = document.getElementById('slStage');
            if (stage) {
                stage.dataset.state = 'finish';
                stage.parentElement.classList.add('is-finish');
            }
            setP(0.92, endMs * 0.6);
        });
    } else {
        at(30, () => setP(0.95, endMs * 0.9));
    }

    at(total, () => {
        setP(1, 160);
        render();
        loadTimers.push(setTimeout(() => {
            if (token !== loadToken) return;
            bar.classList.add('done');
            bar.classList.remove('active');
        }, 200));
    });
}

/* ==================== ЗАКЛАДКИ, ИСТОРИЯ, ОТЗЫВЫ (localStorage) ==================== */
const LS_BOOKMARKS = 'spatium_bookmarks';
const LS_HISTORY = 'spatium_history';
const LS_VOTES = 'spatium_votes';
const HISTORY_LIMIT = 20;

function lsRead(key, fallback) {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v == null ? fallback : v;
    } catch (e) { return fallback; }
}
function lsWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

/* ---------- закладки ---------- */
function getBookmarks() {
    const raw = lsRead(LS_BOOKMARKS, []);
    return Array.isArray(raw) ? raw.filter(id => articleById(id)) : [];
}

function isBookmarked(id) {
    return getBookmarks().includes(id);
}

function toggleBookmark(id, ev) {
    if (ev) ev.stopPropagation(); // клик по закладке на карточке не должен открывать статью
    const list = getBookmarks();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.unshift(id);
    lsWrite(LS_BOOKMARKS, list);
    playSelectSound();
    syncBookmarkUI();
    if (i < 0 && motionAllowed()) { // «поп» значка при добавлении
        document.querySelectorAll(`[data-bm-id="${id}"] i`).forEach(ic => {
            ic.classList.remove('bm-pop'); void ic.offsetWidth; ic.classList.add('bm-pop');
            ic.addEventListener('animationend', () => ic.classList.remove('bm-pop'), { once: true });
        });
    }
    if (state.currentPage === 'bookmarks') renderBookmarksInPlace();
}

function clearBookmarks() {
    if (!getBookmarks().length || !confirm('Удалить все закладки?')) return;
    lsWrite(LS_BOOKMARKS, []);
    syncBookmarkUI();
    renderBookmarksInPlace();
}

function bookmarkBtnHtml(id, full) {
    const on = isBookmarked(id);
    const label = on ? 'Убрать из закладок' : 'Добавить в закладки';
    return `<button type="button" class="bm-btn${full ? ' bm-btn-full' : ''}${on ? ' is-on' : ''}" data-bm-id="${id}" aria-pressed="${on}" aria-label="${label}" title="${label}" onclick="toggleBookmark('${id}', event)"><i class="${on ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>${full ? `<span>${on ? 'В закладках' : 'В закладки'}</span>` : ''}</button>`;
}

// обновляет все кнопки-закладки на странице и счётчик в шапке
function syncBookmarkUI() {
    const list = getBookmarks();
    document.querySelectorAll('[data-bm-id]').forEach(btn => {
        const on = list.includes(btn.dataset.bmId);
        const label = on ? 'Убрать из закладок' : 'Добавить в закладки';
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', label);
        btn.title = label;
        const icon = btn.querySelector('i');
        if (icon) icon.className = `${on ? 'fa-solid' : 'fa-regular'} fa-bookmark`;
        const txt = btn.querySelector('span');
        if (txt) txt.textContent = on ? 'В закладках' : 'В закладки';
    });
    const badge = document.getElementById('bookmarkBadge');
    if (badge) {
        badge.textContent = list.length;
        badge.hidden = list.length === 0;
    }
}

/* ---------- история просмотров ---------- */
function getHistory() {
    const raw = lsRead(LS_HISTORY, []);
    return Array.isArray(raw) ? raw.filter(h => h && articleById(h.id)) : [];
}

function addToHistory(id) {
    const list = getHistory().filter(h => h.id !== id);
    list.unshift({ id, t: Date.now() });
    lsWrite(LS_HISTORY, list.slice(0, HISTORY_LIMIT));
}

function clearHistory() {
    try { localStorage.removeItem(LS_HISTORY); } catch (e) {}
    document.querySelectorAll('[data-history-block]').forEach(el => el.remove());
}

function timeAgo(ts) {
    const sec = Math.max(0, (Date.now() - ts) / 1000);
    if (sec < 60) return 'только что';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ч назад`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'вчера';
    if (d < 7) return `${d} дн. назад`;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function historyBlockHtml(limit) {
    const items = getHistory().slice(0, limit);
    if (!items.length) return '';
    return `
        <div class="info-block history-block" data-history-block>
            <div class="block-head">
                <div class="section-title" style="margin:0"><i class="fa-solid fa-book-open-reader"></i> Недавно читали</div>
                <button type="button" class="link-btn" onclick="clearHistory()"><i class="fa-regular fa-trash-can"></i> Очистить</button>
            </div>
            <div class="article-list-simple">
                ${items.map(h => {
                    const a = articleById(h.id);
                    return `
                    <div class="article-list-item" onclick="navigateTo('article', '${a.id}')">
                        <div class="title-group">
                            <i class="fa-regular fa-file-lines"></i>
                            <span>${escapeHtml(a.title)}</span>
                        </div>
                        <span class="date">${timeAgo(h.t)}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

/* ---------- «Была ли статья полезной?» ---------- */
function getVote(id) {
    const all = lsRead(LS_VOTES, {});
    return all && typeof all === 'object' ? (all[id] || null) : null;
}

function setVote(id, value) {
    let all = lsRead(LS_VOTES, {});
    if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
    if (all[id] === value) delete all[id]; else all[id] = value; // повторный клик снимает голос
    lsWrite(LS_VOTES, all);
    refreshFeedback(id);
}

function feedbackHtml(id) {
    const v = getVote(id);
    const btn = (kind, text) => `
        <button type="button" class="fb-btn${v === kind ? ' is-on' : ''}" data-vote="${kind}" aria-pressed="${v === kind}" onclick="setVote('${id}', '${kind}')">
            <i class="${v === kind ? 'fa-solid' : 'fa-regular'} fa-thumbs-${kind}"></i> ${text}
        </button>`;
    return `
        <section class="feedback-block" id="feedbackBlock" data-article="${id}" aria-labelledby="fbTitle">
            <div class="feedback-q" id="fbTitle">Была ли статья полезной?</div>
            <div class="feedback-btns">${btn('up', 'Да')}${btn('down', 'Нет')}</div>
            <div class="feedback-msg" role="status">${v ? 'Спасибо за отзыв! Нажмите ещё раз, чтобы отменить.' : ''}</div>
        </section>`;
}

function refreshFeedback(id) {
    const box = document.getElementById('feedbackBlock');
    if (!box || box.dataset.article !== id) return;
    const v = getVote(id);
    box.querySelectorAll('.fb-btn').forEach(b => {
        const on = b.dataset.vote === v;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
        b.querySelector('i').className = `${on ? 'fa-solid' : 'fa-regular'} fa-thumbs-${b.dataset.vote}`;
    });
    box.querySelector('.feedback-msg').textContent = v ? 'Спасибо за отзыв! Нажмите ещё раз, чтобы отменить.' : '';
}

/* ---------- «Похожие статьи» и «Предыдущая / следующая» ---------- */
// баллы: общий тег = 3, одна категория = 2, прямая ссылка между статьями = 4 (в каждую сторону)
function getRelatedArticles(article, limit = 3) {
    const myTags = article.tags.map(t => t.toLowerCase());
    const scored = [];
    WIKI_DATA.articles.forEach(other => {
        if (other.id === article.id) return;
        let score = other.tags.filter(t => myTags.includes(t.toLowerCase())).length * 3;
        if (other.categoryId === article.categoryId) score += 2;
        if (ARTICLE_LINKS[article.id] && ARTICLE_LINKS[article.id].has(other.id)) score += 4;
        if (ARTICLE_LINKS[other.id] && ARTICLE_LINKS[other.id].has(article.id)) score += 4;
        if (score > 0) scored.push({ a: other, score });
    });
    scored.sort((x, y) => y.score - x.score || parseRuDate(y.a.updatedAt) - parseRuDate(x.a.updatedAt));
    return scored.slice(0, limit).map(o => o.a);
}

function relatedHtml(article) {
    const rel = getRelatedArticles(article, 3);
    if (!rel.length) return '';
    return `
        <section class="related-block">
            <div class="section-title"><i class="fa-solid fa-link"></i> Похожие статьи</div>
            ${renderArticlesAsGrid(rel)}
        </section>`;
}

// порядок чтения: категории как в боковом меню, внутри категории - как в articles.js
function getReadingOrder() {
    const catIdx = id => {
        const i = WIKI_DATA.categories.findIndex(c => c.id === id);
        return i < 0 ? 999 : i;
    };
    return WIKI_DATA.articles
        .map((a, i) => ({ a, i }))
        .sort((x, y) => catIdx(x.a.categoryId) - catIdx(y.a.categoryId) || x.i - y.i)
        .map(o => o.a);
}

function prevNextHtml(article) {
    const order = getReadingOrder();
    const i = order.findIndex(a => a.id === article.id);
    const prev = i > 0 ? order[i - 1] : null;
    const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null;
    if (!prev && !next) return '';

    const card = (a, dir) => {
        if (!a) return '<span class="pn-empty"></span>';
        const cat = WIKI_DATA.categories.find(c => c.id === a.categoryId);
        const label = dir === 'prev'
            ? '<i class="fa-solid fa-arrow-left"></i> Предыдущая'
            : 'Следующая <i class="fa-solid fa-arrow-right"></i>';
        return `
            <a href="#/article/${encodeURIComponent(a.id)}" class="pn-card pn-${dir}" onclick="event.preventDefault(); navigateTo('article', '${a.id}')">
                <span class="pn-label">${label}</span>
                <span class="pn-title">${escapeHtml(a.title)}</span>
                ${cat ? `<span class="pn-cat">${escapeHtml(cat.name)}</span>` : ''}
            </a>`;
    };
    return `<nav class="pn-nav" aria-label="Соседние статьи">${card(prev, 'prev')}${card(next, 'next')}</nav>`;
}

/* ---------- страница «Мои закладки» ---------- */
function bookmarksListHtml() {
    const list = getBookmarks().map(articleById);
    if (!list.length) {
        return `
            <div class="empty-state">
                <i class="fa-regular fa-bookmark"></i>
                <p>Пока пусто. Нажмите на закладку в карточке или на странице статьи, чтобы сохранить её сюда.</p>
                <button type="button" class="link-btn" onclick="navigateTo('home')"><i class="fa-solid fa-house"></i> На главную</button>
            </div>`;
    }
    return `
        <div class="bm-toolbar">
            <span>Сохранено: ${list.length}</span>
            <button type="button" class="link-btn" onclick="clearBookmarks()"><i class="fa-regular fa-trash-can"></i> Очистить все</button>
        </div>
        ${renderArticlesAsGrid(list)}`;
}

function markNavigable(root) {
    root.querySelectorAll('.category-card, .article-card, .article-list-item').forEach(el => {
        el.tabIndex = 0;
        el.setAttribute('role', 'link');
        el.dataset.nav = '1';
    });
}

function renderBookmarksInPlace() {
    const box = document.getElementById('bookmarksList');
    if (!box) return;
    box.innerHTML = bookmarksListHtml();
    markNavigable(box);
}

function renderBookmarksPage(container) {
    container.innerHTML = `
        <div class="container-narrow">
            <div class="article-breadcrumb">
                <a href="#" onclick="event.preventDefault(); navigateTo('home')">Wiki</a> /
                <span>Закладки</span>
            </div>
            <div class="article-header">
                <h1><i class="fa-solid fa-bookmark" style="color:var(--accent); margin-right:0.5rem"></i> Мои закладки</h1>
                <div class="article-subtitle">Закладки и история хранятся только в этом браузере.</div>
            </div>
            <div id="bookmarksList">${bookmarksListHtml()}</div>
            ${historyBlockHtml(10)}
        </div>
    `;
}

/* ==================== РЕНДЕР СИДЕБАРА ==================== */
/* ==================== КАРТА МИРА (squaremap) ==================== */
const MAP_URL = 'http://135.125.188.210:32784';

// Если сайт открыт по HTTPS, а карта по HTTP — браузер заблокирует iframe (mixed content)
function isMapBlocked() {
    return location.protocol === 'https:' && /^http:\/\//i.test(MAP_URL);
}

// iframe живёт отдельно от #mainContent (при переносе в DOM он бы перезагрузился),
// создаётся один раз и только показывается/скрывается
function ensureMapFrame() {
    if (isMapBlocked() || document.getElementById('mapHost')) return;
    const host = document.createElement('div');
    host.id = 'mapHost';
    host.innerHTML = `
        <iframe class="map-frame" src="${MAP_URL}" title="Карта мира" allowfullscreen></iframe>`;
    document.body.appendChild(host);
}

function renderMapPage(container) {
    if (isMapBlocked()) {
        container.innerHTML = `
        <div class="map-page map-blocked">
            <div class="empty-state">
                <i class="fa-solid fa-lock"></i>
                <p>Сайт открыт по HTTPS, а карта работает по HTTP, поэтому браузер не даёт встроить её сюда. Откройте карту в новой вкладке.</p>
                <a class="map-open-btn" href="${MAP_URL}" target="_blank" rel="noopener"><i class="fa-solid fa-up-right-from-square"></i> Открыть карту</a>
            </div>
        </div>`;
        return;
    }
    ensureMapFrame();
    container.innerHTML = '<div class="map-page"></div>';
    document.body.classList.add('map-ready');
}

function renderSidebar() {
    const menu = document.getElementById('sidebarMenu');
    let html = '';

    WIKI_DATA.categories.forEach(cat => {
        const artCat = state.currentPage === 'article' ? (WIKI_DATA.articles.find(a => a.id === state.currentParam) || {}).categoryId : null;
        const isActive = (state.currentPage === 'category' && state.currentParam === cat.id) || artCat === cat.id;
        html += `
            <li class="sidebar-item ${isActive ? 'active' : ''}">
                <a href="#" onclick="event.preventDefault(); navigateTo('category', '${cat.id}')">
                    <i class="fa-solid ${cat.icon}"></i> ${cat.name}
                </a>
            </li>
        `;
    });

    menu.innerHTML = html;
}

/* ==================== РЕНДЕР КОНТЕНТА С АНИМАЦИЕЙ ==================== */
function renderContent() {
    const container = document.getElementById('mainContent');
    
    container.innerHTML = `<div id="animatedWrapper" class="page-animated"></div>`;
    const wrapper = document.getElementById('animatedWrapper');

    if (state.currentPage === 'home') {
        renderHomePage(wrapper);
    } else if (state.currentPage === 'category') {
        renderCategoryPage(wrapper, state.currentParam);
    } else if (state.currentPage === 'article') {
        renderArticlePage(wrapper, state.currentParam);
    } else if (state.currentPage === 'search') {
        renderSearchPage(wrapper, state.currentParam);
    } else if (state.currentPage === 'bookmarks') {
        renderBookmarksPage(wrapper);
    } else if (state.currentPage === 'map') {
        renderMapPage(wrapper);
    }

    markNavigable(wrapper);
    initReveal(wrapper);
    initReadProgress();
}

/* ==================== АНИМАЦИИ ПОЯВЛЕНИЯ ПРИ ПРОКРУТКЕ ==================== */
let revealObserver = null;
const REVEAL_SELECTOR = [
    '.hero > *', '.article-breadcrumb', '.article-header', '.section-title',
    '.category-card', '.article-card', '.info-block', '.article-list-item',
    '.wiki-body > *', '.feedback-block', '.pn-card', '.empty-state', '.bm-toolbar'
].join(',');

function motionAllowed() {
    return !safeOn('reveal') && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function initReveal(root) {
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
    if (!motionAllowed() || !('IntersectionObserver' in window)) return;

    const items = [...root.querySelectorAll(REVEAL_SELECTOR)];
    // номер внутри своего родителя -> каскадная задержка (не больше 8 шагов)
    const counters = new Map();
    items.forEach(el => {
        const n = counters.get(el.parentNode) || 0;
        counters.set(el.parentNode, n + 1);
        el.style.setProperty('--rv-d', Math.min(n, 8) * 55 + 'ms');
        el.classList.add('rv');
    });

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            revealObserver.unobserve(el);
            el.classList.add('rv-in');
            // после показа убираем служебные классы, чтобы не мешать hover-эффектам
            const done = () => {
                el.classList.remove('rv', 'rv-in');
                el.style.removeProperty('--rv-d');
            };
            el.addEventListener('transitionend', function te(e) {
                if (e.propertyName !== 'opacity') return;
                el.removeEventListener('transitionend', te);
                done();
            });
            setTimeout(done, 1400); // запасной вариант
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    items.forEach(el => revealObserver.observe(el));
}

/* ==================== ПОЛОСА ПРОГРЕССА ЧТЕНИЯ ==================== */
function initReadProgress() {
    let bar = document.getElementById('readProgress');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'readProgress';
        bar.className = 'read-progress';
        bar.innerHTML = '<div class="read-progress-fill"></div>';
        document.body.appendChild(bar);
        let ticking = false;
        const update = () => {
            ticking = false;
            const on = state.currentPage === 'article' && motionAllowed();
            bar.classList.toggle('active', on);
            if (!on) return;
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
            bar.firstElementChild.style.transform = `scaleX(${p})`;
        };
        window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
        window.addEventListener('resize', update);
        bar._update = update;
    }
    bar._update();
}

function getArticleMediaHtml(article) {
    if (article.image) {
        return `<div class="article-card-media"><img src="${article.image}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async"></div>`;
    } else if (article.icon) {
        return `<div class="article-card-media"><i class="fa-solid ${article.icon}"></i></div>`;
    }
    return `<div class="article-card-media"><i class="fa-regular fa-file-lines"></i></div>`;
}

function renderArticlesAsGrid(articles) {
    if (!articles || articles.length === 0) {
        return `<p style="color: var(--text-muted)">В этой категории пока нет статей.</p>`;
    }

    return `
        <div class="articles-grid">
            ${articles.map(a => `
                <div class="article-card" onclick="navigateTo('article', '${a.id}')">
                    <div class="article-card-header">
                        ${getArticleMediaHtml(a)}
                        <div class="article-card-title">${a.title}</div>
                    </div>
                    <div class="article-card-desc">${a.subtitle}</div>
                    <div class="article-card-footer">
                        <div class="card-meta">
                            <span>Обновлено: ${a.updatedAt}</span>
                            <span><i class="fa-regular fa-clock"></i> ~${a._read} мин</span>
                        </div>
                        <div class="card-actions">
                            ${bookmarkBtnHtml(a.id)}
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderHomePage(container) {
    const popularArticles = WIKI_DATA.articles.filter(a => a.popular);
    const recentArticles = [...WIKI_DATA.articles].sort((a,b) => parseRuDate(b.updatedAt) - parseRuDate(a.updatedAt)).slice(0, 4);

    let categoriesHtml = WIKI_DATA.categories.map(cat => {
        const count = WIKI_DATA.articles.filter(a => a.categoryId === cat.id).length;
        return `
            <div class="category-card" onclick="navigateTo('category', '${cat.id}')">
                <div class="category-header">
                    <div class="category-icon"><i class="fa-solid ${cat.icon}"></i></div>
                    <div class="category-title">${cat.name}</div>
                </div>
                <div class="category-desc">${cat.desc}</div>
                <div class="category-count">${count} статей</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="container-narrow">
            <div class="hero">
                <h1>Spatium Wiki</h1>
                <p>Официальная база знаний нашего Minecraft-сервера. Изучайте механики, команды и правила проекта.</p>
                <div class="hero-search">
                    <input type="text" placeholder="Поиск по статьям и руководствам..." onkeyup="handleHeroSearch(event)">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
            </div>

            <div class="section-title"><i class="fa-solid fa-compass"></i> Категории знаний</div>
            <div class="categories-grid">
                ${categoriesHtml}
            </div>

            ${historyBlockHtml(4)}

            <div class="grid-two-col">
                <div class="info-block">
                    <div class="section-title" style="margin-top:0"><i class="fa-solid fa-fire"></i> Популярные статьи</div>
                    <div class="article-list-simple">
                        ${popularArticles.map(a => `
                            <div class="article-list-item" onclick="navigateTo('article', '${a.id}')">
                                <div class="title-group">
                                    <i class="fa-regular fa-file-lines"></i>
                                    <span>${a.title}</span>
                                </div>
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="info-block">
                    <div class="section-title" style="margin-top:0"><i class="fa-solid fa-clock-rotate-left"></i> Последние обновления</div>
                    <div class="article-list-simple">
                        ${recentArticles.map(a => `
                            <div class="article-list-item" onclick="navigateTo('article', '${a.id}')">
                                <div class="title-group">
                                    <i class="fa-regular fa-file-lines"></i>
                                    <span>${a.title}</span>
                                </div>
                                <span class="date">${a.updatedAt}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCategoryPage(container, categoryId) {
    if (categoryId === 'all') {
        renderHomePage(container);
        return;
    }

    const category = WIKI_DATA.categories.find(c => c.id === categoryId);
    const articles = WIKI_DATA.articles.filter(a => a.categoryId === categoryId);

    if (!category) {
        container.innerHTML = `<h2>Категория не найдена</h2>`;
        return;
    }

    container.innerHTML = `
        <div class="container-narrow">
            <div class="article-breadcrumb">
                <a href="#" onclick="event.preventDefault(); navigateTo('home')">Wiki</a> / 
                <span>${category.name}</span>
            </div>
            <div class="article-header">
                <h1><i class="fa-solid ${category.icon}" style="color:var(--accent); margin-right:0.5rem"></i> ${category.name}</h1>
                <div class="article-subtitle">${category.desc}</div>
            </div>
            ${renderArticlesAsGrid(articles)}
        </div>
    `;
}

function renderArticlePage(container, articleId) {
    const article = WIKI_DATA.articles.find(a => a.id === articleId);
    if (!article) {
        container.innerHTML = `<h2>Статья не найдена</h2>`;
        return;
    }

    const category = WIKI_DATA.categories.find(c => c.id === article.categoryId);

    container.innerHTML = `
        <div class="article-container">
            <div class="article-main">
                <div class="article-breadcrumb">
                    <a href="#" onclick="event.preventDefault(); navigateTo('home')">Wiki</a> / 
                    <a href="#" onclick="event.preventDefault(); navigateTo('category', '${category.id}')">${category.name}</a> / 
                    <span>${article.title}</span>
                </div>

                <div class="article-header" style="display: flex; align-items: center; gap: 1.25rem;">
                    ${getArticleMediaHtml(article)}
                    <div>
                        <h1 style="margin: 0;">${article.title}</h1>
                        <div class="article-subtitle">${article.subtitle}</div>
                        <div class="article-meta">
                            <span><i class="fa-regular fa-calendar"></i> Обновлено: ${article.updatedAt}</span>
                            <span><i class="fa-regular fa-clock"></i> ~${article._read} мин чтения</span>
                            ${bookmarkBtnHtml(article.id, true)}
                        </div>
                        ${article.tags.length ? `<div class="article-tags">${article.tags.map(t => `<button type="button" class="tag-chip" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`).join('')}</div>` : ''}
                    </div>
                </div>

                <div class="wiki-body" id="wikiBody">
                    ${article.content}
                </div>

                ${feedbackHtml(article.id)}
                ${relatedHtml(article)}
                ${prevNextHtml(article)}
            </div>

            <div class="toc-sidebar">
                <div class="toc-title">Содержание</div>
                <ul class="toc-list" id="tocList"></ul>
            </div>
        </div>
    `;

    generateTOC();
    addToHistory(article.id);
}

function generateTOC() {
    const wikiBody = document.getElementById('wikiBody');
    const tocList = document.getElementById('tocList');
    if (!wikiBody || !tocList) return;

    const headings = wikiBody.querySelectorAll('h2');
    if (headings.length === 0) {
        const sidebar = document.querySelector('.toc-sidebar');
        if (sidebar) sidebar.style.display = 'none';
        return;
    }

    let tocHtml = '';
    headings.forEach((heading, index) => {
        const id = 'heading-' + index;
        heading.id = id;
        tocHtml += `<li><a href="#${id}">${heading.innerText}</a></li>`;
    });
    tocList.innerHTML = tocHtml;
}

function handleHeaderSearch(e) {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) navigateTo('search', val);
    }
}

function handleHeroSearch(e) {
    if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) navigateTo('search', val);
    }
}

function renderSearchPage(container, query) {
    const cleanQuery = query.toLowerCase().trim();
    const results = WIKI_DATA.articles.filter(a => a._search.includes(cleanQuery));

    let contentHtml = '';
    if (results.length > 0) {
        contentHtml = renderArticlesAsGrid(results);
    } else {
        contentHtml = `<p style="color: var(--text-muted); margin-top: 1rem;">Ничего не найдено по запросу "${escapeHtml(query)}".</p>`;
    }

    container.innerHTML = `
        <div class="container-narrow">
            <div class="article-breadcrumb">
                <a href="#" onclick="event.preventDefault(); navigateTo('home')">Wiki</a> / 
                <span>Поиск</span>
            </div>
            <div class="article-header">
                <h1>Результаты поиска</h1>
                <div class="article-subtitle">По запросу: "${escapeHtml(query)}"</div>
            </div>
            ${contentHtml}
        </div>
    `;
}

/* ==================== КЛАВИАТУРА, TOC, ЗАКРЫТИЕ ПАНЕЛЕЙ ==================== */
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleColorPickerModal(false);
            document.getElementById('sidebar').classList.remove('open');
        }
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-nav]')) {
            e.preventDefault();
            e.target.click();
        }
    });

    document.getElementById('mainContent').addEventListener('click', (e) => {
        const link = e.target.closest('.toc-list a');
        if (!link) return;
        e.preventDefault();
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });

    // клик по тегу статьи -> поиск по этому тегу
    document.getElementById('mainContent').addEventListener('click', (e) => {
        const chip = e.target.closest('.tag-chip');
        if (chip) navigateTo('search', chip.dataset.tag);
    });

    // закладки изменились в другой вкладке
    window.addEventListener('storage', (e) => {
        if (e.key !== LS_BOOKMARKS && e.key !== null) return;
        syncBookmarkUI();
        if (state.currentPage === 'bookmarks') renderBookmarksInPlace();
    });

    document.addEventListener('click', (e) => {
        const sb = document.getElementById('sidebar');
        if (sb.classList.contains('open') && !e.target.closest('#sidebar, #mobileMenuBtn')) {
            sb.classList.remove('open');
        }
    });
});

/* ==================== ПАУЗА АНИМАЦИЙ В ФОНОВОЙ ВКЛАДКЕ ==================== */
document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('tab-hidden', document.hidden);
});