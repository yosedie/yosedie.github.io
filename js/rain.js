// Rain Effect with Element Interaction, Document-Relative Water, and Drip Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'rain-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    canvas.style.zIndex = '1'; // Behind page content (main is z-10) so text stays readable
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let obstacles = [];
    let isEnabled = true; // Enabled by default
    
    // Mouse State - Enhanced for better interaction
    let mouse = { 
        x: -100, 
        y: -100, 
        radius: 80,           // Larger interaction radius
        velocity: { x: 0, y: 0 },
        lastX: -100,
        lastY: -100,
        isMoving: false
    };

    // Configuration - exposed globally for UI control (LOW defaults for performance)
    const config = {
        dropCount: 50,       // Number of raindrops (min)
        dropSpeed: 5,        // Base speed (min)
        dropLength: 20,      // Length of drops
        wind: 1,             // Horizontal wind
        splashCount: 2,      // Particles per splash (reduced)
        color: 'rgba(174, 194, 224, 0.6)', // Rain color (light blue-grey)
        splashColor: 'rgba(174, 194, 224, 0.8)',
        waterColor: 'rgba(79, 70, 229, 0.2)', // Semi-transparent Indigo water
        waterRiseSpeed: 0.01,   // Pixels per frame
        // Cursor interaction settings
        cursorRepelStrength: 1,    // How strongly cursor pushes particles
        cursorInfluenceRadius: 120, // Radius of cursor influence
        elementRepelStrength: 1,    // How strongly elements push particles
        elementInfluenceRadius: 50, // Radius of element influence
    };
    
    // Expose config globally for UI controls
    window.rainConfig = config;
    window.rainEnabled = true;

    // Water State
    let absoluteWaterLevel = 0; // Water height in absolute document pixels
    let waveOffset = 0; // For animating waves

    // Resize Handler
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        updateObstacles();
        if (config.matrix) initMatrixColumns();
    }

    // Mouse Move Handler - Enhanced with velocity tracking
    let mouseTimeout;
    document.addEventListener('mousemove', (e) => {
        // Calculate velocity
        mouse.velocity.x = e.clientX - mouse.lastX;
        mouse.velocity.y = e.clientY - mouse.lastY;
        
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.isMoving = true;
        
        // Reset moving flag after mouse stops
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => {
            mouse.isMoving = false;
            mouse.velocity.x = 0;
            mouse.velocity.y = 0;
        }, 100);
    });

    // Obstacle Detection (Elements that rain hits) - Enhanced with more elements
    function updateObstacles() {
        obstacles = [];
        // Select more elements to interact with - expanded selector
        const elements = document.querySelectorAll(
            '.project-card, .certification-card, .btn, nav, .sidebar, h1, h2, h3, img, ' +
            '.feature-card, .learning-card, .skill-item, .tech-tag, .skill-tag, ' +
            '.linkedin-cta-card, .mock-browser, .glass-effect, ' +
            'a[href], button, .floating-tag, .avatar, section > div'
        );
        
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            // Only add if element is visible and in viewport
            if (rect.width > 0 && rect.height > 0 && 
                rect.bottom > 0 && rect.top < height &&
                rect.right > 0 && rect.left < width) {
                
                // Add the element with its bounds
                obstacles.push({
                    x: rect.left,
                    y: rect.top,
                    w: rect.width,
                    h: rect.height,
                    centerX: rect.left + rect.width / 2,
                    centerY: rect.top + rect.height / 2
                });
            }
        });
    }

    // Debounced resize and scroll
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 200);
    });

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                updateObstacles();
                scrollTimeout = null;
            }, 100);
        }
    });

    // Splash Particle Class - Enhanced with colors and trails
    class Splash {
        constructor(x, y, color = null, isCursorSplash = false) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * (isCursorSplash ? 8 : 4);
            this.vy = -(Math.random() * (isCursorSplash ? 5 : 3) + 1);
            this.life = 1.0;
            this.decay = isCursorSplash ? 0.03 : 0.05;
            this.color = color || config.splashColor;
            this.size = isCursorSplash ? 3 : 2;
            this.trail = [];
            this.maxTrail = isCursorSplash ? 5 : 0;
        }

        update() {
            // Store trail positions
            if (this.maxTrail > 0) {
                this.trail.push({ x: this.x, y: this.y, life: this.life });
                if (this.trail.length > this.maxTrail) {
                    this.trail.shift();
                }
            }
            
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.2; // Gravity
            this.life -= this.decay;
        }

        draw() {
            // Draw trail
            if (this.trail.length > 0) {
                for (let i = 0; i < this.trail.length; i++) {
                    const t = this.trail[i];
                    const alpha = (i / this.trail.length) * this.life * 0.5;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(t.x, t.y, this.size * 0.5, this.size * 0.5);
                }
            }
            
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.globalAlpha = 1.0;
        }
    }

    // Raindrop Class - Enhanced with cursor/element interaction
    class Drop {
        constructor() {
            this.reset();
            this.y = Math.random() * height; // Start at random height initially
            this.deflected = false;
            this.deflectAmount = { x: 0, y: 0 };
            this.glowIntensity = 0;
        }

        reset() {
            this.x = Math.random() * width;
            this.y = -Math.random() * 100; // Start above screen
            this.z = Math.random() * 0.5 + 0.5; // Depth factor (0.5 to 1)
            this.len = config.dropLength * this.z;
            this.speed = config.dropSpeed * this.z;
            this.vy = this.speed;
            this.vx = config.wind;
            this.deflected = false;
            this.deflectAmount = { x: 0, y: 0 };
            this.glowIntensity = 0;
        }

        // Apply repulsion force from a point
        applyRepulsion(targetX, targetY, strength, radius) {
            const dx = this.x - targetX;
            const dy = this.y - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < radius && dist > 0) {
                const force = (1 - dist / radius) * strength;
                const angle = Math.atan2(dy, dx);
                this.deflectAmount.x += Math.cos(angle) * force;
                this.deflectAmount.y += Math.sin(angle) * force * 0.5; // Less vertical deflection
                this.deflected = true;
                this.glowIntensity = Math.min(1, this.glowIntensity + force * 0.1);
                return true;
            }
            return false;
        }

        update(waterSurfaceY) {
            // Decay deflection and glow
            this.deflectAmount.x *= 0.95;
            this.deflectAmount.y *= 0.95;
            this.glowIntensity *= 0.98;
            
            if (Math.abs(this.deflectAmount.x) < 0.01) this.deflectAmount.x = 0;
            if (Math.abs(this.deflectAmount.y) < 0.01) this.deflectAmount.y = 0;
            
            // Apply deflection
            this.y += this.vy + this.deflectAmount.y;
            this.x += this.vx + this.deflectAmount.x;

            // Collision Detection with Obstacles
            let hit = false;
            
            // Effective bottom limit for rain (either water surface or screen bottom)
            let bottomLimit = height;
            if (waterSurfaceY < height) {
                bottomLimit = waterSurfaceY;
            }

            // Only check collision if drop is within screen and ABOVE water
            if (this.y > 0 && this.y < bottomLimit) {
                
                // 1. Mouse/Cursor Interaction - Enhanced with repulsion
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);
                
                // Apply continuous repulsion near cursor
                if (distToMouse < config.cursorInfluenceRadius) {
                    const repelled = this.applyRepulsion(
                        mouse.x, 
                        mouse.y, 
                        config.cursorRepelStrength * (mouse.isMoving ? 1.5 : 1),
                        config.cursorInfluenceRadius
                    );
                    
                    // Add mouse velocity influence for more dynamic feel
                    if (repelled && mouse.isMoving) {
                        this.deflectAmount.x += mouse.velocity.x * 0.3;
                    }
                }
                
                // Direct cursor collision (splash on impact)
                if (distToMouse < mouse.radius) {
                    // Check if hitting top half of "cursor sphere"
                    if (dy < 0) {
                        this.splash(this.y, true);
                        // Drip Logic: Teleport to bottom of cursor
                        this.y = mouse.y + mouse.radius;
                        // Slight randomization to look natural
                        this.x += (Math.random() - 0.5) * 10;
                        hit = true;
                    }
                }

                // 2. Element Collision and Interaction
                if (!hit) {
                    for (let obs of obstacles) {
                        // Check proximity for repulsion effect (around element edges)
                        const edgeInfluence = config.elementInfluenceRadius;
                        
                        // Top edge proximity
                        if (this.x >= obs.x - edgeInfluence && 
                            this.x <= obs.x + obs.w + edgeInfluence &&
                            this.y >= obs.y - edgeInfluence && 
                            this.y <= obs.y + edgeInfluence) {
                            this.applyRepulsion(this.x, obs.y, config.elementRepelStrength * 0.5, edgeInfluence);
                        }
                        
                        // Check if drop is within the obstacle's horizontal bounds
                        if (this.x >= obs.x && this.x <= obs.x + obs.w) {
                            // Check if drop has just crossed the top surface
                            if (this.y >= obs.y && (this.y - this.vy - this.deflectAmount.y) < obs.y) {
                                this.splash(obs.y);
                                
                                // Drip Logic: Teleport to bottom of element
                                // This simulates water running down the element and dripping off
                                this.y = obs.y + obs.h;
                                
                                // Ensure we don't teleport into the water
                                if (this.y > bottomLimit) {
                                    this.reset();
                                }
                                
                                hit = true;
                                break;
                            }
                        }
                        
                        // Side edge interaction - deflect particles near vertical edges
                        if (this.y >= obs.y && this.y <= obs.y + obs.h) {
                            // Left edge
                            if (this.x >= obs.x - edgeInfluence && this.x < obs.x) {
                                this.applyRepulsion(obs.x, this.y, config.elementRepelStrength, edgeInfluence);
                            }
                            // Right edge
                            if (this.x > obs.x + obs.w && this.x <= obs.x + obs.w + edgeInfluence) {
                                this.applyRepulsion(obs.x + obs.w, this.y, config.elementRepelStrength, edgeInfluence);
                            }
                        }
                    }
                }
            }

            // Water surface collision or Screen bottom collision
            if (!hit) {
                // If drop hits the rising water surface (which is visible)
                if (this.y >= bottomLimit) {
                    // Only splash if the bottom limit is actually the water (not just screen bottom)
                    if (bottomLimit === waterSurfaceY) {
                        this.splash(waterSurfaceY);
                        this.reset();
                    } else {
                        this.splash(height);
                        this.reset();
                    }
                }
            }
            
            // Wrap around if deflected off screen horizontally
            if (this.x < -20) this.x = width + 20;
            if (this.x > width + 20) this.x = -20;
        }

        draw(waterSurfaceY) {
            // Don't draw drops that are underwater
            if (this.y > waterSurfaceY) return;

            ctx.beginPath();
            
            // Apply glow effect when deflected/interacting
            if (this.glowIntensity > 0.1) {
                ctx.shadowColor = 'rgba(79, 70, 229, 0.8)';
                ctx.shadowBlur = this.glowIntensity * 15;
            } else {
                ctx.shadowBlur = 0;
            }
            
            // Color shift when deflected
            if (this.deflected && Math.abs(this.deflectAmount.x) > 0.5) {
                const intensity = Math.min(1, Math.abs(this.deflectAmount.x) / 5);
                ctx.strokeStyle = `rgba(${174 - intensity * 95}, ${194 - intensity * 124}, ${224 + intensity * 5}, ${0.6 + intensity * 0.2})`;
            } else {
                ctx.strokeStyle = config.color;
            }
            
            ctx.lineWidth = 1.5 * this.z;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.vx + this.deflectAmount.x, this.y + this.len);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }

        splash(y, isCursorSplash = false) {
            const color = isCursorSplash ? 'rgba(79, 70, 229, 0.9)' : null;
            const count = isCursorSplash ? config.splashCount + 2 : config.splashCount;
            for (let i = 0; i < count; i++) {
                splashes.push(new Splash(this.x, y, color, isCursorSplash));
            }
        }
    }

    // Water Drawing Function
    function drawWater(waterSurfaceY) {
        // If water is completely below the screen, don't draw
        if (waterSurfaceY >= height) return;

        // Start drawing water
        ctx.beginPath();
        
        // If water surface is above the screen (full immersion), start from top
        let drawStartY = Math.max(0, waterSurfaceY);
        
        ctx.moveTo(0, height); // Bottom left
        ctx.lineTo(0, drawStartY); // Top left (start of water)

        // Draw wave only if surface is visible
        if (waterSurfaceY > 0 && waterSurfaceY < height) {
             for (let x = 0; x <= width; x += 10) {
                const y = waterSurfaceY + 
                          Math.sin(x * 0.01 + waveOffset) * 5 + 
                          Math.sin(x * 0.02 + waveOffset * 1.5) * 2;
                ctx.lineTo(x, y);
            }
        } else if (waterSurfaceY <= 0) {
            // Full screen water, just draw line at top
             ctx.lineTo(width, 0);
        }

        ctx.lineTo(width, height); // Bottom right
        ctx.closePath();
        
        // Gradient fill
        const gradient = ctx.createLinearGradient(0, drawStartY, 0, height);
        gradient.addColorStop(0, config.waterColor);
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.5)'); // Darker at bottom
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Draw cursor interaction zone - visual feedback
    function drawCursorZone() {
        if (mouse.x < 0 || mouse.y < 0) return;
        
        // Outer influence ring
        const gradient = ctx.createRadialGradient(
            mouse.x, mouse.y, 0,
            mouse.x, mouse.y, config.cursorInfluenceRadius
        );
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.08)');
        gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.04)');
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, config.cursorInfluenceRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner collision zone
        if (mouse.isMoving) {
            const innerGradient = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, mouse.radius
            );
            innerGradient.addColorStop(0, 'rgba(236, 72, 153, 0.15)');
            innerGradient.addColorStop(1, 'rgba(79, 70, 229, 0.05)');
            
            ctx.fillStyle = innerGradient;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Arrays to hold entities
    const drops = [];
    let splashes = [];

    // Initialize
    resize();
    for (let i = 0; i < config.dropCount; i++) {
        drops.push(new Drop());
    }
    
    // Function to adjust drop count dynamically
    function adjustDropCount(newCount) {
        const currentCount = drops.length;
        if (newCount > currentCount) {
            for (let i = 0; i < newCount - currentCount; i++) {
                drops.push(new Drop());
            }
        } else if (newCount < currentCount) {
            drops.splice(newCount);
        }
        config.dropCount = newCount;
    }
    
    // Function to toggle rain
    function toggleRain(enabled) {
        isEnabled = enabled;
        window.rainEnabled = enabled;
        canvas.style.display = enabled ? 'block' : 'none';
    }
    
    // Function to reset water level
    function resetWater() {
        absoluteWaterLevel = 0;
    }
    
    // Expose control functions globally
    window.rainControls = {
        adjustDropCount,
        toggleRain,
        resetWater,
        getConfig: () => config,
        setMatrix: (on) => {
            config.matrix = !!on;
            if (config.matrix) initMatrixColumns();
        }
    };

    // --- Matrix Mode ---
    const MATRIX_GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';
    let matrixColumns = [];
    function initMatrixColumns() {
        matrixColumns = [];
        const colWidth = 18;
        const cols = Math.ceil(width / colWidth);
        for (let i = 0; i < cols; i++) {
            matrixColumns.push({
                x: i * colWidth + colWidth / 2,
                y: Math.random() * -height,
                speed: 2 + Math.random() * 4,
                glyphs: Array.from({ length: 14 }, () => MATRIX_GLYPHS[(Math.random() * MATRIX_GLYPHS.length) | 0])
            });
        }
    }
    function drawMatrix() {
        ctx.clearRect(0, 0, width, height);
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        matrixColumns.forEach(col => {
            for (let g = 0; g < col.glyphs.length; g++) {
                const y = col.y - g * 16;
                if (y < -16 || y > height + 16) continue;
                const alpha = g === 0 ? 0.95 : 0.55 * (1 - g / col.glyphs.length);
                ctx.fillStyle = g === 0
                    ? 'rgba(190,255,210,' + alpha.toFixed(3) + ')'
                    : 'rgba(74,222,128,' + alpha.toFixed(3) + ')';
                ctx.fillText(col.glyphs[g], col.x, y);
            }
            col.y += col.speed;
            if (Math.random() < 0.08) {
                col.glyphs[(Math.random() * col.glyphs.length) | 0] = MATRIX_GLYPHS[(Math.random() * MATRIX_GLYPHS.length) | 0];
            }
            if (col.y - col.glyphs.length * 16 > height) {
                col.y = -20 - Math.random() * 200;
                col.speed = 2 + Math.random() * 4;
            }
        });
    }

    // Animation Loop
    function animate() {
        if (!isEnabled) {
            requestAnimationFrame(animate);
            return;
        }

        // Matrix Mode — falling glyph columns replace raindrops
        if (config.matrix) {
            drawMatrix();
            requestAnimationFrame(animate);
            return;
        }

        ctx.clearRect(0, 0, width, height);

        // Calculate Document Height
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );

        // Update Absolute Water Level — capped so it never floods the page
        const maxWater = height * 0.28; // never higher than 28% of the viewport
        if (absoluteWaterLevel < maxWater) {
            absoluteWaterLevel += config.waterRiseSpeed;
        } else if (absoluteWaterLevel > maxWater) {
            absoluteWaterLevel = Math.max(maxWater, absoluteWaterLevel - 0.05); // gentle drain back to cap
        }
        waveOffset += 0.05;

        // Calculate Water Surface Y relative to Viewport
        const surfaceAbsoluteY = docHeight - absoluteWaterLevel;
        const waterSurfaceY = surfaceAbsoluteY - window.scrollY;

        // Draw cursor interaction zone (behind everything)
        drawCursorZone();

        // Draw Water
        drawWater(waterSurfaceY);

        // Update and draw drops
        drops.forEach(drop => {
            drop.update(waterSurfaceY);
            drop.draw(waterSurfaceY);
        });

        // Update and draw splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
            const s = splashes[i];
            s.update();
            s.draw();
            // Remove splash if life over OR if it's deep underwater relative to viewport
            if (s.life <= 0 || s.y > waterSurfaceY + 20) {
                splashes.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
