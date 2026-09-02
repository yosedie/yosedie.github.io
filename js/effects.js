// ============================================================
//  Yosedie Effects Pack
//  decode · glitch · matrix wiring · terminal · constellation
//  parallax · HUD · retro sounds · scanline/glow cards
//  Self-contained vanilla JS — no dependencies, CSP-safe.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. TEXT DECODE — section headings decrypt on activation ----------
       Scrambles per TEXT NODE only: element structure (gradient spans, <br>)
       is never destroyed, so it can never leave a heading half-empty. */
    const CHARS = '!<>-_\\/[]{}=+*^?#01ABCDEF';
    const rndChar = () => CHARS[(Math.random() * CHARS.length) | 0];
    function scrambleText(el, duration) {
        if (el.dataset.fxDecoded) return;
        el.dataset.fxDecoded = '1';
        const nodes = [];
        (function collect(node) {
            node.childNodes.forEach(child => {
                if (child.nodeType === 3 && child.nodeValue.trim()) nodes.push({ node: child, original: child.nodeValue });
                else if (child.nodeType === 1) collect(child);
            });
        })(el);
        const total = nodes.reduce((a, n) => a + n.original.length, 0);
        const start = performance.now();
        (function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            let reveal = Math.floor(total * t);
            for (const n of nodes) {
                if (t >= 1) { n.node.nodeValue = n.original; continue; }
                if (reveal <= 0) {
                    n.node.nodeValue = [...n.original].map(rndChar).join('');
                } else if (reveal >= n.original.length) {
                    n.node.nodeValue = n.original;
                } else {
                    n.node.nodeValue = n.original.slice(0, reveal) + [...n.original.slice(reveal)].map(rndChar).join('');
                }
                reveal -= n.original.length;
            }
            if (t < 1) requestAnimationFrame(frame);
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
            el.addEventListener('mouseenter', () => {
                if (reduceMotion) return;
                el.classList.add('fx-glitching');
                setTimeout(() => el.classList.remove('fx-glitching'), 420);
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

    /* ---------- 5. NEURAL CONSTELLATION — global background network ---------- */
    function initConstellation() {
        const canvas = document.createElement('canvas');
        canvas.id = 'fx-constellation';
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        document.body.insertBefore(canvas, document.body.firstChild);
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0, h = 0, nodes = [];
        const mouse = { x: -9999, y: -9999 };

        function resize() {
            w = window.innerWidth; h = window.innerHeight;
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
        window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
        document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

        (function loop() {
            requestAnimationFrame(loop);
            if (document.hidden) return;
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

    /* ---------- 8. AUDIO — generative BGM (25%) + UI sounds (50%) ---------- */
    let audioCtx = null;
    let bgmVol = parseInt(localStorage.getItem('yosedie-bgm-vol') || '25', 10);
    let sfxVol = parseInt(localStorage.getItem('yosedie-sfx-vol') || '50', 10);
    if (isNaN(bgmVol)) bgmVol = 25;
    if (isNaN(sfxVol)) sfxVol = 50;
    const audio = { master: null, bgm: null, started: false, chordIndex: 0, bgmTimer: null };

    function ensureAudio() {
        if (audio.started) {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return true;
        }
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            audio.master = audioCtx.createGain();
            audio.master.gain.value = 1;
            audio.master.connect(audioCtx.destination);
            audio.started = true;
            if (bgmVol > 0) startBgm();
            return true;
        } catch (e) { return false; }
    }

    // Generative ambient BGM — soft detuned pad chords, no audio files.
    const CHORDS = [
        [220.00, 261.63, 329.63, 392.00],  // Am7
        [174.61, 220.00, 261.63, 329.63],  // Fmaj7
        [130.81, 164.81, 196.00, 246.94],  // Cmaj7
        [196.00, 246.94, 293.66, 349.23]   // G
    ];
    function startBgm() {
        if (!ensureAudio()) return;
        audio.bgm = audioCtx.createGain();
        audio.bgm.gain.value = (bgmVol / 100) * 0.5;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 850;
        audio.bgm.connect(lp); lp.connect(audio.master);
        playChord();
        audio.bgmTimer = setInterval(playChord, 4800);
    }
    function playChord() {
        if (bgmVol === 0 || audioCtx.state === 'suspended') return;
        const chord = CHORDS[audio.chordIndex % CHORDS.length];
        audio.chordIndex++;
        const t = audioCtx.currentTime;
        chord.forEach((f, i) => {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = i === 0 ? 'sine' : 'triangle';
            o.frequency.value = f;
            o.detune.value = (i - 1.5) * 5;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.055, t + 1.8);   // slow swell
            g.gain.setValueAtTime(0.055, t + 3.6);
            g.gain.linearRampToValueAtTime(0, t + 5.4);       // overlaps next chord
            o.connect(g); g.connect(audio.bgm);
            o.start(t); o.stop(t + 5.5);
        });
    }

    let lastBlip = 0;
    function blip(freq, dur, type) {
        if (sfxVol === 0) return;
        const now = performance.now();
        if (now - lastBlip < 60) return;
        lastBlip = now;
        if (!ensureAudio()) return;
        try {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = type || 'sine';
            o.frequency.value = freq;
            const peak = (sfxVol / 100) * 0.06;
            g.gain.setValueAtTime(peak, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            o.connect(g); g.connect(audio.master);
            o.start(); o.stop(audioCtx.currentTime + dur);
        } catch (e) { /* audio unavailable */ }
    }
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest && e.target.closest('.sidebar-nav-link, .ctx-item, a, button')) blip(1250, 0.05);
    });
    document.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('a, button')) blip(620, 0.09, 'triangle');
    });
    // browsers allow audio only after a gesture — first interaction wakes it
    const wake = () => { ensureAudio(); document.removeEventListener('pointerdown', wake); document.removeEventListener('keydown', wake); };
    document.addEventListener('pointerdown', wake);
    document.addEventListener('keydown', wake);

    /* ---------- 9. PANEL WIRING — Matrix mode & volume sliders ---------- */
    function wirePanel() {
        const matrixToggle = document.getElementById('matrix-toggle');
        if (matrixToggle) {
            matrixToggle.addEventListener('change', () => {
                if (window.rainControls && window.rainControls.setMatrix) {
                    window.rainControls.setMatrix(matrixToggle.checked);
                }
            });
        }
        const bgmSlider = document.getElementById('bgm-vol');
        const bgmValue = document.getElementById('bgm-vol-value');
        if (bgmSlider) {
            bgmSlider.value = bgmVol;
            if (bgmValue) bgmValue.textContent = bgmVol + '%';
            bgmSlider.addEventListener('input', () => {
                bgmVol = parseInt(bgmSlider.value, 10);
                localStorage.setItem('yosedie-bgm-vol', String(bgmVol));
                if (bgmValue) bgmValue.textContent = bgmVol + '%';
                if (audio.bgm) audio.bgm.gain.value = (bgmVol / 100) * 0.5;
                if (bgmVol > 0) startBgm();
            });
        }
        const sfxSlider = document.getElementById('sfx-vol');
        const sfxValue = document.getElementById('sfx-vol-value');
        if (sfxSlider) {
            sfxSlider.value = sfxVol;
            if (sfxValue) sfxValue.textContent = sfxVol + '%';
            sfxSlider.addEventListener('input', () => {
                sfxVol = parseInt(sfxSlider.value, 10);
                localStorage.setItem('yosedie-sfx-vol', String(sfxVol));
                if (sfxValue) sfxValue.textContent = sfxVol + '%';
                blip(880, 0.12);
            });
        }
    }
    wirePanel();

    /* ---------- boot ---------- */
    initConstellation();
    initParallax();
    initHUD();
})();
