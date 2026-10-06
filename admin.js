/* =====================================================================
   Spatium Wiki — АДМИН-ПАНЕЛЬ (редактор статей)
   Подключается в index.html ПОСЛЕ script.js.

   Как открыть:  F12 → Console → введи   admin()   и нажми Enter.

   Как это работает:
     • Правки сохраняются как ЧЕРНОВИК в браузере (localStorage) и сразу
       видны на сайте — но только у тебя. Посетители ничего не видят.
     • Кнопка «Получить код» выдаёт готовый articles.js. Скопируй его,
       замени им файл articles.js на хостинге/в репозитории — и правки
       станут публичными. Черновик после этого очистится сам.

   Другие команды консоли:
     spatiumAdmin.code()   — вернуть код articles.js строкой
     spatiumAdmin.reset()  — сбросить все неопубликованные правки
   ===================================================================== */
(function () {
    'use strict';
    if (typeof WIKI_DATA === 'undefined') return;

    /* ==================== УТИЛИТЫ ==================== */
    const LS_DRAFT = 'spatium_wiki_draft';
    const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const q = JSON.stringify;
    const BT = '`';
    const clone = o => JSON.parse(JSON.stringify(o));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const $ = (sel, root) => (root || document).querySelector(sel);

    function hash(str) { // cyrb53
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    const TR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
    const slugify = s => String(s).toLowerCase().split('').map(c => (TR[c] !== undefined ? TR[c] : c)).join('')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    function todayRu() {
        const d = new Date();
        return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }

    /* Убираем общий отступ и пустые края, чтобы текст в редакторе был «чистым».
       При экспорте отступ возвращается, поэтому файл остаётся аккуратным. */
    function normContent(s) {
        const lines = String(s || '').replace(/\r\n?/g, '\n').split('\n')
            .map(l => (/^\s*$/.test(l) ? '' : l.replace(/\s+$/, '')));
        while (lines.length && lines[0] === '') lines.shift();
        while (lines.length && lines[lines.length - 1] === '') lines.pop();
        let min = Infinity;
        lines.forEach(l => { if (l) min = Math.min(min, l.match(/^[ \t]*/)[0].length); });
        if (!isFinite(min)) min = 0;
        return lines.map(l => l.slice(min)).join('\n');
    }

    function cleanArticle(a) {
        const o = { id: String(a.id || ''), categoryId: String(a.categoryId || ''), title: String(a.title || ''), subtitle: String(a.subtitle || '') };
        if (a.image) o.image = String(a.image); else if (a.icon) o.icon = String(a.icon);
        o.updatedAt = String(a.updatedAt || '');
        o.popular = !!a.popular;
        if (Array.isArray(a.tags) && a.tags.length) o.tags = a.tags.map(String);
        o.content = normContent(a.content);
        return o;
    }
    function cleanCategory(c) {
        return { id: String(c.id || ''), name: String(c.name || ''), icon: String(c.icon || ''), desc: String(c.desc || '') };
    }
    function cleanData(d) {
        return { categories: d.categories.map(cleanCategory), articles: d.articles.map(cleanArticle) };
    }
    const sig = d => hash(JSON.stringify(cleanData(d)));

    /* ==================== МЕДИАТЕКА ==================== */
    /* Загруженные картинки лежат в браузере (localStorage) и подставляются на сайте
       вместо путей img/имя.png. Чтобы файлы увидели все — скачай ZIP и положи в папку img/. */
    const LS_MEDIA = 'spatium_wiki_media';
    const MIME_EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' };
    let media = {};
    try { media = JSON.parse(localStorage.getItem(LS_MEDIA)) || {}; } catch (e) { media = {}; }

    function saveMedia() {
        try { localStorage.setItem(LS_MEDIA, JSON.stringify(media)); return true; }
        catch (e) { toast('Не хватает места в браузере. Скачай ZIP и удали лишние файлы'); return false; }
    }
    function fmtSize(b) { return b < 1024 ? b + ' Б' : b < 1048576 ? (b / 1024).toFixed(1) + ' КБ' : (b / 1048576).toFixed(2) + ' МБ'; }
    function resolvePath(p) {
        const m = /^img\/(.+)$/.exec(p || '');
        return m && media[m[1]] ? media[m[1]].data : p;
    }
    function resolveMedia(html) {
        if (!html || !Object.keys(media).length) return html;
        return String(html).replace(/(["'(])img\/([^"'()\s<>]+)/g, (all, pre, name) => media[name] ? pre + media[name].data : all);
    }
    function mediaUsage(n) {
        const p = 'img/' + n;
        return work.articles.filter(a => a.content.includes(p) || a.image === p).length;
    }
    const fileToDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
    const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

    async function prepareImage(file) {
        let data = await fileToDataURL(file), type = file.type;
        if (/^image\/(png|jpeg|webp)$/.test(type) && file.size > 350 * 1024) {
            const img = await loadImg(data);
            const k = Math.min(1, 1600 / Math.max(img.width, img.height));
            if (k < 1 || file.size > 1500 * 1024) { // большие картинки уменьшаем, чтобы влезли в браузерное хранилище
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(img.width * k));
                c.height = Math.max(1, Math.round(img.height * k));
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                type = type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                data = c.toDataURL(type, 0.88);
            }
        }
        return { data, type };
    }
    function uniqueName(orig, type) {
        const base = slugify(String(orig).replace(/\.[^.]*$/, '')) || 'image';
        const ext = MIME_EXT[type] || '.png';
        let n = base + ext, i = 2;
        while (media[n]) n = `${base}-${i++}${ext}`;
        return n;
    }
    async function addFiles(files) {
        const added = [];
        for (const f of files) {
            if (!MIME_EXT[f.type]) { toast(`«${f.name}»: поддерживаются PNG, JPG, WebP, GIF, SVG`); continue; }
            try {
                const { data, type } = await prepareImage(f);
                const name = uniqueName(f.name, type);
                media[name] = { data, type, size: Math.round((data.length - data.indexOf(',') - 1) * 0.75), added: Date.now() };
                if (!saveMedia()) { delete media[name]; break; }
                added.push(name);
            } catch (e) { toast(`Не удалось прочитать «${f.name}»`); }
        }
        if (added.length) {
            refreshSite();
            if (root && view === 'media') renderMain();
            toast(added.length === 1 ? `Загружено: img/${added[0]}` : `Загружено файлов: ${added.length}`);
        }
        return added;
    }
    function renameMedia(old, nu) {
        if (!/^[a-z0-9][a-z0-9._-]*\.[a-z0-9]+$/i.test(nu)) return toast('Имя: латиница, цифры, - _ . и расширение (например sword.png)');
        if (media[nu]) return toast('Файл с таким именем уже есть');
        media[nu] = media[old]; delete media[old]; saveMedia();
        const from = 'img/' + old, to = 'img/' + nu;
        work.articles.forEach(a => { a.content = a.content.split(from).join(to); if (a.image === from) a.image = to; });
        if (cur) { cur.content = cur.content.split(from).join(to); if (cur.media === from) cur.media = to; }
        saveDraft(); refreshSite(); renderAll(); updatePill();
        toast(`Переименовано; ссылки в статьях обновлены`);
    }

    /* ---- скачивание и ZIP (без внешних библиотек) ---- */
    function dl(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    }
    function dataToBytes(d) {
        const b = atob(d.slice(d.indexOf(',') + 1)), u = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        return u;
    }
    const CRC_T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    function crc32(u8) { let c = -1; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
    function makeZip(files) {
        const enc = new TextEncoder(), parts = [], central = [];
        let off = 0;
        files.forEach(f => {
            const nb = enc.encode(f.name), crc = crc32(f.bytes), sz = f.bytes.length;
            const h = new DataView(new ArrayBuffer(30));
            h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
            h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true);
            h.setUint16(26, nb.length, true);
            parts.push(new Uint8Array(h.buffer), nb, f.bytes);
            const c = new DataView(new ArrayBuffer(46));
            c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
            c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true);
            c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
            central.push(new Uint8Array(c.buffer), nb);
            off += 30 + nb.length + sz;
        });
        let csize = 0; central.forEach(p => { csize += p.length; });
        const e = new DataView(new ArrayBuffer(22));
        e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
        e.setUint32(12, csize, true); e.setUint32(16, off, true);
        return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
    }
    function downloadZip() {
        const names = Object.keys(media);
        if (!names.length) return;
        dl(makeZip(names.map(n => ({ name: 'img/' + n, bytes: dataToBytes(media[n].data) }))), 'spatium-img.zip');
        toast('ZIP скачан: распакуй его в корень сайта (появится папка img/)');
    }

    /* ==================== ДИАЛОГИ ==================== */
    const fld = (label, html, cls) => `<label class="adm-f ${cls || ''}"><span>${label}</span>${html}</label>`;
    const inp = (name, val, ph, extra) => `<input class="adm-input" name="${name}" value="${esc(val || '')}" placeholder="${esc(ph || '')}" spellcheck="false" ${extra || ''}>`;
    const selHtml = (name, opts, val) => `<select class="adm-input" name="${name}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, isFinite(n) ? n : a));

    function dialog(title, body, onOk, opt) {
        opt = opt || {};
        const m = document.createElement('div');
        m.className = 'adm-modal adm-dlg';
        m.innerHTML = `<div class="adm-modal-box adm-dlg-box"><h3>${title}</h3><div class="adm-dlg-body">${body}</div>
            <div class="adm-modal-actions">${opt.noOk ? '' : `<button class="adm-btn primary" data-dlg="ok">${opt.ok || 'Вставить'}</button>`}<span class="adm-spacer"></span><button class="adm-btn" data-dlg="cancel">${opt.noOk ? 'Закрыть' : 'Отмена'}</button></div></div>`;
        root.appendChild(m);
        const values = () => {
            const o = {};
            m.querySelectorAll('[name]').forEach(el => {
                if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
                else o[el.name] = el.type === 'checkbox' ? el.checked : el.value;
            });
            return o;
        };
        m.addEventListener('click', e => {
            const b = e.target.closest('[data-dlg]');
            if (b) {
                e.stopPropagation();
                if (b.dataset.dlg === 'ok') { if (onOk(values(), m) !== false) m.remove(); } else m.remove();
            } else if (e.target === m) m.remove();
        });
        m.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !opt.noOk && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') {
                e.preventDefault();
                const ok = m.querySelector('[data-dlg="ok"]'); if (ok) ok.click();
            }
        });
        if (opt.init) opt.init(m);
        const f = m.querySelector('input:not([type=hidden]):not([type=radio]):not([type=file]),textarea,select');
        if (f) f.focus();
        return m;
    }

    /* выбор картинки из медиатеки внутри диалога */
    function pickerInner() {
        const names = Object.keys(media).sort();
        return `<div class="adm-pick">${names.map(n => `<button type="button" class="adm-pickitem" data-pickname="${esc(n)}" title="${esc(n)}"><img src="${media[n].data}" alt=""></button>`).join('') || '<span class="adm-hint">Медиатека пуста — загрузи файл</span>'}</div>
            <button type="button" class="adm-btn sm" data-dlgupload><i class="fa-solid fa-upload"></i> Загрузить файл</button>
            <input type="file" accept="image/*" multiple hidden data-dlgfile>`;
    }
    function bindPicker(m, field, multi) {
        const wrap = m.querySelector('.adm-pickwrap');
        const set = name => {
            const el = m.querySelector(`[name="${field}"]`), p = 'img/' + name;
            el.value = multi ? (el.value.trim() ? el.value.replace(/\s+$/, '') + '\n' : '') + p : p;
            wrap.querySelectorAll('.adm-pickitem').forEach(b => b.classList.toggle('on', b.dataset.pickname === name));
        };
        m.addEventListener('click', e => {
            const p = e.target.closest('[data-pickname]');
            if (p) { set(p.dataset.pickname); return; }
            if (e.target.closest('[data-dlgupload]')) wrap.querySelector('[data-dlgfile]').click();
        });
        m.addEventListener('change', async e => {
            if (!e.target.matches('[data-dlgfile]')) return;
            const names = await addFiles([...e.target.files]);
            wrap.innerHTML = pickerInner();
            names.forEach(set);
        });
    }
    function mediaPickDialog(onPick) {
        dialog('Картинка из медиатеки',
            fld('Путь к файлу', inp('src', 'img/', 'img/файл.png')) + `<div class="adm-pickwrap">${pickerInner()}</div>`,
            o => { const v = o.src.trim(); if (!v || v === 'img/') { toast('Выбери файл'); return false; } onPick(v); },
            { ok: 'Выбрать', init: m => bindPicker(m, 'src') });
    }

    /* ---- иконки Font Awesome ---- */
    const ICONS = ('house house-chimney user users user-group user-ninja user-secret user-shield user-astronaut user-tie person person-running child robot ghost skull skull-crossbones dragon spider bug cat dog horse fish frog crow dove bone paw feather worm gear gears wrench screwdriver-wrench toolbox hammer scissors magnet plug battery-full bolt fire fire-flame-curved bomb burst explosion meteor sun moon star cloud snowflake droplet wind temperature-half umbrella leaf tree seedling wheat-awn carrot apple-whole lemon egg cheese bread-slice cookie burger pizza-slice drumstick-bite mug-hot wine-bottle ice-cream pepper-hot rocket book book-open book-bookmark bookmark scroll clipboard clipboard-list list list-check list-ol file file-lines folder folder-open image images video music headphones microphone gamepad dice chess chess-knight chess-rook chess-pawn puzzle-piece ticket gift cake-candles trophy medal award crown gem star-half-stroke heart heart-pulse shield shield-halved gavel scale-balanced lock unlock key flag compass map map-location-dot location-dot globe earth-americas mountain campground tent igloo castle landmark church tower-observation ship anchor sailboat car truck train plane bicycle coins sack-dollar money-bill-wave cart-shopping bag-shopping store tag tags percent chart-line chart-simple chart-pie ranking calendar calendar-days calendar-check clock stopwatch hourglass-half flask flask-vial hat-wizard hat-cowboy wand-magic wand-magic-sparkles wand-sparkles shirt mitten glasses mask masks-theater palette paintbrush pen pen-nib pencil terminal code database server microchip network-wired wifi link share-nodes download upload magnifying-glass filter bars trash trash-can floppy-disk copy paste print eye eye-slash bell envelope message comments comment-dots phone handshake hand hand-fist thumbs-up thumbs-down face-smile face-laugh circle-info circle-question circle-exclamation triangle-exclamation circle-check circle-xmark ban check xmark plus minus play pause stop forward rotate arrow-right arrow-up cubes cube cubes-stacked box box-open boxes-stacked').split(' ');

    function iconPicker(onPick) {
        dialog('Иконка Font Awesome',
            `<input class="adm-input" name="q" placeholder="Поиск: fire, sword, user…" autocomplete="off">
             <div class="adm-icons"></div>
             <div class="adm-hint">Нет нужной? Впиши любое имя иконки (например <code>dragon</code>) и нажми Enter.</div>`,
            null, {
                noOk: true,
                init(m) {
                    const grid = m.querySelector('.adm-icons'), q = m.querySelector('[name=q]');
                    const draw = () => {
                        const s = q.value.trim().toLowerCase().replace(/^fa-/, '');
                        grid.innerHTML = ICONS.filter(n => !s || n.includes(s)).map(n => `<button type="button" class="adm-icon" data-ic="${n}" title="${n}"><i class="fa-solid fa-${n}"></i></button>`).join('')
                            || `<span class="adm-hint">Нет в списке — Enter, чтобы взять «fa-${esc(s)}»</span>`;
                    };
                    draw();
                    q.addEventListener('input', draw);
                    q.addEventListener('keydown', e => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const s = q.value.trim().replace(/^fa-/, '');
                        if (s) { onPick('fa-' + s); m.remove(); }
                    });
                    grid.addEventListener('click', e => {
                        const b = e.target.closest('[data-ic]');
                        if (b) { onPick('fa-' + b.dataset.ic); m.remove(); }
                    });
                }
            });
    }

    /* ==================== ШАБЛОНЫ СТАТЕЙ ==================== */
    const TEMPLATES = {
        blank: {
            name: 'Пустая статья', desc: 'Только заголовок раздела', icon: 'fa-file-lines', cat: '',
            content: '<p>Текст статьи…</p>\n\n<h2>Первый раздел</h2>\n<p></p>'
        },
        item: {
            name: 'Предмет', desc: 'Инфобокс, получение, применение', icon: 'fa-box-open', cat: 'items',
            content: '<aside class="wiki-infobox">\n    <div class="wiki-infobox-title">Название предмета</div>\n    <table class="wiki-table">\n        <tbody>\n            <tr><th>Тип</th><td>Инструмент</td></tr>\n            <tr><th>Редкость</th><td>Обычный</td></tr>\n            <tr><th>Прочность</th><td>—</td></tr>\n        </tbody>\n    </table>\n</aside>\n\n<p><strong>Название предмета</strong> — короткое описание: что это и зачем нужно.</p>\n\n<h2>Получение</h2>\n<p>Как добыть или скрафтить предмет.</p>\n\n<h2>Применение</h2>\n<p>Где используется.</p>\n\n<div class="wiki-callout info">\n    <i class="fa-solid fa-circle-info"></i>\n    <div>Полезная подсказка.</div>\n</div>'
        },
        block: {
            name: 'Блок', desc: 'Параметры добычи и выпадения', icon: 'fa-cubes', cat: 'blocks',
            content: '<p><strong>Название блока</strong> — описание блока и его роли на сервере.</p>\n\n<h2>Информация о блоке</h2>\n<table class="wiki-table">\n    <thead>\n        <tr>\n            <th>Параметр</th>\n            <th>Значение</th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr>\n            <td>Прочность</td>\n            <td>—</td>\n        </tr>\n        <tr>\n            <td>Выпадение</td>\n            <td>—</td>\n        </tr>\n    </tbody>\n</table>\n\n<h2>Где найти</h2>\n<p></p>'
        },
        command: {
            name: 'Команды', desc: 'Таблица команд с описанием', icon: 'fa-terminal', cat: 'commands',
            content: '<p>Список команд для этого раздела.</p>\n\n<h2>Команды</h2>\n<table class="wiki-table">\n    <thead>\n        <tr>\n            <th>Команда</th>\n            <th>Описание</th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr>\n            <td><code>/команда</code></td>\n            <td>Что делает.</td>\n        </tr>\n    </tbody>\n</table>'
        },
        guide: {
            name: 'Руководство', desc: 'Шаги, подсказка и «Смотрите также»', icon: 'fa-list-check', cat: 'getting-started',
            content: '<p>Коротко, о чём это руководство.</p>\n\n<h2>1. Первый шаг</h2>\n<p></p>\n\n<h2>2. Второй шаг</h2>\n<p></p>\n\n<div class="wiki-callout success">\n    <i class="fa-solid fa-lightbulb"></i>\n    <div><strong>Совет:</strong> </div>\n</div>'
        }
    };

    /* ==================== ПРОВЕРКА СТАТЬИ ==================== */
    function lint(html) {
        const text = html.replace(/<[^>]*>/g, ' ');
        const r = {
            words: (text.match(/[\p{L}\p{N}]+/gu) || []).length,
            chars: text.replace(/\s+/g, ' ').trim().length,
            h2: (html.match(/<h2[\s>]/gi) || []).length,
            imgs: (html.match(/<img[\s>]/gi) || []).length,
            links: (html.match(/<a[\s>]/gi) || []).length,
            warns: []
        };
        const ids = new Set(work.articles.map(a => a.id)), cats = new Set(work.categories.map(c => c.id));
        const bad = new Set();
        for (const m of html.matchAll(/navigateTo\('article',\s*'([^']+)'\)/g)) if (!ids.has(m[1])) bad.add(m[1]);
        for (const m of html.matchAll(/navigateTo\('category',\s*'([^']+)'\)/g)) if (!cats.has(m[1])) bad.add(m[1]);
        bad.forEach(id => r.warns.push(`Ссылка на несуществующую страницу «${id}»`));
        ['div', 'ul', 'ol', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'a', 'strong', 'em', 'span', 'details', 'figure', 'blockquote', 'pre', 'aside', 'h2', 'h3', 'p'].forEach(t => {
            const o = (html.match(new RegExp('<' + t + '[\\s>]', 'gi')) || []).length;
            const c = (html.match(new RegExp('</' + t + '>', 'gi')) || []).length;
            if (o !== c) r.warns.push(`Не совпадает число <${t}>: открыто ${o}, закрыто ${c}`);
        });
        const noAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;
        if (noAlt) r.warns.push(`Картинок без alt: ${noAlt}`);
        return r;
    }

    /* ==================== ИСТОРИЯ ПРАВОК (отмена / повтор) ==================== */
    let hist = { s: [''], i: 0 }, histT = 0;
    function histReset(v) { clearTimeout(histT); hist = { s: [v], i: 0 }; }
    function histCommit(v) {
        if (hist.s[hist.i] === v) return;
        hist.s = hist.s.slice(0, hist.i + 1);
        hist.s.push(v);
        if (hist.s.length > 300) hist.s.shift();
        hist.i = hist.s.length - 1;
    }
    function histPush(v) { clearTimeout(histT); histT = setTimeout(() => histCommit(v), 400); }
    function histGo(d) {
        const ta = $('#admContent', root);
        if (!ta || !cur) return;
        clearTimeout(histT); histCommit(ta.value);
        const j = hist.i + d;
        if (j < 0 || j >= hist.s.length) return;
        hist.i = j; ta.value = hist.s[j]; cur.content = ta.value;
        formDirty = true; updatePreview(); markState();
    }

    /* ==================== ИМПОРТ / ЭКСПОРТ ==================== */
    function exportJson() {
        const payload = { app: 'spatium-wiki', version: 1, exportedAt: new Date().toISOString(), data: cleanData(work), media };
        dl(new Blob([JSON.stringify(payload)], { type: 'application/json' }), `spatium-wiki-backup-${new Date().toISOString().slice(0, 10)}.json`);
        toast('Резервная копия скачана (статьи + медиа)');
    }
    function importFile(f) {
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            const txt = String(r.result);
            let d = null, mm = null;
            try {
                if (/\.json$/i.test(f.name) || (txt.trim()[0] === '{' && !/WIKI_DATA/.test(txt))) {
                    const j = JSON.parse(txt); d = j.data || j; mm = j.media || null;
                } else {
                    if (!confirm('Файл .js будет выполнен как скрипт, чтобы прочитать данные. Импортируй только свой articles.js. Продолжить?')) return;
                    d = (new Function(txt + '\n;return WIKI_DATA;'))();
                }
            } catch (err) { toast('Не удалось прочитать файл: ' + err.message); return; }
            if (!d || !Array.isArray(d.categories) || !Array.isArray(d.articles)) { toast('В файле нет categories и articles'); return; }
            if (!confirm(`Заменить текущее содержимое (статей: ${work.articles.length}) импортированным (статей: ${d.articles.length})?`)) return;
            work = cleanData(d);
            if (mm && typeof mm === 'object') { Object.assign(media, mm); saveMedia(); }
            cur = null; curId = null; isNew = false; formDirty = catDirty = false;
            saveDraft(); refreshSite(); renderAll(); updatePill();
            toast('Импортировано. Не забудь «Получить код», чтобы опубликовать');
        };
        r.readAsText(f);
    }

    /* ==================== ДАННЫЕ И ЧЕРНОВИК ==================== */
    const ORIGINAL = cleanData(WIKI_DATA);   // то, что сейчас лежит в articles.js
    const origSig = sig(ORIGINAL);
    const origArt = new Map(ORIGINAL.articles.map(a => [a.id, q(a)]));

    let work = clone(ORIGINAL);              // рабочая копия
    let draft = null;
    let conflict = false;

    function readDraft() {
        try { return JSON.parse(localStorage.getItem(LS_DRAFT)); } catch (e) { return null; }
    }
    function clearDraft() { try { localStorage.removeItem(LS_DRAFT); } catch (e) {} draft = null; }

    function indexArticle(a) {
        a._search = `${a.title} ${a.subtitle} ${a.content.replace(/<[^>]*>/g, ' ')}`.toLowerCase();
        return a;
    }
    /* Кладёт рабочую копию в WIKI_DATA, которым пользуется сайт */
    function applyToSite() {
        const d = cleanData(work);
        WIKI_DATA.categories = d.categories;
        WIKI_DATA.articles = d.articles.map(a => {
            a.content = resolveMedia(a.content);               // загруженные картинки видны на сайте сразу
            if (a.image) a.image = resolvePath(a.image);
            return indexArticle(a);
        });
    }
    function refreshSite() {
        applyToSite();
        try {
            if (typeof renderSidebar === 'function') renderSidebar();
            const p = state.currentPage, prm = state.currentParam;
            if ((p === 'article' && !WIKI_DATA.articles.some(a => a.id === prm)) ||
                (p === 'category' && !WIKI_DATA.categories.some(c => c.id === prm))) {
                navigateTo('home');
            } else {
                renderContent();
            }
        } catch (e) { console.warn('[admin] не удалось обновить страницу', e); }
    }
    function saveDraft() {
        const data = cleanData(work);
        const payload = { baseSig: origSig, resultSig: sig(data), savedAt: Date.now(), data };
        try { localStorage.setItem(LS_DRAFT, JSON.stringify(payload)); draft = payload; }
        catch (e) { toast('Не удалось сохранить черновик в браузере'); }
        conflict = false;
    }
    const hasChanges = () => sig(work) !== origSig;

    /* Загрузка черновика при старте (до первой отрисовки сайта) */
    draft = readDraft();
    if (draft) {
        if (draft.resultSig === origSig) clearDraft();                 // уже опубликован
        else if (draft.baseSig === origSig && draft.data) { work = cleanData(draft.data); applyToSite(); }
        else conflict = true;                                          // articles.js изменился
    }

    /* ==================== КОД articles.js ==================== */
    const HEADER = [
        '/* =====================================================================',
        '   Spatium Wiki — БАЗА СТАТЕЙ',
        '   Этот файл подключается в index.html ПЕРЕД script.js.',
        '   Файл создан админ-панелью (F12 → Console → admin()), но его можно',
        '   редактировать и вручную.',
        '',
        '   Поля статьи:',
        '     id          — уникальный латинский идентификатор (для ссылок)',
        '     categoryId  — id категории из списка categories ниже',
        '     title / subtitle — заголовок и короткое описание',
        '     image       — путь к картинке (ИЛИ icon — иконка Font Awesome)',
        '     updatedAt   — дата в формате «24 Сен 2026»',
        '     popular     — true, чтобы статья попала в «Популярные»',
        '     tags        — (необязательно) теги для «Похожих статей» и поиска: ["крафт", "руды"]',
        '     content     — HTML статьи (заголовки <h2> попадут в оглавление)',
        '   Ссылка на другую статью:',
        '     <a href="#" onclick="event.preventDefault(); navigateTo(\'article\', \'id-статьи\')">текст</a>',
        '   ===================================================================== */',
        '',
        '/* ==================== БАЗА ДАННЫХ WIKI ==================== */'
    ].join('\n');

    const escTpl = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

    function buildCode() {
        const d = cleanData(work);
        const cats = d.categories.map(c =>
            `        { id: ${q(c.id)}, name: ${q(c.name)}, icon: ${q(c.icon)}, desc: ${q(c.desc)} }`).join(',\n');
        const pad = ' '.repeat(16);
        const arts = d.articles.map(a => {
            const body = a.content ? a.content.split('\n').map(l => (l ? pad + escTpl(l) : '')).join('\n') : '';
            const media = a.image ? `            image: ${q(a.image)},\n` : a.icon ? `            icon: ${q(a.icon)},\n` : '';
            return '        {\n' +
                `            id: ${q(a.id)},\n` +
                `            categoryId: ${q(a.categoryId)},\n` +
                `            title: ${q(a.title)},\n` +
                `            subtitle: ${q(a.subtitle)},\n` +
                media +
                `            updatedAt: ${q(a.updatedAt)},\n` +
                `            popular: ${a.popular},\n` +
                (a.tags && a.tags.length ? `            tags: [${a.tags.map(t => q(t)).join(', ')}],\n` : '') +
                `            content: ${BT}\n${body}\n            ${BT}\n` +
                '        }';
        }).join(',\n');
        return `${HEADER}\nconst WIKI_DATA = {\n    categories: [\n${cats}\n    ],\n    articles: [\n${arts}\n    ]\n};\n`;
    }

    function diffSummary() {
        const d = cleanData(work);
        const cur = new Map(d.articles.map(a => [a.id, q(a)]));
        let added = 0, changed = 0, removed = 0;
        cur.forEach((v, id) => { if (!origArt.has(id)) added++; else if (origArt.get(id) !== v) changed++; });
        origArt.forEach((v, id) => { if (!cur.has(id)) removed++; });
        const cats = JSON.stringify(d.categories) !== JSON.stringify(ORIGINAL.categories);
        return { added, changed, removed, cats };
    }
    const artStatus = a => {
        if (!origArt.has(a.id)) return 'new';
        return q(cleanArticle(a)) !== origArt.get(a.id) ? 'changed' : '';
    };

    /* ==================== СТИЛИ ==================== */
    const CSS = `
.adm-root,.adm-root *{box-sizing:border-box}
.adm-root{position:fixed;inset:0;z-index:200000;display:flex;flex-direction:column;background:var(--bg-base);color:var(--text-primary);font-family:'Onest',system-ui,sans-serif;font-size:14px;line-height:1.5}
.adm-top{display:flex;align-items:center;gap:.5rem;padding:.55rem .9rem;border-bottom:2px solid var(--border-color);background:var(--bg-surface);flex-shrink:0}
.adm-brand{font-family:'Unbounded','Onest',sans-serif;font-weight:700;font-size:.85rem;display:flex;align-items:center;gap:.5rem;white-space:nowrap}
.adm-brand i{color:var(--accent)}
.adm-state{font-size:.78rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.adm-state b{color:var(--mc-gold);font-weight:600}
.adm-spacer{flex:1}
.adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.45rem .8rem;border:2px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font:inherit;font-weight:600;font-size:.82rem;cursor:pointer;border-radius:0;box-shadow:0 3px 0 var(--pixel-shadow);white-space:nowrap}
.adm-btn:hover{border-color:var(--accent);color:var(--accent)}
.adm-btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--pixel-shadow)}
.adm-btn.primary{background:var(--accent-gradient);border-color:transparent;color:#14161b}
.adm-btn.primary:hover{color:#14161b;filter:brightness(1.08)}
.adm-btn.danger:hover{border-color:#ff6b6b;color:#ff6b6b}
.adm-btn:disabled{opacity:.4;pointer-events:none}
.adm-btn.sm{padding:.3rem .55rem;font-size:.76rem;box-shadow:none}
.adm-menu-btn{display:none}
.adm-banner{display:none;padding:.6rem .9rem;background:rgba(255,170,0,.12);border-bottom:2px solid var(--mc-gold);font-size:.84rem;gap:.6rem;align-items:center;flex-wrap:wrap}
.adm-banner.show{display:flex}
.adm-body{flex:1;display:flex;min-height:0;position:relative}
.adm-side{width:292px;flex-shrink:0;border-right:2px solid var(--border-color);display:flex;flex-direction:column;min-height:0;background:var(--bg-base)}
.adm-tabs{display:flex;border-bottom:2px solid var(--border-color)}
.adm-tabs button{flex:1;padding:.6rem;background:transparent;border:0;border-bottom:3px solid transparent;color:var(--text-secondary);font:inherit;font-weight:600;cursor:pointer;margin-bottom:-2px}
.adm-tabs button.on{color:var(--accent);border-bottom-color:var(--accent)}
.adm-side-tools{padding:.7rem;display:flex;flex-direction:column;gap:.5rem}
.adm-list{flex:1;overflow:auto;padding:0 .4rem .6rem}
.adm-item{display:block;width:100%;text-align:left;padding:.5rem .65rem;margin-bottom:2px;border:2px solid transparent;background:transparent;color:inherit;font:inherit;cursor:pointer;border-radius:0}
.adm-item:hover{background:var(--bg-surface-hover)}
.adm-item.on{border-color:var(--accent);background:var(--accent-glow)}
.adm-item-t{font-weight:600;display:flex;align-items:center;gap:.4rem;justify-content:space-between}
.adm-item-t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adm-item-s{font-size:.74rem;color:var(--text-muted)}
.adm-badge{font-size:.62rem;padding:0 .35rem;border:1px solid currentColor;text-transform:uppercase;letter-spacing:.04em;flex-shrink:0}
.adm-badge.new{color:var(--mc-green)}.adm-badge.changed{color:var(--mc-gold)}
.adm-side-foot{padding:.7rem;border-top:2px solid var(--border-color)}
.adm-side-note{padding:.9rem;color:var(--text-secondary);font-size:.84rem}
.adm-main{flex:1;min-width:0;overflow:auto;padding:1.1rem 1.3rem 2rem}
.adm-head{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem}
.adm-head h2{font-family:'Unbounded','Onest',sans-serif;font-size:1.05rem;margin-right:auto}
.adm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem 1rem}
.adm-span2{grid-column:span 2}
.adm-f{display:flex;flex-direction:column;gap:.3rem;min-width:0}
.adm-f>span,.adm-lbl{font-size:.74rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em}
.adm-input{width:100%;padding:.5rem .65rem;background:var(--code-bg);border:2px solid var(--border-color);color:var(--text-primary);font:inherit;border-radius:0;outline:none}
.adm-input:focus{border-color:var(--accent)}
.adm-input[readonly]{opacity:.6}
.adm-hint{font-size:.74rem;color:var(--text-muted)}
.adm-muted{color:var(--text-muted)}
.adm-media{display:flex;gap:.5rem;align-items:center}
.adm-media label{display:flex;gap:.3rem;align-items:center;font-size:.82rem;white-space:nowrap;cursor:pointer}
.adm-media .adm-input{flex:1;min-width:0}
.adm-checks{display:flex;gap:1.2rem;flex-wrap:wrap;align-items:center;padding-top:.2rem}
.adm-checks label{display:flex;gap:.4rem;align-items:center;cursor:pointer;font-size:.88rem}
.adm-root input[type=checkbox],.adm-root input[type=radio]{accent-color:var(--accent);width:1rem;height:1rem}
.adm-tb{display:flex;flex-wrap:wrap;gap:.3rem;margin:1.1rem 0 .5rem;align-items:center}
.adm-tb select.adm-input{width:auto;padding:.3rem .5rem;font-size:.78rem}
.adm-panetabs{display:none;gap:.4rem;margin-bottom:.5rem}
.adm-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1rem;height:clamp(380px,62vh,760px)}
.adm-split textarea{height:100%;resize:none;font-family:'JetBrains Mono',ui-monospace,Consolas,monospace;font-size:13px;line-height:1.55;tab-size:4;white-space:pre;overflow:auto}
.adm-preview{overflow:auto;padding:1rem 1.2rem;border:2px solid var(--border-color);background:var(--bg-surface)}
.adm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8rem;height:60%;color:var(--text-muted);text-align:center}
.adm-empty i{font-size:2.4rem;color:var(--accent);opacity:.7}
.adm-cat{display:grid;grid-template-columns:150px 1fr 150px;gap:.6rem;padding:.8rem;border:2px solid var(--border-color);background:var(--bg-surface);margin-bottom:.7rem}
.adm-cat .adm-desc{grid-column:1 / span 3}
.adm-cat-actions{grid-column:1 / span 3;display:flex;gap:.4rem;align-items:center}
.adm-toast{position:absolute;left:50%;bottom:1.4rem;transform:translate(-50%,20px);background:var(--bg-surface-hover);border:2px solid var(--accent);padding:.6rem 1rem;opacity:0;pointer-events:none;transition:.25s;z-index:30;max-width:90vw;box-shadow:0 4px 0 var(--pixel-shadow)}
.adm-toast.show{opacity:1;transform:translate(-50%,0)}
.adm-modal{position:absolute;inset:0;z-index:20;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:1rem}
.adm-modal-box{width:min(920px,100%);max-height:100%;display:flex;flex-direction:column;gap:.8rem;background:var(--bg-base);border:2px solid var(--accent);padding:1.1rem;box-shadow:0 8px 0 var(--pixel-shadow)}
.adm-modal-box h3{font-family:'Unbounded','Onest',sans-serif;font-size:1rem}
.adm-modal-box textarea{flex:1;min-height:220px;resize:none;font-family:'JetBrains Mono',ui-monospace,Consolas,monospace;font-size:12px;white-space:pre}
.adm-modal-box ol{padding-left:1.2rem;color:var(--text-secondary);font-size:.86rem}
.adm-modal-actions{display:flex;gap:.5rem;flex-wrap:wrap}
.adm-pill{position:fixed;right:14px;bottom:14px;z-index:99000;display:none;align-items:center;gap:.5rem;padding:.5rem .8rem;border:2px solid var(--accent);background:var(--bg-base);color:var(--text-primary);font:600 .78rem 'Onest',sans-serif;cursor:pointer;box-shadow:0 4px 0 var(--pixel-shadow);border-radius:0}
.adm-pill.show{display:inline-flex}
.adm-pill i{color:var(--accent)}
@media (max-width:900px){
 .adm-menu-btn{display:inline-flex}
 .adm-side{position:absolute;left:0;top:0;bottom:0;z-index:10;width:min(310px,88vw);transform:translateX(-100%);transition:transform .2s}
 .adm-side.open{transform:none;box-shadow:8px 0 0 var(--pixel-shadow)}
 .adm-main{padding:.9rem .8rem 2rem}
 .adm-grid{grid-template-columns:minmax(0,1fr)}.adm-span2{grid-column:auto}
 .adm-panetabs{display:flex}
 .adm-split{grid-template-columns:minmax(0,1fr);height:62vh}
 .adm-split .adm-preview{display:none}
 .adm-show-preview .adm-split textarea{display:none}
 .adm-show-preview .adm-split .adm-preview{display:block}
 .adm-cat{grid-template-columns:1fr}.adm-cat .adm-desc,.adm-cat-actions{grid-column:auto}
}
.adm-tbg{display:flex;flex-wrap:wrap;gap:.25rem;align-items:center;padding:.3rem .5rem;border:2px solid var(--border-color);background:var(--bg-surface)}
.adm-tbl{font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-right:.3rem}
.adm-tb .adm-btn.sm{min-width:30px}
.adm-stats{display:flex;flex-wrap:wrap;gap:.3rem 1rem;margin-top:.6rem;font-size:.78rem;color:var(--text-muted)}
.adm-stats b{color:var(--text-primary)}
.adm-warn{color:var(--mc-gold)}
.adm-chk{display:flex;gap:.4rem;align-items:center;cursor:pointer}
.adm-side-foot .adm-row{display:flex;gap:.4rem}
.adm-side-tools select.adm-input{padding:.35rem .5rem}
.adm-dlg-box{width:min(600px,100%)}
.adm-dlg-body{overflow:auto;display:flex;flex-direction:column;gap:.8rem;min-height:0;padding-right:.2rem}
.adm-dlg-box textarea{flex:none;min-height:90px;resize:vertical;white-space:pre;font-family:'JetBrains Mono',ui-monospace,Consolas,monospace;font-size:12px}
.adm-pickwrap{display:flex;flex-direction:column;gap:.5rem;align-items:flex-start}
.adm-pick{display:flex;flex-wrap:wrap;gap:.4rem;max-height:150px;overflow:auto;width:100%}
.adm-pickitem{width:58px;height:58px;padding:2px;border:2px solid var(--border-color);background:var(--code-bg);cursor:pointer}
.adm-pickitem:hover,.adm-pickitem.on{border-color:var(--accent)}
.adm-pickitem img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated;display:block}
.adm-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:.3rem;max-height:46vh;overflow:auto}
.adm-icon{height:44px;border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);cursor:pointer;font-size:1.1rem}
.adm-icon:hover{border-color:var(--accent);color:var(--accent)}
.adm-color{width:100%;height:38px;padding:2px;background:var(--code-bg);border:2px solid var(--border-color);cursor:pointer}
.adm-swatches{display:flex;flex-wrap:wrap;gap:.35rem}
.adm-sw{width:28px;height:28px;border:2px solid var(--border-color);cursor:pointer}
.adm-sw:hover{border-color:var(--text-primary)}
.adm-drop{border:2px dashed var(--border-color);padding:1.4rem;text-align:center;color:var(--text-secondary);cursor:pointer}
.adm-drop:hover,.adm-drop.over{border-color:var(--accent);background:var(--accent-glow)}
.adm-mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.8rem}
.adm-mcard{border:2px solid var(--border-color);background:var(--bg-surface);display:flex;flex-direction:column}
.adm-thumb{height:130px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(rgba(128,128,128,.18) 0 25%,transparent 0 50%) 0 0/16px 16px}
.adm-thumb img{max-width:100%;max-height:100%;image-rendering:pixelated}
.adm-mbody{padding:.5rem .6rem;display:flex;flex-direction:column;gap:.25rem}
.adm-mname{font-weight:600;font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.adm-mact{display:flex;flex-wrap:wrap;gap:.25rem;margin-top:.3rem}
.adm-mact .adm-btn{padding:.25rem .45rem}
.adm-craftgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem}
.adm-checklist{display:flex;flex-direction:column;gap:.3rem;max-height:40vh;overflow:auto}
.adm-checklist label{display:flex;gap:.5rem;align-items:center;cursor:pointer}
.adm-tpls{display:grid;gap:.5rem}
.adm-tpl{display:flex;gap:.7rem;align-items:center;padding:.6rem .8rem;border:2px solid var(--border-color);cursor:pointer}
.adm-tpl:has(input:checked){border-color:var(--accent);background:var(--accent-glow)}
.adm-tpl i{color:var(--accent);font-size:1.2rem;width:1.4rem;text-align:center}
.adm-tpl small{display:block;color:var(--text-muted)}
.adm-music{display:inline-flex;align-items:center;gap:.4rem}
.adm-btn.on{border-color:var(--accent);color:var(--accent);background:var(--accent-glow)}
.adm-btn.on i{animation:admNote 2.4s ease-in-out infinite}
@keyframes admNote{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.adm-mstyle{width:auto !important;padding:.35rem .5rem !important;font-size:.78rem}
.adm-vol{width:84px;height:1rem;accent-color:var(--accent);cursor:pointer}
@media (prefers-reduced-motion:reduce){.adm-btn.on i{animation:none}}
@media (max-width:700px){.adm-vol{width:56px}.adm-mstyle{display:none}}
@media (max-width:700px){.adm-top .adm-btn span{display:none}.adm-state{display:none}}
`;

    function injectCSS() {
        if ($('#admStyle')) return;
        const st = document.createElement('style');
        st.id = 'admStyle';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    /* ==================== СПОКОЙНАЯ МУЗЫКА ====================
       Музыка не файл: она «играется» прямо в браузере (Web Audio).
       Стили: Лоу-фай (бит + электропиано + шум винила), Пианино (мягкие арпеджио),
       Эмбиент (длинные пэды). Ничего не скачивается и не лежит на хостинге.
       Запуск — кнопкой в шапке редактора.                                         */
    const LS_MUSIC = 'spatium_admin_music';
    const music = (function () {
        const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
        const rnd = (a, b) => a + Math.random() * (b - a);

        let ctx = null, master = null, bus = null, drumBus = null, noiseBuf = null;
        let timer = 0, offT = 0, switchT = 0;
        let playing = false, vol = 0.5, styleId = 'lofi';
        let nextT = 0, stepN = 0, aux = 0;

        function load() {
            try {
                const o = JSON.parse(localStorage.getItem(LS_MUSIC) || '{}');
                if (typeof o.vol === 'number') vol = Math.min(1, Math.max(0, o.vol));
                if (o.style && STYLES[o.style]) styleId = o.style;
                return !!o.on;
            } catch (e) { return false; }
        }
        function save() { try { localStorage.setItem(LS_MUSIC, JSON.stringify({ on: playing, vol, style: styleId })); } catch (e) {} }

        /* ---------- кирпичики звука ---------- */
        function reverbIR(c) {
            const len = Math.floor(c.sampleRate * 3.2), buf = c.createBuffer(2, len, c.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const d = buf.getChannelData(ch);
                for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
            }
            return buf;
        }
        function makeNoise(c) {
            const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            return buf;
        }
        // длинная нота-пэд с плавными атакой и затуханием
        function pad(freq, t, dur, type, peak, attack, release, detune) {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type; o.frequency.value = freq; o.detune.value = detune || 0;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(peak, t + attack);
            g.gain.setValueAtTime(peak, t + Math.max(attack, dur - release));
            g.gain.linearRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(bus);
            o.start(t); o.stop(t + dur + 0.1);
        }
        // щипок: «электропиано / пианино» — быстрая атака, плавный спад
        function key(m, t, peak, decay, out, bright) {
            const f = mtof(m), dst = out || bus;
            [[1, 1, 'sine'], [2, 0.28 * (bright || 1), 'sine'], [4, 0.06 * (bright || 1), 'sine']].forEach(([mul, k, type], i) => {
                const o = ctx.createOscillator(), g = ctx.createGain(), d = decay / (1 + i * 0.9);
                o.type = type; o.frequency.value = f * mul;
                o.detune.value = (Math.random() - .5) * 6;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.linearRampToValueAtTime(peak * k, t + 0.006);
                g.gain.exponentialRampToValueAtTime(0.0001, t + d);
                o.connect(g); g.connect(dst);
                o.start(t); o.stop(t + d + 0.05);
            });
        }
        function kick(t, peak) {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(130, t);
            o.frequency.exponentialRampToValueAtTime(42, t + 0.17);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(peak, t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
            o.connect(g); g.connect(drumBus);
            o.start(t); o.stop(t + 0.42);
        }
        function hit(t, filter, freq, peak, dur, q) { // шумовой удар: хэт, снейр
            const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
            src.buffer = noiseBuf;
            f.type = filter; f.frequency.value = freq; if (q) f.Q.value = q;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(peak, t + 0.002);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(f); f.connect(g); g.connect(drumBus);
            src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
        }
        function crackle() { // шум винила: тихий шорох + редкие щелчки
            const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.05 + (Math.random() < 0.0012 ? (Math.random() * 2 - 1) * 0.9 : 0);
            const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
            src.buffer = buf; src.loop = true;
            f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.4;
            g.gain.value = 0.16;
            src.connect(f); f.connect(g); g.connect(drumBus);
            src.start();
        }

        /* ---------- стили ---------- */
        const STYLES = {
            lofi: {
                name: 'Лоу-фай',
                e: 60 / 76 / 2,  // восьмая при 76 BPM
                // Dm9 → G13 → Cmaj9 → Am9, по два такта на аккорд
                chords: [[53, 57, 60, 64], [53, 59, 62, 64], [52, 55, 59, 62], [55, 59, 60, 64]],
                bass: [38, 43, 36, 45],
                pent: [72, 74, 76, 79, 81, 84],
                init() { crackle(); },
                step(i, t, e) {
                    const pos = i % 16, p8 = i % 8, ci = Math.floor(i / 16) % 4;
                    const tt = t + (i % 2 ? e * 0.28 : 0) + rnd(-0.007, 0.007); // свинг и «живая» рука
                    if (p8 === 0) kick(tt, 0.26);
                    if (p8 === 5 && Math.random() < 0.7) kick(tt, 0.2);
                    if (p8 === 2 || p8 === 6) { hit(tt, 'bandpass', 1900, 0.11, 0.2, 0.7); hit(tt, 'highpass', 900, 0.04, 0.12); }
                    if (Math.random() > 0.1) hit(tt, 'highpass', 7500, i % 2 ? 0.02 : 0.034, 0.05);
                    const ch = this.chords[ci];
                    if (pos === 0 || pos === 3 || (pos === 8 && Math.random() < 0.6)) {
                        const soft = pos === 0 ? 1 : 0.7;
                        ch.forEach((m, k) => key(m, tt + k * 0.013, 0.05 * soft, pos === 0 ? 2.2 : 1.2, bus, 1.2));
                    }
                    if (pos === 0 || (pos === 6 && Math.random() < 0.6)) key(this.bass[ci], tt, 0.16, 1.1, drumBus, 0.4);
                    if (p8 % 2 === 0 && Math.random() < 0.2) key(this.pent[Math.floor(Math.random() * this.pent.length)], tt, 0.032, 1.8, bus, 1.4);
                }
            },
            piano: {
                name: 'Пианино',
                e: 60 / 62 / 2,
                chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]], // Cmaj7 Am7 Fmaj7 G6
                bass: [36, 45, 41, 43],
                pat: [0, 1, 2, 3, 2, 1, 3, 2],
                step(i, t) {
                    const pos = i % 16, ci = Math.floor(i / 16) % 4;
                    const tt = t + rnd(-0.012, 0.012);
                    const ch = this.chords[ci];
                    const n = ch[this.pat[pos % 8]];
                    key(n, tt, 0.05 * (pos % 4 === 0 ? 1.15 : 0.85), 3, bus, 1);
                    if (pos === 0 || pos === 8) key(this.bass[ci], tt, 0.1, 4.5, bus, 0.3);
                    if (pos % 4 === 2 && Math.random() < 0.14) key(n + 12, tt + 0.03, 0.025, 3.5, bus, 1.3);
                }
            },
            ambient: {
                name: 'Эмбиент',
                chords: [
                    [45, 57, 60, 64, 67, 71], [41, 53, 57, 60, 64, 67],
                    [36, 55, 59, 62, 64, 71], [43, 55, 59, 62, 64, 69]
                ],
                bells: [69, 72, 74, 76, 79, 81, 84],
                run(now) {
                    while (nextT < now + 2) {
                        const ch = this.chords[stepN % this.chords.length]; stepN++;
                        ch.forEach((m, i) => {
                            const low = i === 0, peak = low ? 0.07 : 0.032;
                            pad(mtof(m), nextT, 14, low ? 'sine' : 'triangle', peak, 3.2, 5, rnd(-4, 4));
                            if (!low) pad(mtof(m), nextT, 14, 'sine', peak * 0.7, 3.8, 5, rnd(-5, 5));
                        });
                        nextT += 10;
                    }
                    while (aux < now + 2) {
                        if (Math.random() < 0.8) key(this.bells[Math.floor(Math.random() * this.bells.length)], aux, 0.045, 4.5, bus, 1.6);
                        aux += rnd(2.5, 7.5);
                    }
                }
            }
        };

        function tick() {
            if (!ctx) return;
            const st = STYLES[styleId], now = ctx.currentTime;
            if (st.run) { st.run(now); return; }
            while (nextT < now + 1) { st.step(stepN, nextT, st.e); stepN++; nextT += st.e; }
        }

        /* ---------- управление ---------- */
        function start() {
            if (playing) return true;
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            clearTimeout(offT); clearTimeout(switchT);
            try {
                if (!ctx) {
                    ctx = new AC();
                    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
                    drumBus = ctx.createGain(); drumBus.connect(master);
                    bus = ctx.createGain();
                    const lp = ctx.createBiquadFilter();
                    lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.3;
                    const dry = ctx.createGain(); dry.gain.value = 0.7;
                    const wet = ctx.createGain(); wet.gain.value = 0.5;
                    const rev = ctx.createConvolver(); rev.buffer = reverbIR(ctx);
                    bus.connect(lp); lp.connect(dry); dry.connect(master);
                    lp.connect(rev); rev.connect(wet); wet.connect(master);
                    noiseBuf = makeNoise(ctx);
                }
                if (ctx.state === 'suspended') ctx.resume();
            } catch (e) { ctx = null; return false; }
            playing = true; stepN = 0;
            nextT = ctx.currentTime + 0.1; aux = ctx.currentTime + 3;
            if (STYLES[styleId].init) STYLES[styleId].init();
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
            master.gain.linearRampToValueAtTime(vol * 0.9, ctx.currentTime + 2.5);
            tick(); clearInterval(timer); timer = setInterval(tick, 400);
            save();
            return true;
        }

        function stop(remember) {
            clearTimeout(switchT);
            if (!playing) return;
            playing = false;
            clearInterval(timer);
            const c = ctx, m = master;
            try {
                m.gain.cancelScheduledValues(c.currentTime);
                m.gain.setValueAtTime(m.gain.value, c.currentTime);
                m.gain.linearRampToValueAtTime(0, c.currentTime + 1.2);
            } catch (e) {}
            offT = setTimeout(() => { // после затухания выбрасываем контекст со всеми хвостами
                try { c.close(); } catch (e) {}
                if (ctx === c) { ctx = null; master = null; bus = null; drumBus = null; noiseBuf = null; }
            }, 1400);
            if (remember !== false) save();
        }

        let onState = null;
        function setStyle(id) {
            if (!STYLES[id] || id === styleId) return;
            styleId = id;
            if (playing) { // плавно гасим старый стиль и включаем новый
                stop(false);
                switchT = setTimeout(() => { start(); if (onState) onState(); }, 1500);
            } else save();
        }

        function setVol(v) {
            vol = Math.min(1, Math.max(0, v));
            if (playing && ctx) master.gain.setTargetAtTime(vol * 0.9, ctx.currentTime, 0.15);
            save();
        }

        return {
            start, stop, setVol, setStyle, load,
            set onState(f) { onState = f; },
            styles: Object.keys(STYLES).map(k => [k, STYLES[k].name]),
            get style() { return styleId; },
            get playing() { return playing; },
            get vol() { return vol; }
        };
    })();

    /* ==================== СОСТОЯНИЕ РЕДАКТОРА ==================== */
    let root = null;
    let view = 'articles';       // 'articles' | 'cats'
    let curId = null;            // id статьи в work (null для новой/ничего)
    let cur = null;              // форма редактируемой статьи
    let isNew = false;
    let idTouched = false;
    let formDirty = false;
    let catDirty = false;
    let search = '';
    let toastTimer = 0;
    let catSnap = null;          // снимок категорий для отката несохранённых правок
    let sortMode = 'date';       // сортировка списка статей: date | title | cat
    let filterCat = '';          // фильтр списка по категории

    function formFrom(a) {
        return {
            id: a.id, categoryId: a.categoryId, title: a.title, subtitle: a.subtitle,
            mediaType: a.image ? 'image' : (a.icon ? 'icon' : 'image'), media: a.image || a.icon || '',
            updatedAt: a.updatedAt, popular: !!a.popular, tags: (a.tags || []).join(', '), content: a.content, autoDate: true
        };
    }
    function emptyForm(tpl) {
        const t = TEMPLATES[tpl] || TEMPLATES.blank;
        const cat = work.categories.some(c => c.id === t.cat) ? t.cat : (work.categories[0] || {}).id || '';
        return {
            id: '', categoryId: cat, title: '', subtitle: '',
            mediaType: 'icon', media: t.icon, updatedAt: todayRu(), popular: false, tags: '',
            content: t.content, autoDate: true
        };
    }
    function newArticleDialog() {
        dialog('Новая статья',
            `<div class="adm-tpls">${Object.entries(TEMPLATES).map(([k, t], i) =>
                `<label class="adm-tpl"><input type="radio" name="tpl" value="${k}" ${i === 0 ? 'checked' : ''}><i class="fa-solid ${t.icon}"></i><span><b>${t.name}</b><small>${t.desc}</small></span></label>`).join('')}</div>`,
            o => {
                view = 'articles'; isNew = true; curId = null; idTouched = false; formDirty = false;
                cur = emptyForm(o.tpl);
                $('#admSide', root).classList.remove('open');
                renderAll();
            }, { ok: 'Создать' });
    }
    function setMediaField(v) {
        cur.media = v;
        const i = $('[data-f="media"]', root); if (i) i.value = v;
        formDirty = true; markState();
    }
    function imageHtml(o) {
        const src = (o.src || '').trim();
        if (!src || src === 'img/') return '';
        const img = `<img class="wiki-img" src="${esc(src)}" alt="${esc(o.alt || '')}" loading="lazy">`;
        const al = o.align && o.align !== 'none' ? ' align-' + o.align : '';
        const st = o.width && o.width !== 'auto' ? ` style="width:${o.width}%"` : '';
        if (!o.caption && !al && !st) return img;
        return `<figure class="wiki-figure${al}"${st}>\n    ${img}${o.caption ? `\n    <figcaption>${esc(o.caption)}</figcaption>` : ''}\n</figure>`;
    }
    function embedVideo(u) {
        u = u.trim();
        let m;
        if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/))) return `<div class="wiki-video">\n    <iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" title="Видео" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>\n</div>`;
        if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return `<div class="wiki-video">\n    <iframe src="https://player.vimeo.com/video/${m[1]}" title="Видео" loading="lazy" allowfullscreen></iframe>\n</div>`;
        if ((m = u.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]{32})/i))) return `<div class="wiki-video">\n    <iframe src="https://rutube.ru/play/embed/${m[1]}" title="Видео" loading="lazy" allowfullscreen></iframe>\n</div>`;
        // прямая ссылка или просто путь к файлу на сайте (например video/trailer.mp4)
        if (/\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i.test(u) || (u && !/^https?:|\s/i.test(u))) return `<video class="wiki-media" controls preload="metadata" src="${esc(u)}"></video>`;
        return '';
    }
    function toArticle(f) {
        const a = { id: f.id.trim(), categoryId: f.categoryId, title: f.title.trim(), subtitle: f.subtitle.trim() };
        const m = f.media.trim();
        if (m) a[f.mediaType === 'icon' ? 'icon' : 'image'] = m;
        a.updatedAt = f.updatedAt.trim();
        a.popular = !!f.popular;
        const tg = String(f.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        if (tg.length) a.tags = tg;
        a.content = f.content;
        return a;
    }
    const isDirty = () => formDirty || catDirty;
    function discardEdits() {
        if (catDirty && catSnap) work.categories = clone(catSnap);
        if (formDirty) { cur = null; curId = null; isNew = false; }
        formDirty = catDirty = false;
    }
    function confirmDiscard() {
        if (!isDirty()) return true;
        if (!confirm('Есть несохранённые изменения. Отбросить их?')) return false;
        discardEdits();
        return true;
    }

    /* ==================== ОТКРЫТИЕ / ЗАКРЫТИЕ ==================== */
    function open() {
        if (root) return;
        injectCSS();
        root = document.createElement('div');
        root.className = 'adm-root';
        root.innerHTML = `
            <div class="adm-top">
                <button class="adm-btn adm-menu-btn" data-act="toggle-side" aria-label="Список"><i class="fa-solid fa-bars"></i></button>
                <div class="adm-brand"><i class="fa-solid fa-screwdriver-wrench"></i> Spatium Admin</div>
                <div class="adm-state" id="admState"></div>
                <div class="adm-spacer"></div>
                <div class="adm-music">
                    <button class="adm-btn" data-act="music" id="admMusicBtn" title="Спокойная музыка" aria-pressed="false"><i class="fa-solid fa-music"></i><span>Музыка</span></button>
                    <select class="adm-input adm-mstyle" id="admMusicStyle" aria-label="Стиль музыки" title="Стиль музыки"></select>
                    <input type="range" class="adm-vol" id="admVol" min="0" max="100" aria-label="Громкость музыки" title="Громкость">
                </div>
                <button class="adm-btn" data-act="save" title="Ctrl+S"><i class="fa-regular fa-floppy-disk"></i><span>Сохранить</span></button>
                <button class="adm-btn primary" data-act="code"><i class="fa-solid fa-code"></i><span>Получить код</span></button>
                <button class="adm-btn" data-act="close" aria-label="Закрыть" title="Esc"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="adm-banner" id="admBanner"></div>
            <div class="adm-body">
                <aside class="adm-side" id="admSide">
                    <div class="adm-tabs">
                        <button data-act="view-articles" id="admTabA">Статьи</button>
                        <button data-act="view-cats" id="admTabC">Категории</button>
                        <button data-act="view-media" id="admTabM">Медиа</button>
                    </div>
                    <div id="admSideBody" style="display:flex;flex-direction:column;flex:1;min-height:0"></div>
                    <div class="adm-side-foot">
                        <div class="adm-row">
                            <button class="adm-btn sm" data-act="export" style="flex:1" title="Скачать статьи и картинки одним файлом"><i class="fa-solid fa-file-export"></i> Копия</button>
                            <button class="adm-btn sm" data-act="import" style="flex:1" title="Загрузить копию (.json) или articles.js"><i class="fa-solid fa-file-import"></i> Импорт</button>
                        </div>
                        <button class="adm-btn sm danger" data-act="reset" id="admResetBtn" style="width:100%;margin-top:.4rem"><i class="fa-solid fa-rotate-left"></i> Сбросить все правки</button>
                    </div>
                </aside>
                <main class="adm-main" id="admMain"></main>
            </div>
            <input type="file" id="admFile" accept="image/*" multiple hidden>
            <input type="file" id="admImport" accept=".json,.js,application/json" hidden>
            <div class="adm-toast" id="admToast"></div>`;
        document.body.appendChild(root);
        document.body.style.overflow = 'hidden';

        root.addEventListener('click', onClick);
        root.addEventListener('input', onInput);
        root.addEventListener('change', onChange);
        root.addEventListener('paste', onPaste);
        root.addEventListener('dragover', onDragOver);
        root.addEventListener('dragleave', () => { const d = $('#admDrop', root); if (d) d.classList.remove('over'); });
        root.addEventListener('drop', onDrop);
        window.addEventListener('beforeunload', onUnload);
        document.addEventListener('keydown', onKey, true);
        // превью не должно «жить»: ссылки внутри статьи на сайте не открываем
        root.addEventListener('click', e => {
            if (e.target.closest('#admPreview')) { e.preventDefault(); e.stopPropagation(); }
        }, true);

        // музыка: громкость + запоминание «включено». Браузер не даёт играть без клика,
        // поэтому если музыка была включена раньше — стартуем с первого клика/нажатия в редакторе.
        const vol = $('#admVol', root);
        vol.value = Math.round(music.vol * 100);
        vol.addEventListener('input', e => { e.stopPropagation(); music.setVol(vol.value / 100); });
        const wantMusic = music.load();
        vol.value = Math.round(music.vol * 100);
        const sel = $('#admMusicStyle', root);
        sel.innerHTML = music.styles.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('');
        sel.value = music.style;
        sel.addEventListener('change', e => { e.stopPropagation(); music.setStyle(sel.value); syncMusicBtn(); });
        music.onState = syncMusicBtn;
        if (wantMusic) {
            const resumeOnce = e => {
                if (e.target.closest('[data-act="music"]')) return; // сама кнопка разберётся
                if (root && !music.playing) { music.start(); syncMusicBtn(); }
            };
            root.addEventListener('pointerdown', resumeOnce, { once: true });
            root.addEventListener('keydown', resumeOnce, { once: true });
        }
        syncMusicBtn();

        renderAll();
    }

    function syncMusicBtn() {
        const b = root && $('#admMusicBtn', root);
        if (!b) return;
        b.classList.toggle('on', music.playing);
        b.setAttribute('aria-pressed', String(music.playing));
        b.title = music.playing ? 'Выключить музыку' : 'Включить спокойную музыку';
    }

    function close(force) {
        if (!root) return;
        if (!force && !confirmDiscard()) return;
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('beforeunload', onUnload);
        music.stop(false); // при закрытии музыка гаснет; «включено» помним до следующего раза
        root.remove();
        root = null;
        document.body.style.overflow = '';
        formDirty = catDirty = false;
        cur = null; curId = null; isNew = false;
        updatePill();
    }

    /* ==================== ОТРИСОВКА ==================== */
    function renderAll() {
        catSnap = clone(work.categories);
        $('#admTabA', root).classList.toggle('on', view === 'articles');
        $('#admTabC', root).classList.toggle('on', view === 'cats');
        $('#admTabM', root).classList.toggle('on', view === 'media');
        renderBanner();
        renderSide();
        renderMain();
        markState();
    }

    function renderBanner() {
        const b = $('#admBanner', root);
        if (!conflict || !draft) { b.classList.remove('show'); b.innerHTML = ''; return; }
        b.classList.add('show');
        b.innerHTML = `<span><i class="fa-solid fa-triangle-exclamation"></i> Найден старый черновик, но файл <b>articles.js</b> на сайте с тех пор изменился. Черновик не применён.</span>
            <button class="adm-btn sm" data-act="conflict-apply">Применить черновик поверх</button>
            <button class="adm-btn sm danger" data-act="conflict-drop">Удалить черновик</button>`;
    }

    function markState() {
        if (!root) return;
        const el = $('#admState', root);
        const ch = hasChanges();
        el.innerHTML = isDirty() ? '<b>● есть несохранённые изменения</b>'
            : (ch ? 'Черновик сохранён · не опубликован' : 'Без изменений');
        $('#admResetBtn', root).disabled = !ch && !draft;
    }

    function renderSide() {
        const body = $('#admSideBody', root);
        if (view === 'media') {
            body.innerHTML = `<div class="adm-side-note">Загруженные картинки сразу видны на сайте — но только у тебя.<br><br>Чтобы увидели все: <b>«Скачать всё (ZIP)»</b>, распакуй в корень сайта (появится папка <code>img/</code>) и выложи вместе с articles.js.<br><br>Картинки можно также перетащить или вставить (Ctrl+V) прямо в текст статьи.</div>`;
            return;
        }
        if (view === 'cats') {
            body.innerHTML = `<div class="adm-side-note">Категории появляются в боковом меню сайта в том же порядке, что и здесь. Меняй порядок стрелками.<br><br>ID существующей категории менять нельзя — на него ссылаются статьи.</div>`;
            return;
        }
        body.innerHTML = `
            <div class="adm-side-tools">
                <button class="adm-btn primary" data-act="new"><i class="fa-solid fa-plus"></i> Новая статья</button>
                <input class="adm-input" id="admSearch" placeholder="Поиск статьи…" value="${esc(search)}">
                <select class="adm-input" id="admFilt" title="Фильтр по категории"><option value="">Все категории</option>${work.categories.map(c => `<option value="${esc(c.id)}" ${c.id === filterCat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
                <select class="adm-input" id="admSort" title="Сортировка">
                    <option value="date" ${sortMode === 'date' ? 'selected' : ''}>Сначала новые</option>
                    <option value="title" ${sortMode === 'title' ? 'selected' : ''}>По названию</option>
                    <option value="cat" ${sortMode === 'cat' ? 'selected' : ''}>По категориям</option>
                </select>
            </div>
            <div class="adm-list" id="admList"></div>`;
        renderList();
    }

    function renderList() {
        const list = $('#admList', root);
        if (!list) return;
        const s = search.trim().toLowerCase();
        const ci = a => work.categories.findIndex(c => c.id === a.categoryId);
        const cmp = {
            date: (a, b) => parseRuDate(b.updatedAt) - parseRuDate(a.updatedAt),
            title: (a, b) => a.title.localeCompare(b.title, 'ru'),
            cat: (a, b) => ci(a) - ci(b) || a.title.localeCompare(b.title, 'ru')
        }[sortMode] || (() => 0);
        const items = [...work.articles]
            .filter(a => (!s || (a.title + ' ' + a.id).toLowerCase().includes(s)) && (!filterCat || a.categoryId === filterCat))
            .sort(cmp);
        list.innerHTML = items.length ? items.map(a => {
            const cat = work.categories.find(c => c.id === a.categoryId);
            const st = artStatus(a);
            return `<button class="adm-item ${(!isNew && a.id === curId) ? 'on' : ''}" data-act="pick" data-id="${esc(a.id)}">
                <div class="adm-item-t"><span>${esc(a.title || a.id)}</span>${st ? `<em class="adm-badge ${st}">${st === 'new' ? 'новая' : 'изм.'}</em>` : ''}</div>
                <div class="adm-item-s">${esc(cat ? cat.name : '— без категории —')} · ${esc(a.updatedAt)}</div>
            </button>`;
        }).join('') : '<div class="adm-side-note">Ничего не найдено</div>';
    }

    function renderMain() {
        const main = $('#admMain', root);
        root.classList.remove('adm-show-preview');
        if (view === 'media') { renderMedia(main); return; }
        if (view === 'cats') { renderCats(main); return; }
        if (!cur) {
            main.innerHTML = `<div class="adm-empty"><i class="fa-regular fa-pen-to-square"></i>
                <div>Выбери статью слева или создай новую</div>
                <button class="adm-btn primary" data-act="new"><i class="fa-solid fa-plus"></i> Новая статья</button></div>`;
            return;
        }
        const catOpts = work.categories.map(c => `<option value="${esc(c.id)}" ${c.id === cur.categoryId ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
        const linkOpts = work.articles.filter(a => a.id !== curId).map(a => `<option value="${esc(a.id)}">${esc(a.title || a.id)}</option>`).join('');
        const catLinkOpts = work.categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
        main.innerHTML = `
            <div class="adm-head">
                <h2>${isNew ? 'Новая статья' : 'Редактирование статьи'}</h2>
                ${isNew ? '' : `<button class="adm-btn sm" data-act="open-site"><i class="fa-solid fa-arrow-up-right-from-square"></i> Открыть на сайте</button>
                <button class="adm-btn sm" data-act="dup"><i class="fa-regular fa-clone"></i> Дублировать</button>
                <button class="adm-btn sm danger" data-act="delete"><i class="fa-regular fa-trash-can"></i> Удалить</button>`}
            </div>
            <div class="adm-grid">
                <label class="adm-f adm-span2"><span>Заголовок</span><input class="adm-input" data-f="title" value="${esc(cur.title)}" placeholder="Например: Руда Душ"></label>
                <label class="adm-f adm-span2"><span>Подзаголовок</span><input class="adm-input" data-f="subtitle" value="${esc(cur.subtitle)}" placeholder="Короткое описание для карточки"></label>
                <label class="adm-f"><span>ID (для ссылки)</span><input class="adm-input" data-f="id" value="${esc(cur.id)}" placeholder="ore-souls" spellcheck="false"></label>
                <label class="adm-f"><span>Категория</span><select class="adm-input" data-f="categoryId">${catOpts}</select></label>
                <div class="adm-f"><span>Картинка / иконка карточки</span>
                    <div class="adm-media">
                        <label><input type="radio" name="admMT" data-f="mediaType" value="image" ${cur.mediaType === 'image' ? 'checked' : ''}> Картинка</label>
                        <label><input type="radio" name="admMT" data-f="mediaType" value="icon" ${cur.mediaType === 'icon' ? 'checked' : ''}> Иконка</label>
                        <input class="adm-input" data-f="media" value="${esc(cur.media)}" spellcheck="false">
                        <button type="button" class="adm-btn sm" data-act="media-pick-field" title="Выбрать иконку или файл из медиатеки"><i class="fa-regular fa-images"></i></button>
                    </div>
                    <div class="adm-hint" id="admMediaHint"></div>
                </div>
                <label class="adm-f"><span>Дата обновления</span><input class="adm-input" data-f="updatedAt" value="${esc(cur.updatedAt)}"></label>
                <label class="adm-f adm-span2"><span>Теги (через запятую)</span><input class="adm-input" data-f="tags" value="${esc(cur.tags || '')}" placeholder="крафт, руды, ресурсы"></label>
                <div class="adm-checks adm-span2">
                    <label><input type="checkbox" data-f="popular" ${cur.popular ? 'checked' : ''}> Показывать в «Популярных»</label>
                    <label><input type="checkbox" data-f="autoDate" ${cur.autoDate ? 'checked' : ''}> Ставить сегодняшнюю дату при сохранении</label>
                </div>
            </div>

            <div class="adm-tb">${toolbarHtml(linkOpts, catLinkOpts)}</div>

            <div class="adm-panetabs">
                <button class="adm-btn sm" data-act="pane-code"><i class="fa-solid fa-code"></i> Код</button>
                <button class="adm-btn sm" data-act="pane-preview"><i class="fa-regular fa-eye"></i> Просмотр</button>
            </div>
            <div class="adm-split">
                <textarea class="adm-input" id="admContent" data-f="content" spellcheck="false">${esc(cur.content)}</textarea>
                <div class="adm-preview wiki-body" id="admPreview"></div>
            </div>
            <div class="adm-stats" id="admStats"></div>`;
        histReset(cur.content);
        updatePreview();
        updateMediaHint();
    }

    function updatePreview() {
        const p = $('#admPreview', root);
        if (p) p.innerHTML = cur.content.trim() ? resolveMedia(cur.content) : '<p class="adm-muted">Предпросмотр появится здесь…</p>';
        updateStats();
    }
    function updateStats() {
        const s = $('#admStats', root);
        if (!s || !cur) return;
        const r = lint(cur.content);
        s.innerHTML = `<span>Слов: <b>${r.words}</b></span><span>Символов: <b>${r.chars}</b></span><span>Разделов (H2): <b>${r.h2}</b></span><span>Картинок: <b>${r.imgs}</b></span><span>Ссылок: <b>${r.links}</b></span>`
            + r.warns.map(w => `<span class="adm-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(w)}</span>`).join('');
    }

    /* ==================== ПАНЕЛЬ ИНСТРУМЕНТОВ: РАЗМЕТКА ==================== */
    const ico = (c, t) => `<i class="fa-${c}"></i>${t ? ' ' + t : ''}`;
    const TB_GROUPS = [
        ['Правка', [
            ['undo', ico('solid fa-rotate-left'), 'Отменить (Ctrl+Z)'], ['redo', ico('solid fa-rotate-right'), 'Повторить (Ctrl+Y)'],
            ['find', ico('solid fa-magnifying-glass'), 'Найти и заменить (Ctrl+F)'], ['clear', ico('solid fa-eraser'), 'Убрать теги из выделенного']]],
        ['Текст', [
            ['h2', 'H2', 'Заголовок раздела (попадёт в оглавление)'], ['h3', 'H3'], ['h4', 'H4'],
            ['b', ico('solid fa-bold'), 'Жирный (Ctrl+B)'], ['i', ico('solid fa-italic'), 'Курсив (Ctrl+I)'], ['u', ico('solid fa-underline'), 'Подчёркнутый (Ctrl+U)'],
            ['s', ico('solid fa-strikethrough'), 'Зачёркнутый'], ['mark', ico('solid fa-highlighter'), 'Выделение маркером'], ['color', ico('solid fa-palette'), 'Цвет текста'],
            ['sup', 'x²', 'Верхний индекс'], ['sub', 'x₂', 'Нижний индекс'], ['kbd', ico('regular fa-keyboard'), 'Клавиша'], ['code', ico('solid fa-code'), 'Код / команда'],
            ['left', ico('solid fa-align-left'), 'По левому краю'], ['center', ico('solid fa-align-center'), 'По центру'], ['right', ico('solid fa-align-right'), 'По правому краю']]],
        ['Блоки', [
            ['ul', ico('solid fa-list-ul'), 'Маркированный список'], ['ol', ico('solid fa-list-ol'), 'Нумерованный список'], ['check', ico('solid fa-list-check'), 'Список с галочками'],
            ['quote', ico('solid fa-quote-left'), 'Цитата'], ['hr', ico('solid fa-minus'), 'Разделительная линия'], ['pre', ico('solid fa-file-code'), 'Блок кода'],
            ['table', ico('solid fa-table', 'Таблица')], ['details', ico('solid fa-caret-down', 'Спойлер')], ['cols', ico('solid fa-table-columns', 'Колонки')],
            ['infobox', ico('regular fa-id-card', 'Инфобокс')], ['craft', ico('solid fa-border-all', 'Крафт')]]],
        ['Подсказки', [
            ['info', ico('solid fa-circle-info', 'Инфо')], ['warning', ico('solid fa-triangle-exclamation', 'Важно')],
            ['success', ico('solid fa-lightbulb', 'Совет')], ['danger', ico('solid fa-circle-exclamation', 'Опасно')]]],
        ['Медиа', [
            ['img', ico('regular fa-image', 'Картинка')], ['gallery', ico('solid fa-images', 'Галерея')],
            ['video', ico('solid fa-film', 'Видео')], ['audio', ico('solid fa-volume-high', 'Аудио')], ['model', ico('solid fa-cube', '3D-модель Blockbench')], ['icon', ico('solid fa-icons', 'Иконка')]]],
        ['Ссылки', [
            ['url', ico('solid fa-link'), 'Ссылка (Ctrl+K)'], ['btn', ico('solid fa-hand-pointer', 'Кнопка')], ['seealso', ico('solid fa-diagram-project', 'Смотрите также')]]]
    ];
    function toolbarHtml(linkOpts, catLinkOpts) {
        return TB_GROUPS.map(([name, items]) => {
            const extra = name !== 'Ссылки' ? '' :
                `<select class="adm-input" data-link="1" title="Вставить ссылку на статью"><option value="">Статья…</option>${linkOpts}</select>
                 <select class="adm-input" data-catlink="1" title="Вставить ссылку на категорию"><option value="">Категория…</option>${catLinkOpts}</select>`;
            return `<div class="adm-tbg"><span class="adm-tbl">${name}</span>${items.map(([k, l, t]) =>
                `<button type="button" class="adm-btn sm" data-tb="${k}" title="${esc(t || '')}">${l}</button>`).join('')}${extra}</div>`;
        }).join('');
    }

    /* ==================== ВИД «МЕДИА» ==================== */
    function renderMedia(main) {
        const names = Object.keys(media).sort();
        const total = names.reduce((s, n) => s + (media[n].size || 0), 0);
        main.innerHTML = `
            <div class="adm-head"><h2>Медиатека</h2>
                <button class="adm-btn primary sm" data-act="media-upload"><i class="fa-solid fa-upload"></i> Загрузить</button>
                <button class="adm-btn sm" data-act="media-zip" ${names.length ? '' : 'disabled'}><i class="fa-solid fa-file-zipper"></i> Скачать всё (ZIP)</button></div>
            <div class="adm-drop" id="admDrop" data-act="media-upload"><i class="fa-solid fa-cloud-arrow-up"></i> Перетащи сюда картинки (PNG, JPG, WebP, GIF, SVG) или нажми, чтобы выбрать</div>
            <div class="adm-hint" style="margin:.6rem 0 1rem">Файлов: ${names.length} · ${fmtSize(total)}. Они хранятся в этом браузере. Большие картинки автоматически уменьшаются до 1600 px.</div>
            <div class="adm-mgrid">${names.map(n => {
                const u = mediaUsage(n);
                return `<div class="adm-mcard">
                    <div class="adm-thumb"><img src="${media[n].data}" alt=""></div>
                    <div class="adm-mbody">
                        <div class="adm-mname" title="img/${esc(n)}">${esc(n)}</div>
                        <div class="adm-hint">${fmtSize(media[n].size || 0)} · в статьях: ${u}</div>
                        <div class="adm-mact">
                            <button class="adm-btn sm" data-act="media-insert" data-n="${esc(n)}" title="Вставить в открытую статью"><i class="fa-solid fa-plus"></i></button>
                            <button class="adm-btn sm" data-act="media-card" data-n="${esc(n)}" title="Сделать картинкой карточки статьи"><i class="fa-regular fa-id-card"></i></button>
                            <button class="adm-btn sm" data-act="media-copy" data-n="${esc(n)}" title="Скопировать путь"><i class="fa-regular fa-copy"></i></button>
                            <button class="adm-btn sm" data-act="media-rename" data-n="${esc(n)}" title="Переименовать"><i class="fa-solid fa-pen"></i></button>
                            <button class="adm-btn sm" data-act="media-dl" data-n="${esc(n)}" title="Скачать"><i class="fa-solid fa-download"></i></button>
                            <button class="adm-btn sm danger" data-act="media-del" data-n="${esc(n)}" title="Удалить"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </div></div>`;
            }).join('') || '<div class="adm-muted">Пока пусто. Загрузи первую картинку.</div>'}</div>`;
    }

    /* ==================== ЗАГРУЗКА ФАЙЛОВ: ВСТАВКА, ПЕРЕТАСКИВАНИЕ ==================== */
    function onChange(e) {
        const t = e.target;
        if (t.id === 'admFile') { const fl = [...t.files]; t.value = ''; addFiles(fl); }
        else if (t.id === 'admImport') { const f = t.files[0]; t.value = ''; importFile(f); }
    }
    function insertUploaded(names) {
        const ta = $('#admContent', root);
        if (!ta) return;
        ta.focus(); ta.setSelectionRange(ta.selectionEnd, ta.selectionEnd);
        names.forEach(n => insertBlock(ta, imageHtml({ src: 'img/' + n })));
    }
    async function onPaste(e) {
        if (!e.target || e.target.id !== 'admContent') return;
        const files = [...(e.clipboardData ? e.clipboardData.files : [])].filter(f => MIME_EXT[f.type]);
        if (!files.length) return;
        e.preventDefault();
        insertUploaded(await addFiles(files));
    }
    function onDragOver(e) {
        if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
        e.preventDefault();
        const d = $('#admDrop', root);
        if (d) d.classList.toggle('over', d.contains(e.target));
    }
    async function onDrop(e) {
        const files = e.dataTransfer ? [...e.dataTransfer.files] : [];
        if (!files.length) return;
        e.preventDefault();
        const d = $('#admDrop', root); if (d) d.classList.remove('over');
        const imgs = files.filter(f => MIME_EXT[f.type]);
        if (!imgs.length) { toast('Это не картинка'); return; }
        const names = await addFiles(imgs);
        if (e.target && e.target.id === 'admContent') insertUploaded(names);
    }
    function onUnload(e) { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } }
    function updateMediaHint() {
        const h = $('#admMediaHint', root);
        if (!h) return;
        h.textContent = cur.mediaType === 'icon'
            ? 'Класс Font Awesome, например fa-compass'
            : 'Путь к файлу в папке сайта, например img/ore_souls.png (файл положи туда сам)';
    }

    function renderCats(main) {
        const used = id => WIKI_DATA && work.articles.filter(a => a.categoryId === id).length;
        main.innerHTML = `
            <div class="adm-head"><h2>Категории</h2>
                <button class="adm-btn sm" data-act="cat-add"><i class="fa-solid fa-plus"></i> Добавить категорию</button></div>
            ${work.categories.map((c, i) => `
                <div class="adm-cat">
                    <label class="adm-f"><span>ID</span><input class="adm-input" data-ci="${i}" data-cf="id" value="${esc(c.id)}" ${c._new ? '' : 'readonly'} spellcheck="false"></label>
                    <label class="adm-f"><span>Название</span><input class="adm-input" data-ci="${i}" data-cf="name" value="${esc(c.name)}"></label>
                    <label class="adm-f"><span>Иконка (Font Awesome)</span><div class="adm-media"><input class="adm-input" data-ci="${i}" data-cf="icon" value="${esc(c.icon)}" spellcheck="false"><button type="button" class="adm-btn sm" data-act="cat-icon" data-i="${i}" title="Выбрать иконку"><i class="fa-solid ${esc(c.icon)}"></i></button></div></label>
                    <label class="adm-f adm-desc"><span>Описание</span><input class="adm-input" data-ci="${i}" data-cf="desc" value="${esc(c.desc)}"></label>
                    <div class="adm-cat-actions">
                        <button class="adm-btn sm" data-act="cat-up" data-i="${i}" ${i === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
                        <button class="adm-btn sm" data-act="cat-down" data-i="${i}" ${i === work.categories.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
                        <span class="adm-hint">Статей: ${used(c.id)}</span>
                        <span class="adm-spacer"></span>
                        <button class="adm-btn sm danger" data-act="cat-del" data-i="${i}" ${used(c.id) ? 'disabled title="Сначала перенеси статьи в другую категорию"' : ''}><i class="fa-regular fa-trash-can"></i> Удалить</button>
                    </div>
                </div>`).join('')}`;
    }

    /* ==================== ОБРАБОТЧИКИ ==================== */
    function onKey(e) {
        if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) { e.preventDefault(); save(); return; }
        if ((e.ctrlKey || e.metaKey) && e.target && e.target.id === 'admContent') {
            const map = { KeyB: 'b', KeyI: 'i', KeyU: 'u', KeyK: 'url', KeyF: 'find' };
            if (map[e.code]) { e.preventDefault(); toolbar(map[e.code]); return; }
            if (e.code === 'KeyZ') { e.preventDefault(); histGo(e.shiftKey ? 1 : -1); return; }
            if (e.code === 'KeyY') { e.preventDefault(); histGo(1); return; }
        }
        if (e.key === 'Escape') {
            e.stopPropagation();
            if (e.target && e.target.id === 'admSearch' && e.target.value) { e.target.value = ''; search = ''; renderList(); return; }
            const m = $('.adm-modal', root);
            if (m) m.remove(); else close();
        }
        if (e.key === 'Tab' && e.target.id === 'admContent') { // Tab в редакторе = 4 пробела
            e.preventDefault();
            const t = e.target;
            t.setRangeText('    ', t.selectionStart, t.selectionEnd, 'end');
            t.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function onInput(e) {
        const t = e.target;
        if (t.id === 'admSearch') { search = t.value; renderList(); return; }
        if (t.id === 'admSort') { sortMode = t.value; renderList(); return; }
        if (t.id === 'admFilt') { filterCat = t.value; renderList(); return; }
        if (t.dataset.catlink) { // вставка ссылки на категорию
            const id = t.value;
            if (!id) return;
            const c = work.categories.find(x => x.id === id);
            const ta = $('#admContent', root);
            const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || (c ? c.name : id);
            insert(ta, `<a href="#" onclick="event.preventDefault(); navigateTo('category', '${id}')">`, '</a>', sel);
            t.value = '';
            return;
        }
        if (t.dataset.link) { // вставка ссылки на другую статью
            const id = t.value;
            if (!id) return;
            const a = work.articles.find(x => x.id === id);
            const ta = $('#admContent', root);
            const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || (a ? a.title : id);
            insert(ta, `<a href="#" onclick="event.preventDefault(); navigateTo('article', '${id}')">`, '</a>', sel);
            t.value = '';
            return;
        }
        if (t.dataset.cf !== undefined) {
            work.categories[+t.dataset.ci][t.dataset.cf] = t.value;
            catDirty = true; markState();
            return;
        }
        const f = t.dataset.f;
        if (!f || !cur) return;
        if (t.type === 'checkbox') cur[f] = t.checked;
        else if (t.type === 'radio') { if (t.checked) cur[f] = t.value; }
        else cur[f] = t.value;
        formDirty = true;
        if (f === 'title' && isNew && !idTouched) {
            cur.id = slugify(cur.title);
            $('[data-f="id"]', root).value = cur.id;
        }
        if (f === 'id') idTouched = true;
        if (f === 'content') { updatePreview(); histPush(cur.content); }
        if (f === 'mediaType') updateMediaHint();
        markState();
    }

    function onClick(e) {
        const tb = e.target.closest('[data-tb]');
        if (tb) { toolbar(tb.dataset.tb); return; }
        const el = e.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act;
        switch (act) {
            case 'close': close(); break;
            case 'music':
                if (music.playing) music.stop();
                else if (!music.start()) toast('Браузер не поддерживает звук');
                syncMusicBtn();
                break;
            case 'save': save(); break;
            case 'code': showCode(); break;
            case 'toggle-side': $('#admSide', root).classList.toggle('open'); break;
            case 'view-articles': if (view !== 'articles') { if (view === 'cats' && !confirmDiscard()) break; view = 'articles'; renderAll(); } break;
            case 'view-media': if (view !== 'media') { view = 'media'; $('#admSide', root).classList.remove('open'); renderAll(); } break;
            case 'view-cats': if (view !== 'cats') { if (!confirmDiscard()) break; view = 'cats'; $('#admSide', root).classList.remove('open'); renderAll(); } break;
            case 'new': if (!confirmDiscard()) break; newArticleDialog(); break;
            case 'dup': {
                if (!cur) break;
                const f = { ...cur };
                const base = (f.id || 'article').replace(/-copy(-\d+)?$/, '') + '-copy';
                let id = base, n = 2;
                while (work.articles.some(a => a.id === id)) id = base + '-' + (n++);
                f.id = id; f.title = (f.title || '') + ' (копия)'; f.popular = false;
                cur = f; isNew = true; curId = null; idTouched = true; formDirty = true;
                renderAll(); toast('Копия создана — нажми «Сохранить»');
                break;
            }
            case 'export': exportJson(); break;
            case 'import': $('#admImport', root).click(); break;
            case 'media-upload': $('#admFile', root).click(); break;
            case 'media-zip': downloadZip(); break;
            case 'media-pick-field':
                if (!cur) break;
                if (cur.mediaType === 'icon') iconPicker(setMediaField); else mediaPickDialog(setMediaField);
                break;
            case 'cat-icon': iconPicker(name => { work.categories[+el.dataset.i].icon = name; catDirty = true; renderMain(); markState(); }); break;
            case 'media-insert': {
                if (!cur) { toast('Сначала открой статью, куда вставить картинку'); break; }
                view = 'articles'; renderAll();
                const ta = $('#admContent', root);
                if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); insertBlock(ta, imageHtml({ src: 'img/' + el.dataset.n })); }
                break;
            }
            case 'media-card':
                if (!cur) { toast('Сначала открой статью'); break; }
                cur.mediaType = 'image'; cur.media = 'img/' + el.dataset.n; formDirty = true;
                view = 'articles'; renderAll(); toast('Картинка карточки выбрана — нажми «Сохранить»');
                break;
            case 'media-copy': {
                const t = 'img/' + el.dataset.n;
                if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Скопировано: ' + t), () => toast(t)); else toast(t);
                break;
            }
            case 'media-rename': {
                const old = el.dataset.n, nu = prompt('Новое имя файла:', old);
                if (nu && nu !== old) renameMedia(old, nu.trim());
                break;
            }
            case 'media-dl': { const n = el.dataset.n; if (media[n]) dl(new Blob([dataToBytes(media[n].data)], { type: media[n].type }), n); break; }
            case 'media-del': {
                const n = el.dataset.n, u = mediaUsage(n);
                if (!confirm(`Удалить «${n}» из медиатеки?` + (u ? `\n\nОна используется в статьях: ${u}. Ссылки перестанут работать.` : ''))) break;
                delete media[n]; saveMedia(); refreshSite(); renderMain();
                break;
            }
            case 'pick': {
                if (!confirmDiscard()) break;
                const a = work.articles.find(x => x.id === el.dataset.id);
                if (!a) break;
                isNew = false; curId = a.id; idTouched = true; cur = formFrom(a);
                $('#admSide', root).classList.remove('open');
                renderAll();
                break;
            }
            case 'delete': removeArticle(); break;
            case 'open-site': {
                if (!curId) break;
                const id = curId;
                if (isDirty() && !confirm('Несохранённые правки останутся в редакторе. Открыть статью на сайте?')) break;
                close(true); navigateTo('article', id);
                break;
            }
            case 'pane-code': root.classList.remove('adm-show-preview'); break;
            case 'pane-preview': root.classList.add('adm-show-preview'); break;
            case 'reset': resetAll(); break;
            case 'cat-add': {
                let n = 1, id = 'new-category';
                while (work.categories.some(c => c.id === id)) id = 'new-category-' + (++n);
                work.categories.push({ id, name: 'Новая категория', icon: 'fa-folder', desc: '', _new: true });
                catDirty = true; renderMain(); markState();
                break;
            }
            case 'cat-del': {
                const c = work.categories[+el.dataset.i];
                if (c && confirm(`Удалить категорию «${c.name}»?`)) { work.categories.splice(+el.dataset.i, 1); catDirty = true; renderMain(); markState(); }
                break;
            }
            case 'cat-up': case 'cat-down': {
                const i = +el.dataset.i, j = act === 'cat-up' ? i - 1 : i + 1;
                if (work.categories[j]) { [work.categories[i], work.categories[j]] = [work.categories[j], work.categories[i]]; catDirty = true; renderMain(); markState(); }
                break;
            }
            case 'conflict-apply': work = cleanData(draft.data); saveDraft(); refreshSite(); cur = null; curId = null; isNew = false; renderAll(); updatePill(); toast('Черновик применён'); break;
            case 'conflict-drop': clearDraft(); conflict = false; renderAll(); updatePill(); toast('Старый черновик удалён'); break;
            case 'code-close': $('.adm-modal', root).remove(); break;
            case 'code-copy': copyCode(); break;
            case 'code-download': downloadCode(); break;
        }
    }

    /* ==================== ПАНЕЛЬ ИНСТРУМЕНТОВ РЕДАКТОРА ==================== */
    function insert(ta, before, after, placeholder) {
        const s = ta.selectionStart, e = ta.selectionEnd;
        const sel = ta.value.slice(s, e) || placeholder || '';
        ta.setRangeText(before + sel + after, s, e, 'end');
        ta.focus();
        ta.setSelectionRange(s + before.length, s + before.length + sel.length);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function insertBlock(ta, text) {
        const s = ta.selectionStart, e = ta.selectionEnd;
        const pre = s > 0 && ta.value[s - 1] !== '\n' ? '\n' : '';
        ta.setRangeText(pre + text + '\n', s, e, 'end');
        ta.focus();
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const CALLOUT_ICON = { info: 'fa-circle-info', warning: 'fa-triangle-exclamation', success: 'fa-lightbulb', danger: 'fa-circle-exclamation' };
    function put(ta, html) { // заменить выделение готовой разметкой
        ta.setRangeText(html, ta.selectionStart, ta.selectionEnd, 'end');
        ta.focus();
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function findDialog(ta) {
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        dialog('Найти и заменить',
            fld('Найти', inp('f', sel.includes('\n') ? '' : sel)) + fld('Заменить на', inp('r')) +
            `<div class="adm-checks"><label><input type="checkbox" name="rx"> Регулярное выражение</label><label><input type="checkbox" name="mc"> Учитывать регистр</label><label><input type="checkbox" name="all"> Во всех статьях</label></div>`,
            o => {
                if (!o.f) { toast('Введи, что искать'); return false; }
                let re;
                try { re = new RegExp(o.rx ? o.f : o.f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), o.mc ? 'g' : 'gi'); }
                catch (err) { toast('Ошибка в выражении'); return false; }
                const rep = o.rx ? o.r : o.r.replace(/\$/g, '$$$$');
                const count = str => (str.match(re) || []).length;
                let n = count(ta.value);
                if (n) { ta.value = ta.value.replace(re, rep); ta.dispatchEvent(new Event('input', { bubbles: true })); }
                if (o.all) {
                    let other = 0;
                    work.articles.forEach(a => {
                        if (a.id === curId) return;
                        const c = count(a.content);
                        if (c) { other += c; a.content = a.content.replace(re, rep); }
                    });
                    if (other) { n += other; saveDraft(); refreshSite(); renderList(); updatePill(); }
                }
                markState();
                toast(n ? `Заменено: ${n}` : 'Ничего не найдено');
            }, { ok: 'Заменить всё' });
    }

    function toolbar(kind) {
        const ta = $('#admContent', root);
        if (!ta) return;
        const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        const wrap = (tag, ph) => insert(ta, `<${tag}>`, `</${tag}>`, ph);
        const list = (tag, cls) => {
            const lines = sel ? sel.split('\n').filter(l => l.trim()) : ['Пункт 1', 'Пункт 2'];
            insertBlock(ta, `<${tag}${cls ? ` class="${cls}"` : ''}>\n${lines.map(l => `    <li>${l.trim()}</li>`).join('\n')}\n</${tag}>`);
        };
        const callout = k => insertBlock(ta, `<div class="wiki-callout ${k}">\n    <i class="fa-solid ${CALLOUT_ICON[k]}"></i>\n    <div>${sel || 'Текст подсказки'}</div>\n</div>`);
        const hasSrc = v => v && v.trim() && v.trim() !== 'img/';
        const artOpts = [['', '— без ссылки —'], ...work.articles.filter(a => a.id !== curId).map(a => [a.id, a.title || a.id])];

        switch (kind) {
            case 'undo': histGo(-1); break;
            case 'redo': histGo(1); break;
            case 'find': findDialog(ta); break;
            case 'clear':
                if (!sel) { toast('Выдели текст, из которого убрать теги'); break; }
                put(ta, sel.replace(/<[^>]*>/g, ''));
                break;

            case 'h2': wrap('h2', 'Заголовок раздела'); break;
            case 'h3': wrap('h3', 'Подзаголовок'); break;
            case 'h4': wrap('h4', 'Малый заголовок'); break;
            case 'b': wrap('strong', 'текст'); break;
            case 'i': wrap('em', 'текст'); break;
            case 'u': wrap('u', 'текст'); break;
            case 's': wrap('del', 'текст'); break;
            case 'mark': wrap('mark', 'важное'); break;
            case 'sup': wrap('sup', '2'); break;
            case 'sub': wrap('sub', '2'); break;
            case 'kbd': wrap('kbd', 'Ctrl'); break;
            case 'code': wrap('code', '/команда'); break;
            case 'left': case 'center': case 'right':
                insertBlock(ta, `<div style="text-align:${kind}">\n    ${sel || 'Текст'}\n</div>`);
                break;
            case 'color': {
                const sw = ['#ffaa00', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#5555ff', '#aaaaaa', '#ffffff', '#f2b441'];
                dialog('Цвет текста',
                    fld('Цвет', `<input type="color" name="c" value="#f2b441" class="adm-color">`) +
                    `<div class="adm-swatches">${sw.map(c => `<button type="button" class="adm-sw" data-sw="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>`,
                    o => insert(ta, `<span style="color:${o.c}">`, '</span>', 'текст'),
                    { init: m => m.addEventListener('click', e => { const b = e.target.closest('[data-sw]'); if (b) m.querySelector('[name=c]').value = b.dataset.sw; }) });
                break;
            }

            case 'ul': list('ul'); break;
            case 'ol': list('ol'); break;
            case 'check': list('ul', 'wiki-checklist'); break;
            case 'quote': insertBlock(ta, `<blockquote>\n    <p>${sel || 'Цитата'}</p>\n</blockquote>`); break;
            case 'hr': insertBlock(ta, '<hr>'); break;
            case 'pre': insertBlock(ta, `<pre><code>${esc(sel) || '/команда'}</code></pre>`); break;
            case 'details': insertBlock(ta, `<details class="wiki-details">\n    <summary>Заголовок спойлера</summary>\n    <p>${sel || 'Скрытый текст'}</p>\n</details>`); break;
            case 'cols': insertBlock(ta, `<div class="wiki-cols">\n    <div>\n        <p>${sel || 'Левая колонка'}</p>\n    </div>\n    <div>\n        <p>Правая колонка</p>\n    </div>\n</div>`); break;
            case 'info': case 'warning': case 'success': case 'danger': callout(kind); break;

            case 'table':
                dialog('Таблица',
                    `<div class="adm-grid">${fld('Столбцов', `<input class="adm-input" type="number" name="c" value="2" min="1" max="8">`)}${fld('Строк (без заголовка)', `<input class="adm-input" type="number" name="r" value="2" min="1" max="30">`)}</div>
                     <label class="adm-chk"><input type="checkbox" name="h" checked> Строка заголовка</label>`,
                    o => {
                        const c = clamp(+o.c, 1, 8), r = clamp(+o.r, 1, 30);
                        const row = (tag, txt) => `        <tr>\n${Array.from({ length: c }, (_, i) => `            <${tag}>${txt(i)}</${tag}>`).join('\n')}\n        </tr>`;
                        const head = o.h ? `    <thead>\n${row('th', i => 'Колонка ' + (i + 1))}\n    </thead>\n` : '';
                        const body = Array.from({ length: r }, () => row('td', () => '')).join('\n');
                        insertBlock(ta, `<table class="wiki-table">\n${head}    <tbody>\n${body}\n    </tbody>\n</table>`);
                    });
                break;

            case 'infobox':
                dialog('Инфобокс (карточка справа)',
                    fld('Название', inp('title', '', 'Название предмета')) +
                    fld('Картинка (необязательно)', inp('src', 'img/')) + `<div class="adm-pickwrap">${pickerInner()}</div>` +
                    fld('Строки «Параметр: значение», по одной на строку', `<textarea class="adm-input" name="rows" rows="5" placeholder="Тип: Инструмент\nРедкость: Редкий"></textarea>`),
                    o => {
                        const rows = o.rows.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const k = l.indexOf(':'); return k > 0 ? [l.slice(0, k).trim(), l.slice(k + 1).trim()] : [l, '']; });
                        insertBlock(ta, `<aside class="wiki-infobox">\n    <div class="wiki-infobox-title">${esc(o.title || 'Название')}</div>\n`
                            + (hasSrc(o.src) ? `    <img class="wiki-img" src="${esc(o.src.trim())}" alt="${esc(o.title)}">\n` : '')
                            + (rows.length ? `    <table class="wiki-table">\n        <tbody>\n${rows.map(([a, b]) => `            <tr><th>${a}</th><td>${b}</td></tr>`).join('\n')}\n        </tbody>\n    </table>\n` : '')
                            + `</aside>`);
                    }, { init: m => bindPicker(m, 'src') });
                break;

            case 'craft':
                dialog('Рецепт крафта 3×3',
                    `<div class="adm-hint">В ячейке — название предмета или путь к картинке (img/файл.png). Пустая ячейка — пустой слот.</div>
                     <div class="adm-craftgrid">${Array.from({ length: 9 }, (_, i) => inp('c' + i, '', '—')).join('')}</div>
                     <div class="adm-grid">${fld('Результат', inp('res'))}${fld('Количество', `<input class="adm-input" type="number" name="cnt" value="1" min="1" max="64">`)}</div>`,
                    o => {
                        const inner = v => { v = (v || '').trim(); if (!v) return ''; return /^(img\/|https?:)/.test(v) ? `<img src="${esc(v)}" alt="">` : `<span class="wiki-slot-t">${esc(v)}</span>`; };
                        const slot = (v, cls) => `<span class="wiki-slot${cls || ''}"${v && !/^(img\/|https?:)/.test(v.trim()) ? ` title="${esc(v.trim())}"` : ''}>${inner(v)}`;
                        const cells = Array.from({ length: 9 }, (_, i) => `        ${slot(o['c' + i])}</span>`).join('\n');
                        const n = clamp(+o.cnt, 1, 64);
                        insertBlock(ta, `<div class="wiki-craft">\n    <div class="wiki-craft-grid">\n${cells}\n    </div>\n    <i class="fa-solid fa-arrow-right wiki-craft-arrow"></i>\n    ${slot(o.res, ' wiki-slot-result')}${n > 1 ? `<b class="wiki-count">${n}</b>` : ''}</span>\n</div>`);
                    });
                break;

            case 'img':
                dialog('Вставить картинку',
                    fld('Файл (выбери из медиатеки или впиши путь)', inp('src', 'img/', 'img/файл.png')) + `<div class="adm-pickwrap">${pickerInner()}</div>` +
                    `<div class="adm-grid">${fld('Подпись под картинкой', inp('caption'))}${fld('Alt-текст (описание)', inp('alt'))}
                     ${fld('Ширина', selHtml('width', [['auto', 'Авто'], ['25', '25%'], ['33', '33%'], ['50', '50%'], ['75', '75%'], ['100', '100%']], 'auto'))}
                     ${fld('Выравнивание', selHtml('align', [['none', 'Обычное'], ['center', 'По центру'], ['right', 'Вправо'], ['float-left', 'Слева, текст обтекает'], ['float-right', 'Справа, текст обтекает']], 'none'))}</div>`,
                    o => { if (!hasSrc(o.src)) { toast('Выбери файл'); return false; } insertBlock(ta, imageHtml(o)); },
                    { init: m => bindPicker(m, 'src') });
                break;

            case 'gallery':
                dialog('Галерея',
                    fld('Картинки (по одной на строку)', `<textarea class="adm-input" name="srcs" rows="4" placeholder="img/one.png\nimg/two.png"></textarea>`) +
                    `<div class="adm-pickwrap">${pickerInner()}</div>` +
                    fld('Колонок', selHtml('cols', [['2', '2'], ['3', '3'], ['4', '4']], '3')),
                    o => {
                        const imgs = o.srcs.split('\n').map(s => s.trim()).filter(Boolean);
                        if (!imgs.length) { toast('Добавь хотя бы одну картинку'); return false; }
                        insertBlock(ta, `<div class="wiki-gallery cols-${o.cols}">\n${imgs.map(s => `    <img class="wiki-img" src="${esc(s)}" alt="" loading="lazy">`).join('\n')}\n</div>`);
                    }, { init: m => bindPicker(m, 'srcs', true) });
                break;

            case 'video':
                dialog('Видео',
                    fld('Ссылка или путь к файлу', inp('url', '', 'video/clip.mp4 — или ссылка YouTube / Vimeo / RuTube')) +
                    `<div class="adm-hint">Можно просто путь к файлу в папке сайта (например <code>video/clip.mp4</code>) или ссылку. Сам файл положи в эту папку на хостинге — в редактор он не загружается.</div>`,
                    o => { const h = embedVideo(o.url); if (!h) { toast('Укажи путь к файлу (video/clip.mp4) или ссылку YouTube/Vimeo/RuTube'); return false; } insertBlock(ta, h); });
                break;

            case 'model':
                dialog('3D-модель Blockbench',
                    fld('Путь к файлу', inp('src', 'models/', 'models/sword.bbmodel')) +
                    `<div class="adm-grid">${fld('Подпись', inp('caption'))}
                     ${fld('Высота окна, px', inp('height', '', '360'))}</div>` +
                    fld('Автовращение', selHtml('auto', [['true', 'Включено'], ['false', 'Выключено']], 'true')) +
                    `<div class="adm-hint">Положи файл <code>.bbmodel</code> (или <code>.glb</code>) в папку <code>models/</code> рядом с сайтом. Скачать модель посетители не смогут — только вращать и смотреть. Предпросмотр заработает, когда файл лежит на хостинге.</div>`,
                    o => {
                        const p = o.src.trim();
                        if (!p || p === 'models/') { toast('Укажи путь к файлу модели'); return false; }
                        const h = parseInt(o.height, 10);
                        insertBlock(ta, `<div class="bb-model" data-src="${esc(p)}"${o.caption.trim() ? ` data-caption="${esc(o.caption.trim())}"` : ''}${h ? ` data-height="${h}"` : ''}${o.auto === 'false' ? ' data-autorotate="false"' : ''}></div>`);
                    });
                break;

            case 'audio':
                dialog('Аудио', fld('Путь к файлу или ссылка', inp('url', '', 'sound/music.mp3')) + `<div class="adm-hint">Например <code>sound/music.mp3</code> — файл должен лежать в папке сайта.</div>`,
                    o => { if (!o.url.trim()) { toast('Укажи путь или ссылку'); return false; } insertBlock(ta, `<audio class="wiki-media" controls preload="none" src="${esc(o.url.trim())}"></audio>`); });
                break;

            case 'icon': iconPicker(name => put(ta, `<i class="fa-solid ${name}"></i>`)); break;

            case 'url':
                dialog('Ссылка',
                    fld('Адрес', inp('url', 'https://')) + fld('Текст ссылки', inp('text', sel)) +
                    `<label class="adm-chk"><input type="checkbox" name="nt" checked> Открывать в новой вкладке</label>`,
                    o => {
                        const u = o.url.trim();
                        if (!u || u === 'https://') { toast('Укажи адрес'); return false; }
                        put(ta, `<a href="${esc(u)}"${o.nt ? ' target="_blank" rel="noopener"' : ''}>${o.text.trim() || esc(u)}</a>`);
                    });
                break;

            case 'btn':
                dialog('Кнопка',
                    fld('Текст кнопки', inp('text', sel || 'Нажми')) + fld('Внешний адрес', inp('url', '', 'https://…')) +
                    fld('…или статья wiki', selHtml('art', artOpts, '')),
                    o => {
                        const text = esc(o.text.trim() || 'Кнопка');
                        if (o.art) insertBlock(ta, `<a class="wiki-btn" href="#" onclick="event.preventDefault(); navigateTo('article', '${o.art}')">${text}</a>`);
                        else if (o.url.trim()) insertBlock(ta, `<a class="wiki-btn" href="${esc(o.url.trim())}" target="_blank" rel="noopener">${text}</a>`);
                        else { toast('Укажи адрес или выбери статью'); return false; }
                    });
                break;

            case 'seealso': {
                const others = work.articles.filter(a => a.id !== curId);
                if (!others.length) { toast('Других статей пока нет'); break; }
                dialog('Блок «Смотрите также»',
                    `<div class="adm-checklist">${others.map(a => `<label><input type="checkbox" name="s_${esc(a.id)}"> ${esc(a.title || a.id)}</label>`).join('')}</div>`,
                    o => {
                        const picked = others.filter(a => o['s_' + a.id]);
                        if (!picked.length) { toast('Отметь хотя бы одну статью'); return false; }
                        insertBlock(ta, `<h2>Смотрите также</h2>\n<ul>\n${picked.map(a => `    <li><a href="#" onclick="event.preventDefault(); navigateTo('article', '${a.id}')">${esc(a.title || a.id)}</a></li>`).join('\n')}\n</ul>`);
                    });
                break;
            }
        }
    }

    /* ==================== СОХРАНЕНИЕ / УДАЛЕНИЕ ==================== */
    function save() {
        if (!root) return;
        if (view === 'cats') { saveCats(); return; }
        if (!cur) { toast('Нечего сохранять — выбери или создай статью'); return; }

        if (cur.autoDate || isNew) {
            cur.updatedAt = todayRu();
            const di = $('[data-f="updatedAt"]', root); if (di) di.value = cur.updatedAt;
        }
        const a = toArticle(cur);
        const fail = (msg, field) => { toast(msg); const el = $(`[data-f="${field}"]`, root); if (el) el.focus(); };
        if (!a.title) return fail('Укажи заголовок', 'title');
        if (!ID_RE.test(a.id)) return fail('ID: только латиница, цифры и дефис (например ore-souls)', 'id');
        if (work.articles.some(x => x.id === a.id && x.id !== curId)) return fail('Статья с таким ID уже есть', 'id');
        if (!work.categories.some(c => c.id === a.categoryId)) return fail('Выбери категорию', 'categoryId');
        if (!/^\d{1,2}\s+\S+\s+\d{4}$/.test(a.updatedAt)) return fail('Дата в формате «24 Сен 2026»', 'updatedAt');

        // если изменили ID — чиним ссылки в других статьях
        if (!isNew && curId && a.id !== curId) {
            const oldRef = `navigateTo('article', '${curId}')`;
            const refs = work.articles.filter(x => x.id !== curId && x.content.includes(oldRef));
            if (refs.length) {
                if (confirm(`На эту статью ссылаются ещё ${refs.length} шт. Обновить ссылки на новый ID?`)) {
                    refs.forEach(x => { x.content = x.content.split(oldRef).join(`navigateTo('article', '${a.id}')`); });
                }
            }
        }

        const idx = isNew ? -1 : work.articles.findIndex(x => x.id === curId);
        if (idx >= 0) work.articles[idx] = a; else work.articles.push(a);
        // новые категории тоже фиксируем
        work.categories.forEach(c => { delete c._new; });

        isNew = false; curId = a.id; formDirty = false; catDirty = false;
        saveDraft(); refreshSite();
        renderAll(); updatePill();
        toast('Сохранено на сайте. Чтобы опубликовать для всех — «Получить код»');
    }

    function saveCats() {
        const seen = new Set();
        for (const c of work.categories) {
            if (!c.name.trim()) return toast('У категории должно быть название');
            if (!ID_RE.test(c.id)) return toast(`ID категории «${c.name}»: только латиница, цифры и дефис`);
            if (seen.has(c.id)) return toast(`Повторяется ID «${c.id}»`);
            seen.add(c.id);
        }
        work.categories.forEach(c => { delete c._new; c.name = c.name.trim(); c.icon = c.icon.trim(); c.desc = c.desc.trim(); });
        catDirty = false;
        saveDraft(); refreshSite(); renderAll(); updatePill();
        toast('Категории сохранены');
    }

    function removeArticle() {
        if (!curId) return;
        const a = work.articles.find(x => x.id === curId);
        if (!a) return;
        const ref = `navigateTo('article', '${a.id}')`;
        const refs = work.articles.filter(x => x.id !== a.id && x.content.includes(ref)).length;
        const msg = `Удалить статью «${a.title}»?` + (refs ? `\n\nНа неё ссылаются ещё ${refs} шт. — эти ссылки перестанут работать.` : '');
        if (!confirm(msg)) return;
        work.articles = work.articles.filter(x => x.id !== a.id);
        cur = null; curId = null; isNew = false; formDirty = false;
        saveDraft(); refreshSite(); renderAll(); updatePill();
        toast('Статья удалена (на сайте — после публикации кода)');
    }

    function resetAll() {
        if (!confirm('Сбросить ВСЕ неопубликованные правки и вернуть сайт к тому, что лежит в articles.js?')) return;
        clearDraft(); conflict = false;
        work = clone(ORIGINAL);
        cur = null; curId = null; isNew = false; formDirty = catDirty = false;
        refreshSite();
        if (root) renderAll();
        updatePill();
        toast('Правки сброшены');
    }

    /* ==================== ПОЛУЧИТЬ КОД ==================== */
    function showCode() {
        if (isDirty()) {
            if (!confirm('Есть несохранённые изменения — они не попадут в код. Сначала сохранить?')) { /* продолжаем без них */ }
            else { save(); if (isDirty()) return; }
        }
        const sum = diffSummary();
        const parts = [];
        if (sum.added) parts.push(`новых статей: <b>${sum.added}</b>`);
        if (sum.changed) parts.push(`изменено: <b>${sum.changed}</b>`);
        if (sum.removed) parts.push(`удалено: <b>${sum.removed}</b>`);
        if (sum.cats) parts.push('изменены категории');
        const code = buildCode();
        const m = document.createElement('div');
        m.className = 'adm-modal';
        m.innerHTML = `<div class="adm-modal-box">
            <h3><i class="fa-solid fa-code" style="color:var(--accent)"></i> Новый articles.js</h3>
            <div class="adm-hint" style="font-size:.84rem">${parts.length ? 'Изменения: ' + parts.join(' · ') : 'Изменений относительно текущего articles.js нет.'}</div>
            <textarea class="adm-input" id="admCode" readonly spellcheck="false"></textarea>
            <ol>
                <li>Нажми «Скопировать» (или «Скачать articles.js»).</li>
                <li>Замени всё содержимое файла <b>articles.js</b> на сайте/в репозитории этим кодом.</li>
                <li>Обнови страницу — когда файл совпадёт с черновиком, черновик очистится сам.</li>
            </ol>
            <div class="adm-modal-actions">
                <button class="adm-btn primary" data-act="code-copy"><i class="fa-regular fa-copy"></i> Скопировать</button>
                <button class="adm-btn" data-act="code-download"><i class="fa-solid fa-download"></i> Скачать articles.js</button>
                <span class="adm-spacer"></span>
                <button class="adm-btn" data-act="code-close">Закрыть</button>
            </div></div>`;
        root.appendChild(m);
        $('#admCode', root).value = code;
    }

    function copyCode() {
        const ta = $('#admCode', root);
        const ok = () => toast('Код скопирован');
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(ta.value).then(ok, () => { ta.select(); document.execCommand('copy'); ok(); });
        } else { ta.select(); document.execCommand('copy'); ok(); }
    }
    function downloadCode() {
        const blob = new Blob([$('#admCode', root).value], { type: 'text/javascript;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'articles.js';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    /* ==================== МЕЛОЧИ ==================== */
    function toast(msg) {
        const t = root && $('#admToast', root);
        if (!t) { console.log('[admin]', msg); return; }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
    }

    /* Плашка на самом сайте: напоминает, что есть неопубликованные правки */
    let pill = null;
    function updatePill() {
        if (!document.body) return;
        injectCSS();
        if (!pill) {
            pill = document.createElement('button');
            pill.className = 'adm-pill';
            pill.addEventListener('click', open);
            document.body.appendChild(pill);
        }
        const show = !root && (conflict || hasChanges());
        pill.classList.toggle('show', show);
        pill.innerHTML = conflict
            ? '<i class="fa-solid fa-triangle-exclamation"></i> Старый черновик не применён'
            : '<i class="fa-solid fa-pen-ruler"></i> Неопубликованные правки';
    }

    /* ==================== ВХОД ЧЕРЕЗ КОНСОЛЬ ==================== */
    const api = { open, close: () => close(), code: buildCode, reset: resetAll };
    try {
        Object.defineProperty(window, 'spatiumAdmin', { value: api });
        const adminFn = function () { open(); return 'Редактор Spatium открыт'; };
        // работает и «admin()», и просто «admin»
        Object.defineProperty(window, 'admin', { configurable: true, get() { open(); return adminFn; } });
    } catch (e) {}

    try {
        console.log('%c Spatium Wiki %c  Админка: введи  admin()  и нажми Enter',
            'background:#f2b441;color:#14161b;padding:2px 6px;font-weight:700', 'color:#f2b441');
    } catch (e) {}

    if (document.body) updatePill();
    else document.addEventListener('DOMContentLoaded', updatePill);
})();