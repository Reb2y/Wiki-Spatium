/* =====================================================================
   Spatium Wiki — 3D-ПРОСМОТРЩИК МОДЕЛЕЙ BLOCKBENCH
   Подключается в index.html после script.js.

   Как вставить модель в статью (в поле content):
     <div class="bb-model" data-src="models/sword.bbmodel" data-caption="Меч Душ"></div>

   Необязательные атрибуты:
     data-height="360"       высота окна в px
     data-autorotate="false" не вращать автоматически
     data-speed="2"          скорость автовращения

   Форматы: .bbmodel (проект Blockbench, лучше всего) и .glb / .gltf.
   Файл кладётся в папку models/ рядом с сайтом.
   Кнопки «Скачать» нет, правый клик по модели отключён.
   ===================================================================== */
(function () {
    'use strict';
    if (window.initModelViewers) return;

    const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/';
    const rad = d => (d || 0) * Math.PI / 180;

    /* ---------- ленивая загрузка three.js ---------- */
    const scripts = {};
    function loadScript(url) {
        if (!scripts[url]) {
            scripts[url] = new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = url;
                s.onload = res;
                s.onerror = () => { delete scripts[url]; rej(new Error('Не удалось загрузить библиотеку 3D')); };
                document.head.appendChild(s);
            });
        }
        return scripts[url];
    }
    let baseP = null;
    function loadThree(needGltf) {
        baseP = baseP || loadScript(CDN + 'build/three.min.js').then(() => loadScript(CDN + 'examples/js/controls/OrbitControls.js'));
        return needGltf ? baseP.then(() => loadScript(CDN + 'examples/js/loaders/GLTFLoader.js')) : baseP;
    }

    const jsonCache = new Map();
    function fetchJson(url) {
        if (!jsonCache.has(url)) {
            jsonCache.set(url, fetch(url).then(r => {
                if (!r.ok) throw new Error('Файл не найден (' + r.status + '): ' + url);
                return r.json();
            }).catch(e => { jsonCache.delete(url); throw e; }));
        }
        return jsonCache.get(url);
    }

    /* ---------- парсер .bbmodel ---------- */
    // Углы граней в порядке: левый-верх, правый-верх, правый-низ, левый-низ (если смотреть на грань снаружи)
    function cubeCorners(f, t) {
        return {
            north: [[t[0], t[1], f[2]], [f[0], t[1], f[2]], [f[0], f[1], f[2]], [t[0], f[1], f[2]]],
            south: [[f[0], t[1], t[2]], [t[0], t[1], t[2]], [t[0], f[1], t[2]], [f[0], f[1], t[2]]],
            east:  [[t[0], t[1], t[2]], [t[0], t[1], f[2]], [t[0], f[1], f[2]], [t[0], f[1], t[2]]],
            west:  [[f[0], t[1], f[2]], [f[0], t[1], t[2]], [f[0], f[1], t[2]], [f[0], f[1], f[2]]],
            up:    [[f[0], t[1], f[2]], [t[0], t[1], f[2]], [t[0], t[1], t[2]], [f[0], t[1], t[2]]],
            down:  [[f[0], f[1], t[2]], [t[0], f[1], t[2]], [t[0], f[1], f[2]], [f[0], f[1], f[2]]]
        };
    }
    const NORMALS = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0], up: [0, 1, 0], down: [0, -1, 0] };

    function boxUv(el, dir) {
        const o = el.uv_offset;
        if (!el.box_uv || !o) return null;
        const w = Math.floor(el.to[0] - el.from[0]), h = Math.floor(el.to[1] - el.from[1]), d = Math.floor(el.to[2] - el.from[2]);
        const x = o[0], y = o[1];
        return ({
            up: [x + d, y, x + d + w, y + d],
            down: [x + d + w, y + d, x + d + 2 * w, y],
            east: [x, y + d, x + d, y + d + h],
            north: [x + d, y + d, x + d + w, y + d + h],
            west: [x + d + w, y + d, x + 2 * d + w, y + d + h],
            south: [x + 2 * d + w, y + d, x + 2 * d + 2 * w, y + d + h]
        })[dir];
    }

    function buildBbmodel(T, data) {
        const res = data.resolution || {};
        const RW = res.width || 16, RH = res.height || 16;

        const textures = (data.textures || []).map(t => {
            if (!t || !t.source) return null;
            const img = new Image();
            const tex = new T.Texture(img);
            img.onload = () => { tex.needsUpdate = true; };
            img.src = t.source;
            tex.flipY = false;
            tex.magFilter = T.NearestFilter;
            tex.minFilter = T.NearestFilter;
            tex.generateMipmaps = false;
            tex.encoding = T.sRGBEncoding;
            return { tex, uw: t.uv_width || RW, uh: t.uv_height || RH };
        });

        const mats = {};
        function matFor(ti) {
            const k = ti == null ? 'n' : ti;
            if (!mats[k]) {
                mats[k] = ti != null
                    ? new T.MeshLambertMaterial({ map: textures[ti].tex, side: T.DoubleSide, transparent: true, alphaTest: 0.05 })
                    : new T.MeshLambertMaterial({ color: 0x9aa0ab, side: T.DoubleSide });
            }
            return mats[k];
        }
        function texIndex(v) {
            if (v === false) return false;
            if (v == null) return null;
            const n = Number(v);
            return Number.isInteger(n) && textures[n] ? n : null;
        }

        function cubeFaces(el) {
            const out = [];
            const inf = el.inflate || 0;
            const f = el.from.map(v => v - inf), t = el.to.map(v => v + inf);
            const o = el.origin || [0, 0, 0];
            const corners = cubeCorners(f, t);
            Object.keys(NORMALS).forEach(dir => {
                const face = el.faces && el.faces[dir];
                if (!face) return;
                const ti = texIndex(face.texture);
                if (ti === false) return;
                const uv = face.uv || boxUv(el, dir);
                if (!uv) return;
                const uvc = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
                const k = ((Math.round((face.rotation || 0) / 90) % 4) + 4) % 4;
                out.push({
                    ti,
                    verts: corners[dir].map(p => [p[0] - o[0], p[1] - o[1], p[2] - o[2]]),
                    uvs: [0, 1, 2, 3].map(i => uvc[(i - k + 4) % 4]),
                    normal: NORMALS[dir]
                });
            });
            return out;
        }

        function meshFaces(el) {
            const out = [];
            Object.keys(el.faces || {}).forEach(fid => {
                const face = el.faces[fid];
                const ti = texIndex(face.texture);
                if (ti === false) return;
                const ids = face.vertices || [];
                if (ids.length < 3) return;
                const verts = ids.map(id => el.vertices && el.vertices[id]);
                if (verts.some(v => !v)) return;
                const a = verts[0], b = verts[1], c = verts[2];
                const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
                const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
                let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
                const len = Math.hypot(n[0], n[1], n[2]) || 1;
                n = n.map(x => x / len);
                out.push({
                    ti, verts,
                    uvs: ids.map(id => (face.uv && face.uv[id]) || [0, 0]),
                    normal: n
                });
            });
            return out;
        }

        function buildElement(el) {
            const faces = el.type === 'mesh' ? meshFaces(el) : (el.from && el.to ? cubeFaces(el) : []);
            if (!faces.length) return null;
            faces.sort((a, b) => (a.ti == null ? -1 : a.ti) - (b.ti == null ? -1 : b.ti));
            const pos = [], nor = [], uv = [], groups = [], matList = [];
            let cur = null, count = 0;
            faces.forEach(fc => {
                const key = fc.ti == null ? 'n' : fc.ti;
                if (!cur || cur.key !== key) {
                    cur = { key, start: count, count: 0, mi: matList.length };
                    matList.push(matFor(fc.ti));
                    groups.push(cur);
                }
                const tw = fc.ti != null ? textures[fc.ti].uw : RW;
                const th = fc.ti != null ? textures[fc.ti].uh : RH;
                for (let i = 1; i < fc.verts.length - 1; i++) {
                    [0, i, i + 1].forEach(j => {
                        pos.push(fc.verts[j][0], fc.verts[j][1], fc.verts[j][2]);
                        nor.push(fc.normal[0], fc.normal[1], fc.normal[2]);
                        uv.push(fc.uvs[j][0] / tw, fc.uvs[j][1] / th);
                        count++; cur.count++;
                    });
                }
            });
            const g = new T.BufferGeometry();
            g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
            g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
            g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
            groups.forEach(gr => g.addGroup(gr.start, gr.count, gr.mi));
            return new T.Mesh(g, matList);
        }

        function place(obj, origin, parentOrigin, rotation) {
            obj.position.set(origin[0] - parentOrigin[0], origin[1] - parentOrigin[1], origin[2] - parentOrigin[2]);
            obj.rotation.order = 'ZYX';
            const r = rotation || [0, 0, 0];
            obj.rotation.set(rad(r[0]), rad(r[1]), rad(r[2]));
        }

        const elements = {};
        (data.elements || []).forEach(e => { if (e && e.uuid) elements[e.uuid] = e; });
        const used = new Set();
        const root = new T.Group();

        function addNode(node, parent, parentOrigin) {
            if (typeof node === 'string') {
                const el = elements[node];
                if (!el || el.visibility === false) return;
                used.add(node);
                const mesh = buildElement(el);
                if (!mesh) return;
                place(mesh, el.origin || [0, 0, 0], parentOrigin, el.rotation);
                parent.add(mesh);
            } else if (node && typeof node === 'object') {
                if (node.visibility === false) return;
                const g = new T.Group();
                const o = node.origin || [0, 0, 0];
                place(g, o, parentOrigin, node.rotation);
                parent.add(g);
                (node.children || []).forEach(c => addNode(c, g, o));
            }
        }

        (data.outliner || []).forEach(n => addNode(n, root, [0, 0, 0]));
        Object.keys(elements).forEach(id => { if (!used.has(id) && !(data.outliner || []).length) addNode(id, root, [0, 0, 0]); });
        return root;
    }

    /* ---------- реестр и очистка ---------- */
    const viewers = new Set();
    function pruneViewers() {
        viewers.forEach(v => { if (!v.host.isConnected) v.dispose(); });
    }
    setInterval(pruneViewers, 3000);

    function isTouch() { return window.matchMedia && window.matchMedia('(pointer: coarse)').matches; }
    function calmMotion() {
        return document.body.classList.contains('epilepsy-safe') ||
            (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    /* ---------- сам просмотрщик ---------- */
    function createViewer(host) {
        host.dataset.bbReady = '1';
        host.classList.add('bb-viewer');
        const src = (host.dataset.src || '').trim();
        const height = parseInt(host.dataset.height, 10) || 360;
        host.style.setProperty('--bb-h', height + 'px');
        const caption = host.dataset.caption || '';
        const hintText = isTouch() ? 'Тяни — вращать · двумя пальцами — масштаб' : 'Тяни — вращать · Ctrl + колесо — масштаб';

        host.innerHTML = `
            <div class="bb-stage">
                <div class="bb-status"><i class="fa-solid fa-cube"></i><span>Загрузка модели…</span></div>
            </div>
            <div class="bb-toolbar" hidden>
                <button type="button" class="bb-btn" data-bb="rotate" aria-label="Автовращение" title="Автовращение"><i class="fa-solid fa-pause"></i></button>
                <button type="button" class="bb-btn" data-bb="zin" aria-label="Приблизить" title="Приблизить"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                <button type="button" class="bb-btn" data-bb="zout" aria-label="Отдалить" title="Отдалить"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                <button type="button" class="bb-btn" data-bb="reset" aria-label="Сбросить вид" title="Сбросить вид"><i class="fa-solid fa-rotate-left"></i></button>
                <button type="button" class="bb-btn" data-bb="full" aria-label="На весь экран" title="На весь экран"><i class="fa-solid fa-expand"></i></button>
            </div>
            <div class="bb-hint" hidden></div>
            ${caption ? '<div class="bb-caption"></div>' : ''}`;
        const stage = host.querySelector('.bb-stage');
        const status = host.querySelector('.bb-status');
        const toolbar = host.querySelector('.bb-toolbar');
        const hint = host.querySelector('.bb-hint');
        hint.textContent = hintText;
        const capEl = host.querySelector('.bb-caption');
        if (capEl) capEl.textContent = caption;

        // Защита от «скачать как картинку / перетащить / ПКМ»
        host.addEventListener('contextmenu', e => e.preventDefault());
        host.addEventListener('dragstart', e => e.preventDefault());

        const state = { disposed: false, started: false, visible: false, raf: 0 };
        let T, renderer, scene, camera, controls, modelRoot, resizeObs, io;
        let radius = 1, hintTimer = 0;

        function fail(msg) {
            status.hidden = false;
            status.classList.add('error');
            status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span></span>';
            status.querySelector('span').textContent = msg;
        }

        function flashHint() {
            hint.hidden = false;
            hint.classList.add('show');
            clearTimeout(hintTimer);
            hintTimer = setTimeout(() => hint.classList.remove('show'), 2200);
        }

        function frame() {
            state.raf = 0;
            if (state.disposed) return;
            if (!host.isConnected) { api.dispose(); return; }
            if (!state.visible || document.hidden) return;
            controls.update();
            renderer.render(scene, camera);
            state.raf = requestAnimationFrame(frame);
        }
        function wake() {
            if (!state.raf && !state.disposed && controls && state.visible && !document.hidden) {
                state.raf = requestAnimationFrame(frame);
            }
        }
        document.addEventListener('visibilitychange', wake);

        function resize() {
            if (!renderer) return;
            const w = stage.clientWidth, h = stage.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            wake();
        }

        function setRotateBtn() {
            const b = toolbar.querySelector('[data-bb="rotate"] i');
            b.className = controls.autoRotate ? 'fa-solid fa-pause' : 'fa-solid fa-play';
        }

        function zoom(f) {
            const dir = camera.position.clone().sub(controls.target).multiplyScalar(f);
            const d = Math.min(Math.max(dir.length(), controls.minDistance), controls.maxDistance);
            dir.setLength(d);
            camera.position.copy(controls.target).add(dir);
            controls.update();
            wake();
        }

        function setupScene(root) {
            modelRoot = root;
            scene.add(root);
            // центрируем модель в начале координат
            const box = new T.Box3().setFromObject(root);
            const center = box.getCenter(new T.Vector3());
            root.position.sub(center);
            const sphere = box.getBoundingSphere(new T.Sphere());
            radius = Math.max(sphere.radius, 0.01);

            const fov = camera.fov * Math.PI / 180;
            const dist = radius / Math.sin(fov / 2) * 1.05;
            camera.near = radius / 100;
            camera.far = radius * 100;
            camera.position.set(0.8, 0.55, 1.15).normalize().multiplyScalar(dist);
            camera.updateProjectionMatrix();
            controls.target.set(0, 0, 0);
            controls.minDistance = radius * 0.6;
            controls.maxDistance = dist * 4;
            controls.update();
            controls.saveState();
        }

        async function start() {
            if (state.started) return;
            state.started = true;
            if (!src) return fail('Не указан путь к модели (data-src)');
            const isGltf = /\.(glb|gltf)(\?.*)?$/i.test(src);
            try {
                T = await loadThree(isGltf);
                if (state.disposed) return;

                try {
                    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
                } catch (e) {
                    return fail('Браузер не поддерживает WebGL — 3D-модель недоступна');
                }
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.outputEncoding = T.sRGBEncoding;
                renderer.setClearColor(0x000000, 0);
                stage.appendChild(renderer.domElement);
                renderer.domElement.setAttribute('aria-label', caption || 'Интерактивная 3D-модель');
                renderer.domElement.draggable = false;

                scene = new T.Scene();
                scene.add(new T.AmbientLight(0xffffff, 0.72));
                const key = new T.DirectionalLight(0xffffff, 0.55); key.position.set(3, 5, 4); scene.add(key);
                const fill = new T.DirectionalLight(0xffffff, 0.25); fill.position.set(-4, 2, -3); scene.add(fill);
                camera = new T.PerspectiveCamera(38, 1, 0.1, 1000);

                controls = new T.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.08;
                controls.enablePan = false;
                controls.autoRotateSpeed = parseFloat(host.dataset.speed) || 2;
                controls.autoRotate = host.dataset.autorotate !== 'false' && !calmMotion();
                controls.addEventListener('start', () => {
                    if (controls.autoRotate) { controls.autoRotate = false; setRotateBtn(); }
                    stage.classList.add('dragging');
                });
                controls.addEventListener('end', () => stage.classList.remove('dragging'));

                // колесо листает страницу; масштаб — только с Ctrl или в полном экране
                stage.addEventListener('wheel', e => {
                    if (!(document.fullscreenElement === host || e.ctrlKey || e.metaKey)) {
                        e.stopImmediatePropagation();
                        flashHint();
                    }
                }, { capture: true, passive: true });

                let root;
                if (isGltf) {
                    root = await new Promise((res, rej) => {
                        new T.GLTFLoader().load(src, g => res(g.scene), undefined, () => rej(new Error('Файл не найден или повреждён: ' + src)));
                    });
                    root.traverse(o => {
                        if (!o.material) return;
                        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
                            if (m.map) { m.map.magFilter = T.NearestFilter; m.map.minFilter = T.NearestFilter; m.map.needsUpdate = true; }
                        });
                    });
                } else {
                    const data = await fetchJson(src);
                    if (state.disposed) return;
                    root = buildBbmodel(T, data);
                }
                if (state.disposed) return;
                if (!root.children.length) return fail('В модели нет видимых элементов');

                setupScene(root);
                status.hidden = true;
                toolbar.hidden = false;
                hint.hidden = false;
                hint.classList.add('show');
                hintTimer = setTimeout(() => hint.classList.remove('show'), 4000);
                setRotateBtn();
                if (!host.requestFullscreen) toolbar.querySelector('[data-bb="full"]').hidden = true;

                resizeObs = new ResizeObserver(resize);
                resizeObs.observe(stage);
                resize();
                wake();
            } catch (err) {
                fail(location.protocol === 'file:'
                    ? 'Откройте сайт через сервер (не file://) — иначе браузер не даёт читать файл модели'
                    : (err && err.message) || 'Не удалось загрузить модель');
            }
        }

        toolbar.addEventListener('click', e => {
            const b = e.target.closest('[data-bb]');
            if (!b || !controls) return;
            switch (b.dataset.bb) {
                case 'rotate': controls.autoRotate = !controls.autoRotate; setRotateBtn(); break;
                case 'zin': zoom(0.8); break;
                case 'zout': zoom(1.25); break;
                case 'reset': controls.reset(); break;
                case 'full':
                    if (document.fullscreenElement === host) document.exitFullscreen();
                    else host.requestFullscreen().catch(() => {});
                    break;
            }
            wake();
        });
        const onFs = () => {
            const on = document.fullscreenElement === host;
            host.classList.toggle('bb-full', on);
            const i = toolbar.querySelector('[data-bb="full"] i');
            if (i) i.className = on ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
            setTimeout(resize, 50);
        };
        document.addEventListener('fullscreenchange', onFs);

        io = new IntersectionObserver(entries => {
            state.visible = entries[0].isIntersecting;
            if (state.visible) { start(); wake(); }
        }, { rootMargin: '200px' });
        io.observe(host);

        const api = {
            host,
            dispose() {
                if (state.disposed) return;
                state.disposed = true;
                viewers.delete(api);
                cancelAnimationFrame(state.raf);
                clearTimeout(hintTimer);
                document.removeEventListener('visibilitychange', wake);
                document.removeEventListener('fullscreenchange', onFs);
                if (io) io.disconnect();
                if (resizeObs) resizeObs.disconnect();
                if (controls) controls.dispose();
                if (modelRoot) {
                    modelRoot.traverse(o => {
                        if (o.geometry) o.geometry.dispose();
                        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    });
                }
                if (renderer) {
                    renderer.dispose();
                    if (renderer.forceContextLoss) renderer.forceContextLoss();
                }
            }
        };
        viewers.add(api);
        return api;
    }

    function initModelViewers(root) {
        pruneViewers();
        (root || document).querySelectorAll('.bb-model:not([data-bb-ready])').forEach(createViewer);
    }
    window.initModelViewers = initModelViewers;

    /* ---------- автозапуск: ловим появление .bb-model в DOM (статьи, предпросмотр в админке) ---------- */
    let scanT = 0;
    function scheduleScan() {
        clearTimeout(scanT);
        scanT = setTimeout(() => {
            if (document.querySelector('.bb-model:not([data-bb-ready])')) initModelViewers(document);
        }, 400);
    }
    function boot() {
        new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true });
        scheduleScan();
    }
    if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
