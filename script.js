/* ==================== БАЗА ДАННЫХ WIKI ==================== */
const WIKI_DATA = {
    categories: [
        { id: "getting-started", name: "Начало работы", icon: "fa-rocket", desc: "Всё, что нужно знать для комфортного старта на сервере Spatium." },
        { id: "rules", name: "Правила", icon: "fa-book-bookmark", desc: "Свод правил и регламент поведения на проекте." },
        { id: "commands", name: "Команды", icon: "fa-terminal", desc: "Полный список доступных игровых команд." },
        { id: "mechanics", name: "Механики", icon: "fa-gears", desc: "Уникальные игровые системы, квесты и особенности выживания." },
        { id: "blocks", name: "Блоки", icon: "fa-cubes", desc: "Специальные и кастомные блоки, механизмы и декорации." },
        { id: "items", name: "Предметы", icon: "fa-box-open", desc: "Новые инструменты, броня и кастомные артефакты." },
        { id: "characters", name: "Персонажи", icon: "fa-users", desc: "Игровые существа и NPC." },
        { id: "economy", name: "Экономика", icon: "fa-coins", desc: "Торговля, аукцион, валюта и рынки." },
        { id: "faq", name: "Частые вопросы", icon: "fa-circle-question", desc: "Ответы на популярные вопросы игроков." }
    ],
    articles: [
        {
            id: "ore-souls",
            categoryId: "blocks",
            title: "Руда Душ",
            subtitle: "Редкая подземная руда, содержащая скрытую энергию душ",
            image: "img/ore_souls.png",
            updatedAt: "24 Сен 2026",
            popular: true,
            content: `
                <p><strong>Руда Душ</strong> — редкий подземный блок, добыча которого необходима для создания уникальных артефактов и кастомных предметов на сервере.</p>

                <h2>Информация о добыче</h2>
                <div class="table-wrapper">
                    <table class="wiki-table">
                        <thead>
                            <tr>
                                <th>Параметр</th>
                                <th>Значение</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Появление руды</td>
                                <td><strong>Y: 6 и ниже</strong></td>
                            </tr>
                            <tr>
                                <td>Выпадение</td>
                                <td><a href="#" onclick="event.preventDefault(); navigateTo('article', 'crystal-souls')">Кристалл Душ</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="wiki-callout info">
                    <i class="fa-solid fa-circle-info"></i>
                    <div>Для наиболее эффективной добычи руды душ отправляйтесь на самые нижние уровни мира в шахтах.</div>
                </div>
            `
        },
        {
            id: "crystal-souls",
            categoryId: "items",
            title: "Кристалл Душ",
            subtitle: "Ценный ресурс, выпадающий из Руды Душ",
            image: "img/crystal_souls.png",
            updatedAt: "24 Сен 2026",
            popular: true,
            content: `
                <p><strong>Кристалл Душ</strong> — особый артефактный ресурс, содержащий в себе скрытую энергию. Используется как основной компонент для создания уникального снаряжения.</p>

                <h2>Получение</h2>
                <p>Можно получить путём добычи <a href="#" onclick="event.preventDefault(); navigateTo('article', 'ore-souls')">Руды Душ</a> в глубоких подземных пещерах.</p>

                <h2>Применение</h2>
                <p>Используется во многих крафтах артефактов и предметов:</p>

                <div class="table-wrapper">
                    <table class="wiki-table">
                        <thead>
                            <tr>
                                <th>Предмет / Рецепт</th>
                                <th>Описание</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><a href="#" onclick="event.preventDefault(); navigateTo('article', 'speed-boots')">Ботинки Скорости</a></td>
                                <td>Дают постоянный эффект Скорости II при ношении.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="wiki-callout info">
                    <i class="fa-solid fa-circle-info"></i>
                    <div>Собирайте кристаллы душ для создания высокоуровневых артефактов и ценного снаряжения!</div>
                </div>
            `
        },
        {
            id: "speed-boots",
            categoryId: "items",
            title: "Ботинки Скорости",
            subtitle: "Кастомная броня, увеличивающая скорость передвижения",
            icon: "fa-shoe-prints",
            updatedAt: "24 Сен 2026",
            popular: false,
            content: `
                <p><strong>Ботинки Скорости</strong> — уникальный артефакт, дающий владельцу существенный прирост к скорости бега.</p>

                <h2>Крафт предмета</h2>
                <p>Для создания требуется несколько <a href="#" onclick="event.preventDefault(); navigateTo('article', 'crystal-souls')">Кристаллов Душ</a> и алмазная броня.</p>
            `
        },
        {
            id: "custom-blocks",
            categoryId: "blocks",
            title: "Функциональные блоки",
            subtitle: "Особые блоки для автоматизации и украшения базы",
            icon: "fa-cubes-stacked",
            updatedAt: "24 Сен 2026",
            popular: true,
            content: `
                <p>На сервере Spatium доступны кастомные блоки с уникальными функциями для ускорения вашего развития.</p>

                <h2>Виды полезных блоков</h2>
                <div class="table-wrapper">
                    <table class="wiki-table">
                        <thead>
                            <tr>
                                <th>Блок</th>
                                <th>Функция</th>
                                <th>Где получить</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Авто-Скупщик</td>
                                <td>Автоматически продает поступающие в него ресурсы.</td>
                                <td>Магазин спавна / Аукцион</td>
                            </tr>
                            <tr>
                                <td>Ускоритель роста</td>
                                <td>Ускоряет рост ближайших ферм и растений.</td>
                                <td>Квесты / Крафт</td>
                            </tr>
                            <tr>
                                <td>Магнитный сундук</td>
                                <td>Притягивает выпавшие рядом предметы в инвенварь.</td>
                                <td>Донат-магазин / Награды</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="wiki-callout info">
                    <i class="fa-solid fa-circle-info"></i>
                    <div>Рецепты крафта кастомных блоков можно посмотреть прямо в игре через меню <code>/recipes</code>.</div>
                </div>
            `
        },
        {
            id: "start-guide",
            categoryId: "getting-started",
            title: "Быстрый старт на Spatium",
            subtitle: "Первые шаги после подключения к серверу",
            icon: "fa-rocket",
            updatedAt: "22 Сен 2026",
            popular: true,
            content: `
                <p>Добро пожаловать на Minecraft-сервер <strong>Spatium</strong>! Ваше приключение начинается на центральном спавне нашего мира.</p>

                <div class="wiki-callout info">
                    <i class="fa-solid fa-circle-info"></i>
                    <div><strong>IP адрес для подключения:</strong> <code>play.spatium.mc</code> (Версия 1.20.4)</div>
                </div>

                <h2>1. Появление на Спавне</h2>
                <p>После входа в игру вы окажетесь в безопасной зоне. Здесь расположены торговцы, автошахта и навигационные зоны.</p>

                <h2>2. Получение стартового снаряжения</h2>
                <p>Введите команду ниже, чтобы получить базовый набор выживания (стартовые инструменты, еду и бронекомплект):</p>
                <pre><code>/kit start</code></pre>

                <h2>3. Отправка в дикий мир</h2>
                <p>Чтобы начать строительство базы и исследование, используйте команду случайной телепортации в неизведанные земли:</p>
                <pre><code>/rtp</code></pre>

                <div class="wiki-callout warning">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>Перед выходом в дикий мир убедитесь, что вы забрали стартовый набор и готовы к путешествиям!</div>
                </div>
            `
        },
        {
            id: "server-rules",
            categoryId: "rules",
            title: "Общие правила сервера",
            subtitle: "Свод обязательных правил для всех участников сообщества",
            icon: "fa-book-bookmark",
            updatedAt: "20 Сен 2026",
            popular: true,
            content: `
                <p>Соблюдение этих правил обеспечивает комфортную и честную игру для всех игроков Spatium.</p>

                <h2>1. Читы и стороннее ПО</h2>
                <p>Использование любых модификаций, дающих нечестное преимущество (X-Ray, Fly, KillAura и т.д.), строго запрещено.</p>
                <ul>
                    <li><strong>Наказание:</strong> Бессрочная блокировка аккаунта.</li>
                </ul>

                <h2>2. Поведение в игре</h2>
                <p>Запрещено намеренное использование багов сервера для получения выгоды, а также заманивание игроков в смертельные ловушки.</p>

                <h2>3. Общение в чате</h2>
                <p>Уважайте других игроков. В глобальном и локальном чатах запрещены:</p>
                <div class="table-wrapper">
                    <table class="wiki-table">
                        <thead>
                            <tr>
                                <th>Нарушение</th>
                                <th>Описание</th>
                                <th>Наказание</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Оскорбления / Спам</td>
                                <td>Агрессивное поведение, мат, частая отправка одинаковых сообщений.</td>
                                <td>Мут от 30 мин до 5 часов</td>
                            </tr>
                            <tr>
                                <td>Реклама</td>
                                <td>Упоминание чужих серверов, сторонних ресурсов.</td>
                                <td>Перманентный бан</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `
        },
        {
            id: "basic-commands",
            categoryId: "commands",
            title: "Основные игровые команды",
            subtitle: "Шпаргалка по командам для повседневной игры",
            icon: "fa-terminal",
            updatedAt: "18 Сен 2026",
            popular: false,
            content: `
                <p>Список наиболее часто используемых команд на сервере Spatium:</p>

                <h2>Команды телепортации</h2>
                <ul>
                    <li><code>/spawn</code> — Телепортироваться на Главный Спавн.</li>
                    <li><code>/sethome [название]</code> — Установить точку дома.</li>
                    <li><code>/home [название]</code> — Телепортироваться домой.</li>
                    <li><code>/tpa [ник]</code> — Отправить запрос на телепортацию к игроку.</li>
                </ul>

                <h2>Команды взаимодействия и торговли</h2>
                <ul>
                    <li><code>/pay [ник] [сумма]</code> — Перевести деньги игроку.</li>
                    <li><code>/ah</code> — Открыть глобальный аукцион сервера.</li>
                    <li><code>/menu</code> — Главное меню игрока.</li>
                </ul>
            `
        },
        {
            id: "world-exploration",
            categoryId: "mechanics",
            title: "Исследование мира и Квесты",
            subtitle: "Как развиваться и получать уникальные награды",
            icon: "fa-compass",
            updatedAt: "24 Сен 2026",
            popular: true,
            content: `
                <p>На сервере Spatium вас ждет увлекательное выживание с уникальными механиками квестов и наград.</p>

                <h2>1. Выполнение квестов</h2>
                <p>На спавне расположены NPC, которые выдают ежедневные задания на добычу ресурсов, охоту на мобов и исследование данжей.</p>

                <h2>2. Повышение уровня</h2>
                <p>За выполнение заданий вы получаете опыт и серверную валюту, которую можно потратить на рынке или на аукционе.</p>

                <div class="wiki-callout success">
                    <i class="fa-solid fa-lightbulb"></i>
                    <div><strong>Совет:</strong> Открывайте ежедневные награды с помощью команды <code>/bonus</code>!</div>
                </div>
            `
        }
    ]
};

