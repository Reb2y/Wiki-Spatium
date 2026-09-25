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

/* ==================== ПАЛИТРА ИЗ 16 ЦВЕТОВ ==================== */
const GLOW_COLORS = [
    { name: "Голубой (Дефолт)", hex: "#36d1dc", rgb: "54, 209, 220" },
    { name: "Синий Электрик", hex: "#0072ff", rgb: "0, 114, 255" },
    { name: "Фиолетовый", hex: "#8a2be2", rgb: "138, 43, 226" },
    { name: "Пурпурный", hex: "#d800ff", rgb: "216, 0, 255" },
    { name: "Неоновый Розовый", hex: "#ff007f", rgb: "255, 0, 127" },
    { name: "Алый Красный", hex: "#ff2a2a", rgb: "255, 42, 42" },
    { name: "Оранжевый Закат", hex: "#ff6b00", rgb: "255, 107, 0" },
    { name: "Янтарный Золотой", hex: "#ffaa00", rgb: "255, 170, 0" },
    { name: "Лаймовый Зеленый", hex: "#00ff66", rgb: "0, 255, 102" },
    { name: "Изумрудный", hex: "#00b060", rgb: "0, 176, 96" },
    { name: "Бирюзовый", hex: "#00f2fe", rgb: "0, 242, 254" },
    { name: "Мятный", hex: "#00ffaa", rgb: "0, 255, 170" },
    { name: "Кибер-Желтый", hex: "#ffe600", rgb: "255, 230, 0" },
    { name: "Глубокий Индиго", hex: "#4a00e0", rgb: "74, 0, 224" },
    { name: "Пастельный Персик", hex: "#ff9a9e", rgb: "255, 154, 158" },
    { name: "Белоснежный Глянцевый", hex: "#ffffff", rgb: "255, 255, 255" }
];

/* ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==================== */
let state = {
    theme: localStorage.getItem('spatium_theme') || 'dark',
    epilepsySafe: localStorage.getItem('spatium_epilepsy_safe') === 'true',
    glowPosition: localStorage.getItem('spatium_glow_position') || 'left',
    glowEnabled: localStorage.getItem('spatium_glow_enabled') !== 'false',
    customGlowColor: localStorage.getItem('spatium_custom_glow_color') || null,
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
    renderSidebar();
    renderColorGrid();
    handleRoute();

    // Открытие / закрытие мобильного меню
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', toggleMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleMobileSidebar);

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
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

/* ==================== ОБРАБОТЧИКИ ПКМ / ЗАЖАТИЯ ==================== */
let holdTimer = null;
let isHoldActionTriggered = false;

function initGlowButtonEvents() {
    const btn = document.getElementById('glowToggleBtn');

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

/* ==================== КАСТОМНЫЕ ЦВЕТА СВЕЧЕНИЯ ==================== */
function initCustomColor() {
    if (state.customGlowColor) {
        applyCustomColor(state.customGlowColor);
    }
}

function applyCustomColor(rgbStr) {
    const root = document.documentElement;
    root.style.setProperty('--glow-color-1', `rgba(${rgbStr}, 0.45)`);
    root.style.setProperty('--glow-color-2', `rgba(${rgbStr}, 0.35)`);
    root.style.setProperty('--glow-color-3', `rgba(${rgbStr}, 0.25)`);
}

function selectGlowColor(colorObj) {
    state.customGlowColor = colorObj.rgb;
    localStorage.setItem('spatium_custom_glow_color', colorObj.rgb);
    applyCustomColor(colorObj.rgb);

    if (!state.glowEnabled) {
        toggleGlowEnabled();
    }

    renderColorGrid();
    toggleColorPickerModal(false);
}

function resetGlowColor() {
    state.customGlowColor = null;
    localStorage.removeItem('spatium_custom_glow_color');

    const root = document.documentElement;
    root.style.removeProperty('--glow-color-1');
    root.style.removeProperty('--glow-color-2');
    root.style.removeProperty('--glow-color-3');

    renderColorGrid();
    toggleColorPickerModal(false);
}

function toggleColorPickerModal(show) {
    const modal = document.getElementById('colorPickerModal');
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function closeColorPicker(e) {
    if (e.target.id === 'colorPickerModal') {
        toggleColorPickerModal(false);
    }
}

function renderColorGrid() {
    const grid = document.getElementById('colorGrid');
    if (!grid) return;

    grid.innerHTML = GLOW_COLORS.map(c => {
        const isActive = state.customGlowColor === c.rgb;
        return `
            <div class="color-swatch ${isActive ? 'active' : ''}" 
                 style="background: ${c.hex}; color: ${c.hex};" 
                 title="${c.name}"
                 onclick="selectGlowColor({ hex: '${c.hex}', rgb: '${c.rgb}' })">
            </div>
        `;
    }).join('');
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

/* ==================== НАВИГАЦИЯ ==================== */
function navigateTo(page, param = null) {
    state.currentPage = page;
    state.currentParam = param;
    
    // Закрываем боковую панель при переходах на мобилке
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');

    // Закрываем мобильный поиск
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

/* --- 1. Главная страница --- */
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

/* --- 2. Страница категории --- */
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
        <div class="search-result-card" onclick="navigateTo('article', '${a.id}')" style="display: flex; align-items: center; gap: 1rem;">
            ${getArticleMediaHtml(a, 48)}
            <div>
                <h3 style="margin: 0;">${a.title}</h3>
                <p style="margin: 0.25rem 0 0 0;">${a.subtitle}</p>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.4rem;">
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

/* --- 3. Страница статьи --- */
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
        document.querySelector('.toc-sidebar').style.display = 'none';
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

/* --- 4. Страница поиска --- */
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
            <div class="search-result-card" onclick="navigateTo('article', '${a.id}')" style="display: flex; align-items: center; gap: 1rem;">
                ${getArticleMediaHtml(a, 40)}
                <div>
                    <h3 style="margin: 0;">${a.title}</h3>
                    <p style="margin: 0.25rem 0 0 0;">${a.subtitle}</p>
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

/* ==================== ХЭНДЛЕРЫ ПОИСКА ==================== */
function handleHeaderSearch(e) {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
        navigateTo('search', e.target.value.trim());
        e.target.value = '';
    }
}

function handleHeroSearch(e) {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
        navigateTo('search', e.target.value.trim());
    }
}
