// ============================================================
//  Yosedie Effects Pack
//  decode · glitch · matrix wiring · terminal · constellation
//  parallax · HUD · retro sounds · scanline/glow cards
//  Self-contained vanilla JS — no dependencies, CSP-safe.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. TEXT DECODE — section headings decrypt on activation ---------- */
    const CHARS = '!<>-_\\/[]{}=+*^?#01ABCDEF';
    function scrambleText(el, duration) {
        if (el.dataset.fxDecoded) return;
        el.dataset.fxDecoded = '1';
        const original = el.innerHTML;      // restored at the end (keeps gradient spans)
        const plain = el.textContent;
        const start = performance.now();
        (function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            const reveal = Math.floor(plain.length * t);
            let out = '';
            for (let i = 0; i < plain.length; i++) {
                out += i < reveal ? plain[i] : CHARS[(Math.random() * CHARS.length) | 0];
            }
            el.textContent = out;
            if (t < 1) requestAnimationFrame(frame);
            else el.innerHTML = original;
        })(start);
    }

    document.querySelectorAll('main > section').forEach(sec => {
        if (sec.id === 'hero') return; // hero has its own typing animation
        new MutationObserver(() => {
            if (sec.classList.contains('active-section') && !reduceMotion) {
                sec.querySelectorAll('h2').forEach(h => scrambleText(h, 850));
            }
        }).observe(sec, { attributes: true, attributeFilter: ['class'] });
    });

    /* ---------- 2. GLITCH — logo & headings jitter on hover ---------- */
    function initGlitch() {
        const targets = [
            document.querySelector('#sidebar-header h1'),
            ...document.querySelectorAll('main > section h2')
        ];
        targets.forEach(el => {
            if (!el || el.dataset.fxGlitch) return;
            el.dataset.fxGlitch = '1';
            el.classList.add('fx-glitchable');
            el.setAttribute('data-text', el.textContent.replace(/\s+/g, ' ').trim());
            el.addEventListener('mouseenter', () => {
                if (reduceMotion) return;
                el.classList.add('fx-glitching');
                setTimeout(() => el.classList.remove('fx-glitching'), 400);
            });
        });
    }
    initGlitch();

    /* ---------- 3. SCANLINE + CURSOR-GLOW on cards ---------- */
    function tagCards() {
        document.querySelectorAll(
            '.project-card, .feature-card, .certification-card, .timeline-item'
        ).forEach(card => {
            card.classList.add('fx-scan', 'fx-glowcard');
        });
    }
    tagCards();
    new MutationObserver(() => tagCards()).observe(document.body, { childList: true, subtree: true });

    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.fx-glowcard');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });

    /* ---------- 4. SECRET TERMINAL — type "hack" anywhere ---------- */
    let termBuf = '';
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeTerminal(); return; }
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (e.key.length !== 1) return;
        termBuf = (termBuf + e.key.toLowerCase()).slice(-4);
        if (termBuf === 'hack') { termBuf = ''; openTerminal(); }
    });

    function openTerminal() {
        let term = document.getElementById('fx-terminal');
        if (!term) {
            term = document.createElement('div');
            term.id = 'fx-terminal';
            term.innerHTML = `
                <span class="fx-term-close">[ESC] CLOSE</span>
                <pre id="fx-term-body"></pre>`;
            document.body.appendChild(term);
            term.querySelector('.fx-term-close').addEventListener('click', closeTerminal);
        }
        term.classList.add('open');
        const body = term.querySelector('#fx-term-body');
        body.innerHTML = '';
        const lines = [
            '> initiating access protocol...',
            '> context menu ............ LOCKED',
            '> CSP ..................... ENFORCED',
            '> CDN integrity (SRI) ..... VERIFIED',
            '> neural uplink ........... CONNECTED',
            '',
            'ACCESS GRANTED — welcome, operator.',
            'system status: all effects nominal. ヨセディ',
            '',
            '[ESC] disconnect'
        ];
        let li = 0;
        (function typeLine() {
            if (li >= lines.length || !term.classList.contains('open')) return;
            const row = document.createElement('div');
            body.appendChild(row);
            const text = lines[li];
            let ci = 0;
            (function typeChar() {
                if (!term.classList.contains('open')) return;
                row.textContent = text.slice(0, ++ci);
                if (ci < text.length) setTimeout(typeChar, 14);
                else { li++; setTimeout(typeLine, 120); }
            })();
        })();
    }
    function closeTerminal() {
        const term = document.getElementById('fx-terminal');
        if (term) term.classList.remove('open');
    }

    /* ---------- 5. NEURAL CONSTELLATION — hero network canvas ---------- */
    function initConstellation() {
        const hero = document.getElementById('hero');
        if (!hero || reduceMotion) return;
        const canvas = document.createElement('canvas');
        canvas.id = 'fx-constellation';
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        hero.insertBefore(canvas, hero.firstChild);
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0, h = 0, nodes = [];
        const mouse = { x: -9999, y: -9999 };

        function resize() {
            w = hero.clientWidth; h = hero.clientHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.max(30, Math.min(70, Math.floor(w / 18)));
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
                r: 1.4 + Math.random() * 1.6
            }));
        }
        resize();
        window.addEventListener('resize', resize);
        hero.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        });
        hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

        (function loop() {
            requestAnimationFrame(loop);
            if (!hero.classList.contains('active-section') || document.hidden) return;
            ctx.clearRect(0, 0, w, h);
            for (const n of nodes) {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, 6.2832);
                ctx.fillStyle = 'rgba(99,102,241,0.5)';
                ctx.fill();
            }
            const LINK = 130;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
                    const d = Math.hypot(dx, dy);
                    if (d < LINK) {
                        ctx.strokeStyle = 'rgba(99,102,241,' + (0.32 * (1 - d / LINK)).toFixed(3) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            for (const n of nodes) {
                const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
                if (d < 170) {
                    ctx.strokeStyle = 'rgba(236,72,153,' + (0.45 * (1 - d / 170)).toFixed(3) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        })();
    }

    /* ---------- 6. HERO PARALLAX DEPTH ---------- */
    function initParallax() {
        if (reduceMotion) return;
        const hero = document.getElementById('hero');
        const avatar = hero?.querySelector('#hero-content img')?.parentElement;
        const heading = hero?.querySelector('#hero-content h2');
        if (!hero || !avatar || !heading) return;
        let tx = 0, ty = 0, cx = 0, cy = 0;
        hero.addEventListener('mousemove', (e) => {
            const r = hero.getBoundingClientRect();
            tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        });
        hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; });
        (function loop() {
            requestAnimationFrame(loop);
            if (!hero.classList.contains('active-section')) return;
            cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
            avatar.style.transform = 'translate3d(' + (cx * 14).toFixed(2) + 'px,' + (cy * 10).toFixed(2) + 'px,0)';
            heading.style.transform = 'translate3d(' + (cx * -6).toFixed(2) + 'px,' + (cy * -4).toFixed(2) + 'px,0)';
        })();
    }

    /* ---------- 7. SYSTEM HUD — UTC clock · FPS · uptime ---------- */
    function initHUD() {
        const hud = document.createElement('div');
        hud.id = 'fx-hud';
        hud.className = 'hidden md:flex';
        hud.textContent = 'SYS --:--:-- UTC';
        document.body.appendChild(hud);
        const START = Date.now();
        let frames = 0, last = performance.now(), fps = 60;
        (function fpsLoop(now) {
            frames++;
            if (now - last >= 1000) {
                fps = Math.round(frames * 1000 / (now - last));
                frames = 0; last = now;
            }
            requestAnimationFrame(fpsLoop);
        })(performance.now());
        setInterval(() => {
            const t = new Date();
            const up = Math.floor((t - START) / 1000);
            hud.textContent = 'SYS ' + t.toISOString().slice(11, 19) + ' UTC · ' + fps +
                ' FPS · UP ' + String(Math.floor(up / 60)).padStart(2, '0') + ':' + String(up % 60).padStart(2, '0');
        }, 1000);
    }

    /* ---------- 8. RETRO SOUNDS — muted by default ---------- */
    let audioCtx = null;
    let soundOn = localStorage.getItem('yosedie-fx-sound') === 'on';
    let lastBlip = 0;
    function blip(freq, dur, type) {
        if (!soundOn) return;
        const now = performance.now();
        if (now - lastBlip < 60) return;
        lastBlip = now;
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = type || 'sine';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.025, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(); o.stop(audioCtx.currentTime + dur);
        } catch (e) { /* audio unavailable */ }
    }
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest && e.target.closest('.sidebar-nav-link, .ctx-item, a, button')) blip(1250, 0.05);
    });
    document.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('a, button')) blip(620, 0.09, 'triangle');
    });

    /* ---------- 9. PANEL WIRING — Matrix mode & UI sounds ---------- */
    function wirePanel() {
        const matrixToggle = document.getElementById('matrix-toggle');
        if (matrixToggle) {
            matrixToggle.addEventListener('change', () => {
                if (window.rainControls && window.rainControls.setMatrix) {
                    window.rainControls.setMatrix(matrixToggle.checked);
                }
            });
        }
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.checked = soundOn;
            soundToggle.addEventListener('change', () => {
                soundOn = soundToggle.checked;
                localStorage.setItem('yosedie-fx-sound', soundOn ? 'on' : 'off');
                if (soundOn) blip(880, 0.12);
            });
        }
    }
    wirePanel();

    /* ---------- boot ---------- */
    initConstellation();
    initParallax();
    initHUD();
})();