/* ==================== ПРОБЛЕМЫ И ПРОВЕРКА МОБИЛЬНОСТИ ==================== */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

/* ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==================== */
let state = {
    theme: localStorage.getItem('spatium_theme') || 'dark',
    epilepsySafe: localStorage.getItem('spatium_epilepsy_safe') === 'true',
    glowPosition: isMobileDevice() ? 'center' : (localStorage.getItem('spatium_glow_position') || 'left'),
    glowEnabled: localStorage.getItem('spatium_glow_enabled') !== 'false',
    customGlowColor: localStorage.getItem('spatium_custom_glow_color') || null, // Сохраняем строку "h,s,l"
    colorHSL: { h: 180, s: 80, l: 50 },
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
    initTheme();
    initGlowPosition();
    initGlowState();
    initCustomColor();
    initEpilepsyCheck();
    initGlowButtonEvents();
    initColorWheel();
    renderSidebar();
    updateMobileSettingsUI();
    handleRoute();

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', toggleMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMobileSidebar);

    const desktopThemeBtn = document.getElementById('themeToggleBtn');
    if (desktopThemeBtn) desktopThemeBtn.addEventListener('click', toggleTheme);

    window.addEventListener('resize', () => {
        if (isMobileDevice() && state.glowPosition !== 'center') {
            state.glowPosition = 'center';
            applyGlowPositionClass('center');
        }
    });
});

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }
}

