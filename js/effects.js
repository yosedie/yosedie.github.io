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

    /* ---------- 8. AUDIO — generative BGM + UI sounds, with style picker ---------- */
    let audioCtx = null;
    let bgmVol = parseInt(localStorage.getItem('yosedie-bgm-vol') || '25', 10);
    let sfxVol = parseInt(localStorage.getItem('yosedie-sfx-vol') || '50', 10);
    let bgmStyle = localStorage.getItem('yosedie-bgm-style') || 'ambient';
    let sfxStyle = localStorage.getItem('yosedie-sfx-style') || 'soft';
    if (isNaN(bgmVol)) bgmVol = 25;
    if (isNaN(sfxVol)) sfxVol = 50;
    const audio = { master: null, bgm: null, started: false, chordIndex: 0, bgmTimer: null };

    // ---- BGM style definitions (each is a tiny generative composition) ----
    const BGM_STYLES = {
        ambient: {
            interval: 4800, filter: 850, gain: 0.055, attack: 1.8, hold: 1.8, release: 1.8, detune: 5,
            wave: (i) => (i === 0 ? 'sine' : 'triangle'),
            chords: [
                [220.00, 261.63, 329.63, 392.00],
                [174.61, 220.00, 261.63, 329.63],
                [130.81, 164.81, 196.00, 246.94],
                [196.00, 246.94, 293.66, 349.23]
            ]
        },
        lofi: {
            interval: 5200, filter: 600, gain: 0.05, attack: 0.9, hold: 2.4, release: 1.9, detune: 9,
            wave: () => 'sine',
            chords: [
                [233.08, 293.66, 349.23, 440.00],
                [155.56, 233.08, 311.13, 369.99],
                [261.63, 329.63, 392.00, 466.16],
                [196.00, 233.08, 293.66, 349.23]
            ]
        },
        synthwave: {
            interval: 2000, filter: 1400, gain: 0.03, attack: 0.05, hold: 0.5, release: 0.9, detune: 12,
            wave: () => 'sawtooth',
            chords: [
                [146.83, 174.61, 220.00, 293.66],
                [116.54, 146.83, 174.61, 233.08],
                [174.61, 220.00, 261.63, 349.23],
                [130.81, 164.81, 196.00, 261.63]
            ]
        },
        zen: {
            interval: 1500, filter: 2200, gain: 0.09, pluck: true,
            pool: [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]  // C pentatonic
        }
    };

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

    function startBgm() {
        if (!ensureAudio()) return;
        const style = BGM_STYLES[bgmStyle] || BGM_STYLES.ambient;
        if (audio.bgmTimer) clearInterval(audio.bgmTimer);
        if (audio.bgm) { try { audio.bgm.disconnect(); } catch (e) {} }
        audio.bgm = audioCtx.createGain();
        audio.bgm.gain.value = (bgmVol / 100) * 0.5;
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = style.filter;
        audio.bgm.connect(lp); lp.connect(audio.master);
        playBgmStep();
        audio.bgmTimer = setInterval(playBgmStep, style.interval);
    }

    function playBgmStep() {
        if (bgmVol === 0 || audioCtx.state === 'suspended') return;
        const style = BGM_STYLES[bgmStyle] || BGM_STYLES.ambient;
        const t = audioCtx.currentTime;
        if (style.pluck) {
            // Zen mode: 1-2 random pentatonic plucks with long decay
            const notes = Math.random() < 0.4 ? 2 : 1;
            for (let k = 0; k < notes; k++) {
                const f = style.pool[(Math.random() * style.pool.length) | 0];
                const delay = k * 0.28;
                const o = audioCtx.createOscillator(), g = audioCtx.createGain();
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(style.gain * 1.7, t + delay);
                g.gain.exponentialRampToValueAtTime(0.0005, t + delay + 1.2);
                o.connect(g); g.connect(audio.bgm);
                o.start(t + delay); o.stop(t + delay + 1.3);
            }
            return;
        }
        const chord = style.chords[audio.chordIndex % style.chords.length];
        audio.chordIndex++;
        chord.forEach((f, i) => {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = style.wave(i);
            o.frequency.value = f;
            o.detune.value = (i - 1.5) * style.detune;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(style.gain, t + style.attack);
            g.gain.setValueAtTime(style.gain, t + style.attack + style.hold);
            g.gain.linearRampToValueAtTime(0, t + style.attack + style.hold + style.release);
            o.connect(g); g.connect(audio.bgm);
            o.start(t); o.stop(t + style.attack + style.hold + style.release + 0.1);
        });
    }

    // ---- SFX style definitions ----
    const SFX_STYLES = {
        soft: {
            hover: () => playTone(1250, 0.05, 'sine'),
            click: () => playTone(620, 0.09, 'triangle')
        },
        retro: {
            hover: () => playTone(880, 0.06, 'square'),
            click: () => { playTone(990, 0.05, 'square'); setTimeout(() => playTone(1320, 0.07, 'square'), 45); }
        },
        cyber: {
            hover: () => playTone(1400, 0.06, 'sine', 2200),
            click: () => playTone(1800, 0.12, 'sawtooth', 380)
        },
        clicky: {
            hover: () => playTone(3000, 0.018, 'square'),
            click: () => playTone(1700, 0.035, 'square')
        }
    };

    let lastBlip = 0;
    function playTone(freq, dur, type, sweepTo) {
        if (sfxVol === 0) return;
        const now = performance.now();
        if (now - lastBlip < 45) return;
        lastBlip = now;
        if (!ensureAudio()) return;
        try {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, audioCtx.currentTime);
            if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, audioCtx.currentTime + dur);
            const peak = (sfxVol / 100) * 0.06;
            g.gain.setValueAtTime(peak, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            o.connect(g); g.connect(audio.master);
            o.start(); o.stop(audioCtx.currentTime + dur);
        } catch (e) { /* audio unavailable */ }
    }
    function sfx(kind) {
        const st = SFX_STYLES[sfxStyle] || SFX_STYLES.soft;
        st[kind]();
    }
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest && e.target.closest('.sidebar-nav-link, .ctx-item, a, button')) sfx('hover');
    });
    document.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('a, button')) sfx('click');
    });
    // browsers allow audio only after a gesture — first interaction wakes it
    const wake = () => { ensureAudio(); document.removeEventListener('pointerdown', wake); document.removeEventListener('keydown', wake); };
    document.addEventListener('pointerdown', wake);
    document.addEventListener('keydown', wake);

    /* ---------- 9. PANEL WIRING — Matrix mode & audio controls ---------- */
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
                sfx('click');
            });
        }
        const bgmStyleSelect = document.getElementById('bgm-style');
        if (bgmStyleSelect) {
            bgmStyleSelect.value = bgmStyle;
            bgmStyleSelect.addEventListener('change', () => {
                bgmStyle = bgmStyleSelect.value;
                localStorage.setItem('yosedie-bgm-style', bgmStyle);
                audio.chordIndex = 0;
                startBgm(); // restarts the chain with the new style
            });
        }
        const sfxStyleSelect = document.getElementById('sfx-style');
        if (sfxStyleSelect) {
            sfxStyleSelect.value = sfxStyle;
            sfxStyleSelect.addEventListener('change', () => {
                sfxStyle = sfxStyleSelect.value;
                localStorage.setItem('yosedie-sfx-style', sfxStyle);
                sfx('click'); // preview the new style
            });
        }
    }
    wirePanel();

    /* ---------- boot ---------- */
    initConstellation();
    initParallax();
    initHUD();
})();
