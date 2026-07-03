(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tabHidden = false;
    document.addEventListener('visibilitychange', () => { tabHidden = document.hidden; });

    /* =========================================================
       1. Matrix digital rain (2D canvas)
    ========================================================= */
    const rain = document.getElementById('rain');
    const rctx = rain.getContext('2d');
    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFｦｧｨｩｪ<>[]{}=+*'.split('');
    let columns = [];
    const fontSize = 16;

    function initRain() {
        rain.width = window.innerWidth;
        rain.height = window.innerHeight;
        const count = Math.floor(rain.width / fontSize);
        columns = new Array(count).fill(0).map(() => Math.random() * -rain.height);
    }

    function drawRain() {
        rctx.fillStyle = 'rgba(0, 6, 0, 0.08)';
        rctx.fillRect(0, 0, rain.width, rain.height);
        rctx.font = fontSize + 'px monospace';
        for (let i = 0; i < columns.length; i++) {
            const char = glyphs[Math.floor(Math.random() * glyphs.length)];
            const x = i * fontSize;
            const y = columns[i];
            // leading glyph brighter
            rctx.fillStyle = Math.random() > 0.975 ? '#c8ffd0' : '#00ff41';
            rctx.fillText(char, x, y);
            columns[i] = y > rain.height && Math.random() > 0.975 ? 0 : y + fontSize;
        }
    }

    /* =========================================================
       2. Three.js background scene (rotating wireframe icosahedron)
    ========================================================= */
    let renderer, camera, scene3d, mesh, particles;
    const mouse = { x: 0, y: 0 };
    let scrollFactor = 0;
    const hasThree = typeof THREE !== 'undefined';

    function initThree() {
        if (!hasThree) return;
        const canvas = document.getElementById('scene');
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        scene3d = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 6;

        // Central glowing wireframe object
        const geo = new THREE.IcosahedronGeometry(2, 1);
        const wire = new THREE.WireframeGeometry(geo);
        mesh = new THREE.LineSegments(wire, new THREE.LineBasicMaterial({
            color: 0x00ff41, transparent: true, opacity: 0.55
        }));
        scene3d.add(mesh);

        // Floating particle field for depth
        const pCount = 400;
        const positions = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) positions[i] = (Math.random() - 0.5) * 30;
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
            color: 0x00b32d, size: 0.06, transparent: true, opacity: 0.7
        }));
        scene3d.add(particles);
    }

    function renderThree() {
        if (!renderer) return;
        mesh.rotation.x += 0.0025;
        mesh.rotation.y += 0.004;
        // subtle mouse parallax
        camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
        camera.position.y += (-mouse.y * 1.5 - camera.position.y) * 0.04;
        // scroll zoom: pull camera back as you descend
        camera.position.z = 6 + scrollFactor * 4;
        camera.lookAt(scene3d.position);
        particles.rotation.y += 0.0006;
        renderer.render(scene3d, camera);
    }

    /* =========================================================
       3. Shared animation loop (throttled when tab hidden)
    ========================================================= */
    function loop() {
        requestAnimationFrame(loop);
        if (tabHidden) return;
        drawRain();
        if (!prefersReducedMotion) renderThree();
    }

    /* =========================================================
       4. Typewriter (hero role)
    ========================================================= */
    function typewriter() {
        const el = document.getElementById('typewriter');
        if (!el) return;
        const phrases = [
            'Aspiring Full-Stack Developer',
            'The Odin Project apprentice',
            'HTML / CSS / JavaScript',
            'Always learning...'
        ];
        if (prefersReducedMotion) { el.textContent = phrases[0]; return; }
        let p = 0, c = 0, deleting = false;
        (function tick() {
            const word = phrases[p];
            el.textContent = deleting ? word.slice(0, c--) : word.slice(0, c++);
            if (!deleting && c > word.length) {
                deleting = true;
                setTimeout(tick, 1600);
            } else if (deleting && c < 0) {
                deleting = false;
                p = (p + 1) % phrases.length;
                setTimeout(tick, 300);
            } else {
                setTimeout(tick, deleting ? 45 : 90);
            }
        })();
    }

    /* =========================================================
       5. Scroll reveals + progress bar + back-to-top
    ========================================================= */
    function initScroll() {
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.15 });
        sections.forEach((s) => observer.observe(s));

        const progress = document.getElementById('scrollProgress');
        const backToTop = document.getElementById('backToTop');
        window.addEventListener('scroll', () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
            progress.style.width = (pct * 100) + '%';
            scrollFactor = pct;
            backToTop.classList.toggle('show', window.scrollY > 400);
            // reveal surprise when at the very bottom
            if (pct > 0.985) openTerminal();
        }, { passive: true });
    }

    /* =========================================================
       6. Project card 3D tilt on hover
    ========================================================= */
    function initTilt() {
        if (prefersReducedMotion) return;
        document.querySelectorAll('.project-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform =
                    `perspective(700px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-6px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    /* =========================================================
       7. Nav + mouse tracking
    ========================================================= */
    function initUI() {
        const hamburger = document.getElementById('hamburger');
        const navMobile = document.getElementById('navMobile');
        hamburger.addEventListener('click', () => navMobile.classList.toggle('active'));
        navMobile.querySelectorAll('a').forEach((a) =>
            a.addEventListener('click', () => navMobile.classList.remove('active')));

        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        });
    }

    /* =========================================================
       8. The surprise: Konami code + bottom-scroll terminal
    ========================================================= */
    const terminal = document.getElementById('terminal');
    const terminalBody = document.getElementById('terminalBody');
    let terminalShown = false;

    const script = [
        { t: 'marios@matrix:~$ ', d: 0 },
        { t: 'sudo unlock --easter-egg\n', d: 40 },
        { t: 'Access granted.\n\n', d: 20 },
        { t: 'Wake up, Marios...\n', d: 70 },
        { t: 'The Matrix has you.\n', d: 70 },
        { t: 'Follow the white rabbit. 🐇\n\n', d: 70 },
        { t: '> Thanks for scrolling all the way down.\n', d: 30 },
        { t: '> This portfolio was hand-built with HTML, CSS,\n', d: 30 },
        { t: '> vanilla JS and three.js. No frameworks.\n\n', d: 30 },
        { t: 'marios@matrix:~$ ', d: 0 },
        { t: 'echo "Let\'s build something."\n', d: 40 },
        { t: 'Let\'s build something.\n', d: 20 },
        { t: 'marios@matrix:~$ _', d: 0 }
    ];

    function openTerminal() {
        if (terminalShown) return;
        terminalShown = true;
        terminal.classList.add('open');
        terminal.setAttribute('aria-hidden', 'false');
        if (prefersReducedMotion) {
            terminalBody.textContent = script.map((s) => s.t).join('');
            return;
        }
        let i = 0, j = 0;
        (function type() {
            if (i >= script.length) return;
            const chunk = script[i];
            if (j < chunk.t.length) {
                terminalBody.textContent += chunk.t[j++];
                terminalBody.scrollTop = terminalBody.scrollHeight;
                setTimeout(type, chunk.d || 10);
            } else {
                i++; j = 0;
                setTimeout(type, 120);
            }
        })();
    }

    function closeTerminal() {
        terminal.classList.remove('open');
        terminal.setAttribute('aria-hidden', 'true');
    }

    function initSurprise() {
        document.getElementById('terminalClose').addEventListener('click', closeTerminal);
        terminal.addEventListener('click', (e) => { if (e.target === terminal) closeTerminal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeTerminal();
        });

        // Konami code
        const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let idx = 0;
        document.addEventListener('keydown', (e) => {
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            idx = key === konami[idx] ? idx + 1 : (key === konami[0] ? 1 : 0);
            if (idx === konami.length) {
                terminalShown = false;
                openTerminal();
                idx = 0;
            }
        });
    }

    /* =========================================================
       Boot
    ========================================================= */
    function onResize() {
        initRain();
        if (renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    window.addEventListener('resize', onResize);
    initRain();
    initThree();
    typewriter();
    initScroll();
    initTilt();
    initUI();
    initSurprise();
    loop();
})();