function toggleMobileSearch() {
    const bar = document.getElementById('mobileSearchBar');
    const input = document.getElementById('mobileSearchInput');
    bar.classList.toggle('active');
    if (bar.classList.contains('active')) {
        input.focus();
    }
}

/* ==================== УПРАВЛЕНИЕ СВЕЧЕНИЕМ ФОНА ==================== */
function initGlowPosition() {
    if (isMobileDevice()) {
        applyGlowPositionClass('center');
    } else {
        applyGlowPositionClass(state.glowPosition);
    }
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
    updateMobileSettingsUI();
}

function toggleGlowEnabled() {
    state.glowEnabled = !state.glowEnabled;
    localStorage.setItem('spatium_glow_enabled', state.glowEnabled);
    initGlowState();
}

function toggleGlowPosition() {
    if (isMobileDevice()) return;

    const currentIndex = GLOW_POSITIONS.findIndex(p => p.id === state.glowPosition);
    const nextIndex = (currentIndex + 1) % GLOW_POSITIONS.length;
    const nextPos = GLOW_POSITIONS[nextIndex].id;

    state.glowPosition = nextPos;
    localStorage.setItem('spatium_glow_position', nextPos);
    
    applyGlowPositionClass(nextPos);
    updateMobileSettingsUI();
}

function applyGlowPositionClass(pos) {
    document.body.classList.remove('glow-left', 'glow-center', 'glow-right');
    document.body.classList.add(`glow-${pos}`);
}

/* ==================== ОБРАБОТЧИКИ ПКМ / ЗАЖАТИЯ ==================== */
let holdTimer = null;
let isHoldActionTriggered = false;

function initGlowButtonEvents() {
    const btn = document.getElementById('glowToggleBtn');
    if (!btn) return;

    btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleGlowEnabled();
    });

    const startHold = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        isHoldActionTriggered = false;

        holdTimer = setTimeout(() => {
            isHoldActionTriggered = true;
            toggleColorPickerModal(true);
        }, 400);
    };

    const endHold = (e) => {
        if (e.type === 'mouseup' && e.button !== 0) return;
        clearTimeout(holdTimer);

        if (!isHoldActionTriggered) {
            toggleGlowPosition();
        }
    };

    btn.addEventListener('mousedown', startHold);
    btn.addEventListener('touchstart', startHold, { passive: true });

    btn.addEventListener('mouseup', endHold);
    btn.addEventListener('touchend', endHold);

    btn.addEventListener('mouseleave', () => clearTimeout(holdTimer));
}

/* ==================== КРУГЛАЯ ПАЛИТРА И ПОЛЗУНКИ ==================== */
function initCustomColor() {
    if (state.customGlowColor) {
        const parts = state.customGlowColor.split(',').map(Number);
        if (parts.length === 3) {
            state.colorHSL = { h: parts[0], s: parts[1], l: parts[2] };
            applyHSLColor(state.colorHSL);
        }
    }
}

function applyHSLColor(hsl) {
    const root = document.documentElement;
    root.style.setProperty('--glow-color-1', `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.45)`);
    root.style.setProperty('--glow-color-2', `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.35)`);
    root.style.setProperty('--glow-color-3', `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.25)`);
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function initColorWheel() {
    const canvas = document.getElementById('colorWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const radius = canvas.width / 2;

    // Отрисовка цветового круга (Hue/Sat)
    for (let x = -radius; x < radius; x++) {
        for (let y = -radius; y < radius; y++) {
            const distance = Math.sqrt(x * x + y * y);
            if (distance <= radius) {
                let angle = Math.atan2(y, x) * (180 / Math.PI);
                if (angle < 0) angle += 360;
                const sat = (distance / radius) * 100;
                ctx.fillStyle = `hsl(${angle}, ${sat}%, 50%)`;
                ctx.fillRect(x + radius, y + radius, 1, 1);
            }
        }
    }

    // Обработка кликов/перетаскивания по кругу
    let isDraggingWheel = false;

    const handleWheelMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left - radius;
        const y = clientY - rect.top - radius;
        const distance = Math.min(Math.sqrt(x * x + y * y), radius);

        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        state.colorHSL.h = Math.round(angle);
        state.colorHSL.s = Math.round((distance / radius) * 100);

        updateColorPickerUI(true);
    };

    canvas.addEventListener('mousedown', (e) => { isDraggingWheel = true; handleWheelMove(e); });
    window.addEventListener('mousemove', (e) => { if (isDraggingWheel) handleWheelMove(e); });
    window.addEventListener('mouseup', () => { isDraggingWheel = false; });

    canvas.addEventListener('touchstart', (e) => { isDraggingWheel = true; handleWheelMove(e); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (isDraggingWheel) handleWheelMove(e); });
    window.addEventListener('touchend', () => { isDraggingWheel = false; });

    // Ползунки
    const hueSlider = document.getElementById('hueSlider');
    const satSlider = document.getElementById('satSlider');
    const lightSlider = document.getElementById('lightSlider');

    hueSlider.addEventListener('input', (e) => { state.colorHSL.h = Number(e.target.value); updateColorPickerUI(false); });
    satSlider.addEventListener('input', (e) => { state.colorHSL.s = Number(e.target.value); updateColorPickerUI(false); });
    lightSlider.addEventListener('input', (e) => { state.colorHSL.l = Number(e.target.value); updateColorPickerUI(false); });
}

function updateColorPickerUI(fromWheel = false) {
    const { h, s, l } = state.colorHSL;

    // Обновляем ползунки и текстовые значения
    document.getElementById('hueSlider').value = h;
    document.getElementById('satSlider').value = s;
    document.getElementById('lightSlider').value = l;

    document.getElementById('hueVal').textContent = `${h}°`;
    document.getElementById('satVal').textContent = `${s}%`;
    document.getElementById('lightVal').textContent = `${l}%`;

    // Позиционируем маркер на круге
    const canvas = document.getElementById('colorWheelCanvas');
    const handle = document.getElementById('wheelHandle');
    if (canvas && handle) {
        const radius = canvas.width / 2;
        const rad = (h * Math.PI) / 180;
        const dist = (s / 100) * radius;

        const handleX = radius + dist * Math.cos(rad);
        const handleY = radius + dist * Math.sin(rad);

        handle.style.left = `${handleX}px`;
        handle.style.top = `${handleY}px`;
    }

    // Расчет RGB и HEX
    const [r, g, b] = hslToRgb(h, s, l);
    const hex = rgbToHex(r, g, b);

    document.getElementById('previewSwatch').style.background = `hsl(${h}, ${s}%, ${l}%)`;
    document.getElementById('hexCode').textContent = hex;
    document.getElementById('rgbCode').textContent = `rgb(${r}, ${g}, ${b})`;

    // Сохранение и применение
    const strHSL = `${h},${s},${l}`;
    state.customGlowColor = strHSL;
    localStorage.setItem('spatium_custom_glow_color', strHSL);
    applyHSLColor(state.colorHSL);

    if (!state.glowEnabled) {
        toggleGlowEnabled();
    }
}

function resetGlowColor() {
    state.customGlowColor = null;
    localStorage.removeItem('spatium_custom_glow_color');

    state.colorHSL = { h: 180, s: 80, l: 50 };

    const root = document.documentElement;
    root.style.removeProperty('--glow-color-1');
    root.style.removeProperty('--glow-color-2');
    root.style.removeProperty('--glow-color-3');

    updateColorPickerUI();
    toggleColorPickerModal(false);
}

function toggleColorPickerModal(show) {
    const modal = document.getElementById('colorPickerModal');
    if (!modal) return;
    if (show) {
        updateColorPickerUI();
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

function closeColorPicker(e) {
    if (e.target.id === 'colorPickerModal') {
        toggleColorPickerModal(false);
    }
}

/* ==================== МОБИЛЬНЫЕ НАСТРОЙКИ ==================== */
function toggleMobileSettingsModal(show) {
    const modal = document.getElementById('mobileSettingsModal');
    if (!modal) return;
    if (show) {
        updateMobileSettingsUI();
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

function closeMobileSettingsModal(e) {
    if (e.target.id === 'mobileSettingsModal') {
        toggleMobileSettingsModal(false);
    }
}

function openColorPickerFromMobile() {
    toggleMobileSettingsModal(false);
    toggleColorPickerModal(true);
}

function updateMobileSettingsUI() {
    const mobileThemeBtn = document.getElementById('mobileThemeToggleBtn');
    if (mobileThemeBtn) {
        if (state.theme === 'dark') {
            mobileThemeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Тёмная</span>';
            mobileThemeBtn.classList.remove('active');
        } else {
            mobileThemeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Светлая</span>';
            mobileThemeBtn.classList.add('active');
        }
    }

    const mobileSafeBtn = document.getElementById('mobileSafeToggleBtn');
    if (mobileSafeBtn) {
        if (state.epilepsySafe) {
            mobileSafeBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span>Вкл</span>';
            mobileSafeBtn.classList.add('active');
        } else {
            mobileSafeBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span>Выкл</span>';
            mobileSafeBtn.classList.remove('active');
        }
    }

    const mobileGlowBtn = document.getElementById('mobileGlowToggleBtn');
    if (mobileGlowBtn) {
        if (state.glowEnabled) {
            mobileGlowBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> <span>Вкл</span>';
            mobileGlowBtn.classList.add('active');
        } else {
            mobileGlowBtn.innerHTML = '<i class="fa-solid fa-power-off"></i> <span>Выкл</span>';
            mobileGlowBtn.classList.remove('active');
        }
    }
}

/* ==================== ЭПИЛЕПСИЯ И БЕЗОПАСНЫЙ РЕЖИМ ==================== */
function initEpilepsyCheck() {
    const isChoiceMade = localStorage.getItem('spatium_epilepsy_safe') !== null;
    
    if (state.epilepsySafe) {
        document.body.classList.add('epilepsy-safe');
    }

    if (!isChoiceMade) {
        document.getElementById('epilepsyModal').classList.add('active');
    }
}

function setEpilepsySafeMode(isSafe) {
    state.epilepsySafe = isSafe;
    localStorage.setItem('spatium_epilepsy_safe', isSafe ? 'true' : 'false');

    if (isSafe) {
        document.body.classList.add('epilepsy-safe');
    } else {
        document.body.classList.remove('epilepsy-safe');
    }

    document.getElementById('epilepsyModal').classList.remove('active');
    updateMobileSettingsUI();
}

function toggleEpilepsyMode() {
    setEpilepsySafeMode(!state.epilepsySafe);
}

function triggerConsoleTransition(e) {
    e.preventDefault();
    const targetUrl = e.currentTarget.href;

    if (state.epilepsySafe) {
        document.body.classList.add('safe-fade-active');
        setTimeout(() => {
            window.open(targetUrl, "_blank");
            setTimeout(() => {
                document.body.classList.remove('safe-fade-active');
            }, 500);
        }, 500);
    } else {
        document.body.classList.add('glitch-active');
        setTimeout(() => {
            window.open(targetUrl, "_blank");
            setTimeout(() => {
                document.body.classList.remove('glitch-active');
            }, 500);
        }, 800);
    }
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
    updateMobileSettingsUI();
}

function updateThemeAssets() {
    const btn = document.getElementById('themeToggleBtn');
    const logo = document.getElementById('siteLogo');

    if (btn) {
        btn.innerHTML = state.theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    if (logo) {
        logo.src = state.theme === 'dark' ? 'img/spatium_logo_black.png' : 'img/spatium_logo_white.png';
    }
}

/* ==================== НАВИГАЦИЯ ==================== */
function navigateTo(page, param = null) {
    state.currentPage = page;
    state.currentParam = param;
    
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');

    const searchBar = document.getElementById('mobileSearchBar');
    if (searchBar) searchBar.classList.remove('active');
    
    const navHomeBtn = document.getElementById('navHome');
    if (navHomeBtn) {
        navHomeBtn.classList.toggle('active', page === 'home');
    }

    renderSidebar();
    renderContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
    renderContent();
}

/* ==================== РЕНДЕР СИДЕБАРА ==================== */
function renderSidebar() {
    const menu = document.getElementById('sidebarMenu');
    let html = '';

    WIKI_DATA.categories.forEach(cat => {
        const isActive = state.currentPage === 'category' && state.currentParam === cat.id;
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

/* ==================== РЕНДЕР КОНТЕНТА ==================== */
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
    }
}

function getArticleMediaHtml(article, size = 48) {
    if (article.image) {
        return `<img src="${article.image}" alt="${article.title}" style="width: ${size}px; height: ${size}px; object-fit: contain; border-radius: 6px; flex-shrink: 0;">`;
    } else if (article.icon) {
        return `<div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 6px; flex-shrink: 0; font-size: ${size * 0.45}px; color: var(--accent);"><i class="fa-solid ${article.icon}"></i></div>`;
    }
    return `<div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 6px; flex-shrink: 0; font-size: ${size * 0.45}px; color: var(--accent);"><i class="fa-regular fa-file-lines"></i></div>`;
}

function renderHomePage(container) {
    const popularArticles = WIKI_DATA.articles.filter(a => a.popular);
    const recentArticles = [...WIKI_DATA.articles].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);

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
                    <input type="text" placeholder="Поиск по статьям..." onkeyup="handleHeroSearch(event)">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
            </div>

            <div class="section-title"><i class="fa-solid fa-compass"></i> Категории знаний</div>
            <div class="categories-grid">
                ${categoriesHtml}
            </div>

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

    let articlesHtml = articles.length > 0 ? articles.map(a => `
        <div class="search-result-card" onclick="navigateTo('article', '${a.id}')">
            ${getArticleMediaHtml(a, 48)}
            <div class="card-content">
                <h3>${a.title}</h3>
                <p>${a.subtitle}</p>
                <div class="card-date">
                    Обновлено: ${a.updatedAt}
                </div>
            </div>
        </div>
    `).join('') : `<p style="color: var(--text-muted)">В этой категории пока нет статей.</p>`;

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
            <div class="search-results-list">
                ${articlesHtml}
            </div>
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

                <div class="article-header article-header-flex">
                    ${getArticleMediaHtml(article, 64)}
                    <div>
                        <h1 style="margin: 0;">${article.title}</h1>
                        <div class="article-subtitle">${article.subtitle}</div>
                        <div class="article-meta">
                            <span><i class="fa-regular fa-calendar"></i> Обновлено: ${article.updatedAt}</span>
                        </div>
                    </div>
                </div>

                <div class="wiki-body" id="wikiBody">
                    ${article.content}
                </div>
            </div>

            <div class="toc-sidebar">
                <div class="toc-title">Содержание</div>
                <ul class="toc-list" id="tocList"></ul>
            </div>
        </div>
    `;

    generateTOC();
}

function generateTOC() {
    const wikiBody = document.getElementById('wikiBody');
    const tocList = document.getElementById('tocList');
    if (!wikiBody || !tocList) return;

    const headings = wikiBody.querySelectorAll('h2');
    if (headings.length === 0) {
        const tocSidebar = document.querySelector('.toc-sidebar');
        if (tocSidebar) tocSidebar.style.display = 'none';
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

function renderSearchPage(container, query) {
    const cleanQuery = query.toLowerCase().trim();
    const results = WIKI_DATA.articles.filter(a => 
        a.title.toLowerCase().includes(cleanQuery) || 
        a.subtitle.toLowerCase().includes(cleanQuery) ||
        a.content.toLowerCase().includes(cleanQuery)
    );

    let resultsHtml = '';
    if (results.length > 0) {
        resultsHtml = results.map(a => `
            <div class="search-result-card" onclick="navigateTo('article', '${a.id}')">
                ${getArticleMediaHtml(a, 40)}
                <div class="card-content">
                    <h3>${a.title}</h3>
                    <p>${a.subtitle}</p>
                </div>
            </div>
        `).join('');
    } else {
        resultsHtml = `
            <div class="no-results">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>Ничего не найдено</h3>
                <p>По запросу «<strong>${query}</strong>» ничего не удалось найти. Попробуйте изменить формулировку.</p>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="container-narrow">
            <div class="search-results-header">
                <h2>Результаты поиска: "${query}"</h2>
                <p style="color: var(--text-muted)">Найдено материалов: ${results.length}</p>
            </div>
            <div class="search-results-list">
                ${resultsHtml}
            </div>
        </div>
    `;
}

function handleHeaderSearch(e) {
    if (e.key === 'Enter') {
        const query = e.target.value;
        if (query.trim()) navigateTo('search', query);
    }
}

function handleHeroSearch(e) {
    if (e.key === 'Enter') {
        const query = e.target.value;
        if (query.trim()) navigateTo('search', query);
    }
}
