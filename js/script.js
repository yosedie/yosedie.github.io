document.addEventListener('DOMContentLoaded', function () {
    // --- PROTECT ALL BUTTONS - Mark these early to prevent any 3D effects ---
    const PROTECTED_SELECTORS = 'button, .btn, [role="button"]';
    document.querySelectorAll(PROTECTED_SELECTORS).forEach(btn => {
        btn.dataset.noTransform = 'true';
    });

    // MutationObserver to prevent transform changes on protected buttons
    const transformGuardian = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            const target = mutation.target;
            if (!target.dataset.noTransform) return;
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (target.style.transform) {
                    target.style.transform = '';
                }
            }
        });
    });

    // Observe all protected buttons
    document.querySelectorAll(PROTECTED_SELECTORS).forEach(btn => {
        transformGuardian.observe(btn, {
            attributes: true,
            attributeFilter: ['style']
        });
    });

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');

    overlay.className = 'fixed inset-0 bg-black/50 z-40 hidden md:hidden transition-opacity opacity-0';
    document.body.appendChild(overlay);

    function toggleMenu() {
        const isOpen = !sidebar.classList.contains('-translate-x-full');

        if (isOpen) {
            // Close
            sidebar.classList.add('-translate-x-full');
            overlay.classList.remove('opacity-100');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 300);
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            // Change icon to hamburger
            if (mobileMenuIcon) {
                mobileMenuIcon.classList.remove('ph-x');
                mobileMenuIcon.classList.add('ph-list');
            }
        } else {
            // Open
            overlay.classList.remove('hidden');
            // Force reflow
            void overlay.offsetWidth;
            overlay.classList.add('opacity-100');
            sidebar.classList.remove('-translate-x-full');
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            // Change icon to X
            if (mobileMenuIcon) {
                mobileMenuIcon.classList.remove('ph-list');
                mobileMenuIcon.classList.add('ph-x');
            }
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }

    // --- Per-menu Section Router: nav clicks swap the visible section, URL stays clean ---
    const sections = document.querySelectorAll('main > section');
    const navLinks = document.querySelectorAll('.sidebar-nav-link');

    function showSection(id) {
        const target = document.getElementById(id);
        if (!target) return;

        sections.forEach(s => s.classList.toggle('active-section', s === target));
        window.scrollTo(0, 0);

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
        });

        // Build the skills chart on first visit (a hidden canvas has no size)
        if (id === 'skills' && typeof window.initSkillsChart === 'function') {
            window.initSkillsChart();
        }
    }

    function goToSection(id) {
        // Close mobile menu if open
        if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
            toggleMenu();
        }
        showSection(id);
    }

    document.querySelectorAll('[data-section]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            goToSection(el.dataset.section);
        });
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToSection(el.dataset.section);
            }
        });
    });

    // Initial section, then strip any leftover hash so the URL stays pristine
    showSection(location.hash.slice(1) || 'hero');
    history.replaceState(null, '', location.pathname + location.search);

    // --- Dynamic Copyright Year (handled in dynamic sidebar footer) ---

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(el);
    });

    // --- Skills Chart (Chart.js) — built lazily on first Skills visit (a hidden canvas has no size) ---
    window.initSkillsChart = function () {
        if (document.body.dataset.skillsChartBuilt) return;
        document.body.dataset.skillsChartBuilt = '1';

        const ctx = document.getElementById('skillsChart');
        if (!ctx || typeof Chart === 'undefined') return;
        // Gradient for bars
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)'); // Indigo
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)'); // Pink

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Languages', 'Frameworks', 'Databases', 'Tools', 'Cloud'],
                datasets: [{
                    label: 'Proficiency Level',
                    data: [90, 85, 80, 75, 70], // Hypothetical relative proficiency or count
                    backgroundColor: gradient,
                    borderRadius: 6,
                    barThickness: 20,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 12,
                        cornerRadius: 8,
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { display: false },
                        max: 100
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 12, weight: 500 },
                            color: '#4B5563'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
    };


    // --- Dynamic Data Rendering ---
    if (typeof portfolioData !== 'undefined') {
        try {
            const p = portfolioData.profile;

            // ===== SIDEBAR HEADER =====
            const sidebarHeader = document.getElementById('sidebar-header');
            if (sidebarHeader && p) {
                sidebarHeader.innerHTML = `
                    <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 font-heading tracking-tight">
                        ${p.name}<span class="text-indigo-600">.</span>
                    </h1>
                    <p class="text-sm text-gray-500 mt-1 font-medium">${p.title}</p>
                `;
            }

            // ===== SIDEBAR FOOTER =====
            const sidebarFooter = document.getElementById('sidebar-footer');
            if (sidebarFooter && p) {
                sidebarFooter.innerHTML = `
                    <div class="flex justify-center space-x-4">
                        <a href="${p.github}" target="_blank" class="text-gray-400 hover:text-gray-900 transition-colors transform hover:scale-110">
                            <i class="ph-fill ph-github-logo text-2xl"></i>
                        </a>
                        <a href="${p.linkedin}" target="_blank" class="text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110">
                            <i class="ph-fill ph-linkedin-logo text-2xl"></i>
                        </a>
                        <a href="mailto:${p.email}" class="text-gray-400 hover:text-red-500 transition-colors transform hover:scale-110">
                            <i class="ph-fill ph-envelope text-2xl"></i>
                        </a>
                    </div>
                    <p class="text-xs text-center text-gray-400 mt-4">&copy; ${new Date().getFullYear()} ${p.name}</p>
                `;
            }

            // ===== HERO SECTION =====
            const heroContent = document.getElementById('hero-content');
            if (heroContent && p) {
                const techStackHtml = (portfolioData.heroTechStack || []).map(tech =>
                    `<i class="${tech.iconClass} text-3xl md:text-4xl hover:text-[${tech.hoverColor}] transition-colors" title="${tech.name}"></i>`
                ).join('');

                heroContent.innerHTML = `
                    <div class="inline-block p-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4 animate-float">
                        <div class="bg-white rounded-full p-2">
                            <img src="${p.avatar}" alt="${p.name}"
                                class="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl"
                                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27 viewBox=%270 0 160 160%27%3E%3Crect fill=%27%234F46E5%27 width=%27160%27 height=%27160%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2760%27 fill=%27white%27%3E${p.name.charAt(0)}%3C/text%3E%3C/svg%3E'">
                        </div>
                    </div>

                    <h2 class="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-4">
                        ${p.heroHeading}
                    </h2>

                    <p class="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        ${p.heroDescription}
                    </p>

                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a data-section="projects" role="link" tabindex="0"
                            class="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center justify-center gap-2 group">
                            View Projects
                            <i class="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </a>
                        <a data-section="contact" role="link" tabindex="0"
                            class="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 border border-gray-200 rounded-xl font-semibold shadow-sm hover:border-indigo-200 hover:bg-indigo-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            Contact Me
                            <i class="ph-bold ph-paper-plane-right"></i>
                        </a>
                    </div>

                    <div class="pt-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <p class="text-sm font-medium text-gray-400 mb-4 uppercase tracking-widest">Tech Stack</p>
                        <div class="flex flex-wrap justify-center gap-6 md:gap-10 items-center">
                            ${techStackHtml}
                        </div>
                    </div>
                `;
            }

            // ===== ABOUT SECTION =====
            const aboutContent = document.getElementById('about-content');
            if (aboutContent && portfolioData.about) {
                const a = portfolioData.about;
                const paragraphsHtml = a.paragraphs.map((para, i) =>
                    `<p class="${i === 0 ? 'text-lg text-gray-600 leading-relaxed' : 'text-gray-600'}">${para}</p>`
                ).join('');

                const highlightsHtml = a.highlights.map(h => `
                    <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <div class="p-2 ${h.iconColor} rounded-md">
                            <i class="${h.icon} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900">${h.title}</h4>
                            <p class="text-sm text-gray-500">${h.subtitle}</p>
                        </div>
                    </div>
                `).join('');

                const factsHtml = a.quickFacts.map(fact => `
                    <li class="flex items-center gap-3 text-gray-700">
                        <i class="ph-bold ph-check-circle text-green-500"></i>
                        <span>${fact}</span>
                    </li>
                `).join('');

                aboutContent.innerHTML = `
                    <div class="space-y-6 animate-on-scroll">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-2">
                            <i class="ph-fill ph-user"></i> About Me
                        </div>
                        <h2 class="text-4xl font-bold text-gray-900 leading-tight">${a.heading}</h2>
                        ${paragraphsHtml}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            ${highlightsHtml}
                        </div>
                    </div>

                    <div class="relative animate-on-scroll delay-200">
                        <div class="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-2xl opacity-20 blur-lg transform rotate-2"></div>
                        <div class="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                                <i class="ph-fill ph-sparkle text-yellow-400"></i> Quick Facts
                            </h3>
                            <ul class="space-y-3">${factsHtml}</ul>
                            <div class="mt-8 pt-6 border-t border-gray-100 text-center">
                                <p class="text-sm text-gray-500 italic">${p.quote}</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ===== GITHUB STATS =====
            const githubContainer = document.getElementById('github-stats-container');
            if (githubContainer && p && p.githubUsername) {
                const u = p.githubUsername;
                const fallbackBg = 'bg-gradient-to-br from-indigo-50 to-pink-50';
                githubContainer.innerHTML = `
                    <div class="bg-white p-4 rounded-xl shadow-lg border border-gray-100 overflow-hidden flex justify-center min-h-[180px] ${fallbackBg}">
                        <img src="https://github-readme-stats-sigma-five.vercel.app/api?username=${u}&show_icons=true&theme=transparent&title_color=4F46E5&text_color=4B5563&icon_color=EC4899&hide_border=true"
                            alt="GitHub Stats" class="max-w-full"
                            onerror="this.parentElement.innerHTML='<div class=\'flex items-center justify-center h-full text-gray-400\'><i class=\'ph ph-github-logo text-4xl\'></i><span class=\'ml-2\'>Stats loading...</span></div>'">
                    </div>
                    <div class="bg-white p-4 rounded-xl shadow-lg border border-gray-100 overflow-hidden flex justify-center min-h-[180px] ${fallbackBg}">
                        <img src="https://github-readme-stats-sigma-five.vercel.app/api/top-langs/?username=${u}&layout=compact&theme=transparent&title_color=4F46E5&text_color=4B5563&hide_border=true"
                            alt="Top Languages" class="max-w-full"
                            onerror="this.parentElement.innerHTML='<div class=\'flex items-center justify-center h-full text-gray-400\'><i class=\'ph ph-code text-4xl\'></i><span class=\'ml-2\'>Languages loading...</span></div>'">
                    </div>
                    <div class="md:col-span-2 bg-white p-4 rounded-xl shadow-lg border border-gray-100 overflow-hidden flex justify-center min-h-[180px] ${fallbackBg}">
                        <img src="https://streak-stats.demolab.com/?user=${u}&theme=transparent&fire=EC4899&ring=4F46E5&currStreakLabel=4F46E5&hide_border=true"
                            alt="GitHub Streak" class="max-w-full"
                            onerror="this.parentElement.innerHTML='<div class=\'flex items-center justify-center h-full text-gray-400\'><i class=\'ph ph-fire text-4xl\'></i><span class=\'ml-2\'>Streak loading...</span></div>'">
                    </div>
                `;
            }

            // ===== LEARNING SECTION =====
            const learningContainer = document.getElementById('learning-container');
            if (learningContainer && portfolioData.learning) {
                learningContainer.innerHTML = '';
                portfolioData.learning.forEach(item => {
                    const div = document.createElement('div');
                    div.className = `bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-l-4 hover:border-l-${item.accentColor}-500 transition-all`;
                    div.innerHTML = `
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${item.title}</h3>
                        <p class="text-gray-600 text-sm">${item.description}</p>
                    `;
                    learningContainer.appendChild(div);
                });
            }

            // ===== CONTACT SECTION =====
            const contactContent = document.getElementById('contact-content');
            if (contactContent && p) {
                contactContent.innerHTML = `
                    <div class="inline-block p-4 rounded-full bg-indigo-50 text-indigo-600 mb-6">
                        <i class="ph-duotone ph-paper-plane-tilt text-4xl"></i>
                    </div>
                    <h2 class="text-4xl md:text-5xl font-bold mb-6">Let's <span class="text-gradient">Collaborate</span></h2>
                    <p class="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Have a project in mind or just want to chat about tech? I'm always open to new connections and opportunities.
                    </p>
                    <div class="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="mailto:${p.email}"
                            class="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:bg-gray-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            <i class="ph-bold ph-envelope-simple"></i>
                            ${p.email}
                        </a>
                        <a href="${p.linkedin}" target="_blank"
                            class="px-8 py-4 bg-[#0077b5] text-white rounded-xl font-semibold shadow-lg hover:bg-[#006097] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                            <i class="ph-bold ph-linkedin-logo"></i>
                            Connect on LinkedIn
                        </a>
                    </div>
                `;
            }

            // ===== LINKEDIN CTA =====
            const linkedinCta = document.getElementById('linkedin-cta');
            if (linkedinCta && p) {
                linkedinCta.innerHTML = `
                    <i class="ph-fill ph-linkedin-logo text-6xl text-white/90"></i>
                    <div>
                        <h3 class="text-2xl md:text-3xl font-bold text-white mb-2">Connect on LinkedIn</h3>
                        <p class="text-blue-100 max-w-lg mx-auto">
                            View my full work history, endorsements, and professional network.
                        </p>
                    </div>
                    <a href="${p.linkedin}" target="_blank"
                        class="linkedin-cta-btn flex items-center gap-2 mt-4">
                        View Full Profile <i class="ph-bold ph-arrow-right"></i>
                    </a>
                `;
            }

            const skillsContainer = document.getElementById('skills-container');
            const certsContainer = document.getElementById('certifications-container');

            // Set Projects GitHub link
            const projectsGithubLink = document.getElementById('projects-github-link');
            if (projectsGithubLink && p) {
                projectsGithubLink.href = p.github + '?tab=repositories';
            }

            // Render Skills
            if (skillsContainer && portfolioData.skills) {
                skillsContainer.innerHTML = ''; // Clear fallback
                Object.entries(portfolioData.skills).forEach(([category, skills]) => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow';

                    const title = document.createElement('h3');
                    title.className = 'font-bold text-gray-800 mb-4 flex items-center gap-2';
                    // Simple icon mapping based on category name
                    let iconClass = 'ph-star';
                    let iconColor = 'text-indigo-500';
                    if (category.includes('Languages')) { iconClass = 'ph-code-block'; iconColor = 'text-indigo-500'; }
                    else if (category.includes('Frameworks')) { iconClass = 'ph-stack'; iconColor = 'text-pink-500'; }
                    else if (category.includes('Cloud') || category.includes('DevOps')) { iconClass = 'ph-cloud'; iconColor = 'text-blue-500'; }
                    else if (category.includes('Databases')) { iconClass = 'ph-database'; iconColor = 'text-amber-500'; }

                    title.innerHTML = `<i class="ph-fill ${iconClass} ${iconColor}"></i> ${category}`;

                    const skillList = document.createElement('div');
                    skillList.className = 'flex flex-wrap gap-4';

                    skills.forEach(skill => {
                        const img = document.createElement('img');
                        img.src = skill.icon;
                        img.alt = skill.name;
                        img.className = 'w-10 h-10 hover:scale-110 transition-transform';
                        img.title = skill.name;
                        // Add error handling for missing icons
                        img.onerror = function () {
                            this.style.display = 'none';
                            const span = document.createElement('span');
                            span.textContent = skill.name;
                            span.className = 'px-3 py-1 bg-gray-100 rounded text-sm font-medium';
                            skillList.insertBefore(span, this);
                        };
                        skillList.appendChild(img);
                    });

                    categoryDiv.appendChild(title);
                    categoryDiv.appendChild(skillList);
                    skillsContainer.appendChild(categoryDiv);
                });
            }

            // Render Certifications
            if (certsContainer && portfolioData.certifications) {
                certsContainer.innerHTML = '';
                const initialShowCount = 6;
                let showingAll = false;

                // Auto-categorize certificate based on name and issuer
                function getCertCategory(cert) {
                    if (cert.category) return cert.category;
                    
                    const name = (cert.name || '').toLowerCase();
                    const issuer = (cert.issuer || '').toLowerCase();
                    const combined = name + ' ' + issuer;
                    
                    // AI/ML keywords
                    if (combined.match(/\b(ai|artificial intelligence|machine learning|ml|deep learning|neural|nlp|generative|gemini|llm|transformer|data science|tensorflow|pytorch)\b/)) {
                        return 'ai-ml';
                    }
                    // Security keywords
                    if (combined.match(/\b(security|cybersecurity|cyber|threat|hacker|ethical hack|defense|endpoint|vulnerability|penetration|firewall)\b/)) {
                        return 'security';
                    }
                    // Programming keywords
                    if (combined.match(/\b(python|javascript|java|c\+\+|programming|developer|coding|code|essentials|react|node|typescript)\b/)) {
                        return 'programming';
                    }
                    // Cloud keywords
                    if (combined.match(/\b(cloud|gcp|aws|azure|google cloud|kubernetes|docker|devops|infrastructure)\b/)) {
                        return 'cloud';
                    }
                    
                    return 'cloud'; // Default fallback
                }

                // Function to render certifications
                function renderCertifications(showAll = false) {
                    certsContainer.innerHTML = '';
                    const certificationsToShow = showAll
                        ? portfolioData.certifications
                        : portfolioData.certifications.slice(0, initialShowCount);

                    // Toggle horizontal layout for "show all"
                    if (showAll) {
                        certsContainer.classList.add('horizontal');
                    } else {
                        certsContainer.classList.remove('horizontal');
                    }

                    certificationsToShow.forEach((cert, index) => {
                        const card = document.createElement('div');
                        card.className = 'certification-card cert-card group';
                        card.dataset.category = getCertCategory(cert);

                        // Stagger animation for entrance
                        card.style.animation = `flipIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
                        card.style.animationDelay = `${index * 0.05}s`;

                        card.innerHTML = `
                            <div>
                                <div class="cert-issuer">
                                    <i class="ph-fill ph-certificate text-indigo-500"></i>
                                    ${cert.issuer}
                                </div>
                                <h4 class="cert-name">${cert.name}</h4>
                            </div>
                            <div class="cert-meta">
                                <span>${cert.date}</span>
                                ${cert.link && cert.link !== '#' ? `<a href="${cert.link}" target="_blank" class="cert-link">Verify <i class="ph-bold ph-arrow-up-right"></i></a>` : ''}
                            </div>
                        `;
                        certsContainer.appendChild(card);
                    });

                    // Update or add the show more/less button
                    let showMoreBtn = document.getElementById('show-more-certifications');
                    if (!showMoreBtn) {
                        showMoreBtn = document.createElement('button');
                        showMoreBtn.id = 'show-more-certifications';
                        showMoreBtn.className = 'show-more-btn mx-auto mt-8 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2';
                        // CRITICAL: Mark as protected immediately to prevent transform issues
                        showMoreBtn.dataset.noTransform = 'true';
                        certsContainer.parentNode.insertBefore(showMoreBtn, certsContainer.nextSibling);

                        // Also attach the MutationObserver to this new button
                        transformGuardian.observe(showMoreBtn, {
                            attributes: true,
                            attributeFilter: ['style', 'class'],
                            attributeOldValue: true
                        });
                    }

                    const remainingCount = portfolioData.certifications.length - initialShowCount;

                    if (portfolioData.certifications.length > initialShowCount) {
                        showMoreBtn.style.display = 'flex';
                        if (showAll) {
                            showMoreBtn.innerHTML = `<i class="ph-bold ph-caret-up"></i> Show Less (scroll horizontally)`;
                        } else {
                            showMoreBtn.innerHTML = `<i class="ph-bold ph-caret-down"></i> Show All (${remainingCount} more)`;
                        }

                        showMoreBtn.onclick = () => {
                            showingAll = !showingAll;
                            renderCertifications(showingAll);
                            // Scroll to button position smoothly
                            showMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        };
                    } else {
                        showMoreBtn.style.display = 'none';
                    }
                }

                // Initial render
                renderCertifications(false);
            }

            // Render Experience
            const expContainer = document.getElementById('experience-container');
            if (expContainer && portfolioData.experience) {
                expContainer.innerHTML = '';
                portfolioData.experience.forEach(exp => {
                    const item = document.createElement('div');
                    item.className = 'relative pl-8 pb-8 border-l border-gray-200 last:pb-0 last:border-l-0';

                    item.innerHTML = `
                <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50"></div>
                <div class="mb-1 text-sm text-indigo-600 font-semibold">${exp.period}</div>
                <h3 class="text-xl font-bold text-gray-900">${exp.role}</h3>
                <div class="text-gray-600 font-medium mb-2">${exp.company} · ${exp.location}</div>
                <p class="text-gray-600 text-sm leading-relaxed">${exp.description}</p>
            `;
                    expContainer.appendChild(item);
                });
            }

            // Render Education
            const eduContainer = document.getElementById('education-container');
            if (eduContainer && portfolioData.education) {
                eduContainer.innerHTML = '';
                portfolioData.education.forEach(edu => {
                    const item = document.createElement('div');
                    item.className = 'bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:border-l-4 hover:border-l-indigo-500 transition-all mb-4';

                    item.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                         <h3 class="text-xl font-bold text-gray-800">${edu.school}</h3>
                         <h4 class="text-lg font-semibold text-gray-700">${edu.degree}</h4>
                    </div>
                    <span class="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">${edu.period}</span>
                </div>
                <p class="text-gray-600 text-sm">${edu.description}</p>
            `;
                    eduContainer.appendChild(item);
                });
            }

            // Render Projects
            const projectsContainer = document.getElementById('projects-container');
            if (projectsContainer && portfolioData.projects) {
                projectsContainer.innerHTML = '';
                portfolioData.projects.forEach(project => {
                    const card = document.createElement('div');
                    card.className = 'project-card group animate-on-scroll';

                    // Tech Stack Tags
                    const techStackHtml = project.techStack.map(tech =>
                        `<span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">${tech}</span>`
                    ).join('');

                    // Links
                    let linkHtml = '';
                    if (project.liveLink && project.liveLink !== '#') {
                        linkHtml += `<a href="${project.liveLink}" target="_blank" class="btn btn-outline text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50 mr-2">
                                     <i class="ph-bold ph-eye mr-2"></i> ${project.liveLinkText || 'Live Demo'}
                                  </a>`;
                    } else if (project.liveLinkText) {
                        linkHtml += `<span class="text-xs text-gray-400 italic mr-2">${project.liveLinkText}</span>`;
                    }

                    if (project.repoLink && project.repoLink !== '#') {
                        linkHtml += `<a href="${project.repoLink}" target="_blank" class="btn btn-primary text-sm">
                                    <i class="ph-bold ph-github-logo mr-2"></i> Code
                                 </a>`;
                    }

                    // Image placeholder logic (or use generated image if available)
                    // Using a generic gradient or the abstract UI if no image provided
                    // For 'NewNational', we want to show it's special.

                    let imageHtml = '';
                    if (project.image) {
                        imageHtml = `<img src="${project.image}" alt="${project.title}" class="w-full h-64 object-cover object-top hover:scale-105 transition-transform duration-500">`;
                    } else if (project.isNew) {
                        // Specific abstract UI for the 'New' one if generic
                        imageHtml = `
                    <div class="mock-browser transform group-hover:scale-105 transition-transform duration-500">
                        <div class="mock-browser-header">
                            <div class="mock-browser-dot red"></div>
                            <div class="mock-browser-dot yellow"></div>
                            <div class="mock-browser-dot green"></div>
                        </div>
                        <div class="mock-browser-content h-64 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                             <div class="text-center">
                                <div class="w-16 h-16 bg-white rounded-xl shadow-md mx-auto flex items-center justify-center mb-2">
                                    <i class="ph-duotone ph-shopping-cart text-3xl text-indigo-600"></i>
                                </div>
                                <h4 class="font-bold text-gray-400"> </h4>
                             </div>
                             <!-- Decorative blobs -->
                             <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                             <div class="absolute -top-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                        </div>
                    </div>`;
                    } else if (project.title.includes('Exam Inventory')) {
                        // Dashboard UI for Exam Inventory
                        imageHtml = `
                    <div class="mock-browser transform group-hover:scale-105 transition-transform duration-500">
                        <div class="mock-browser-header">
                            <div class="mock-browser-dot red"></div>
                            <div class="mock-browser-dot yellow"></div>
                            <div class="mock-browser-dot green"></div>
                        </div>
                        <div class="mock-browser-content h-64 bg-slate-50 relative overflow-hidden flex">
                             <!-- Sidebar -->
                             <div class="w-1/4 h-full bg-white border-r border-gray-200 flex flex-col p-3 gap-3 z-10">
                                 <div class="flex items-center gap-2 mb-2">
                                     <div class="h-6 w-6 bg-pink-600 rounded flex items-center justify-center text-white text-[10px] font-bold">A</div>
                                     <div class="h-2 w-12 bg-gray-200 rounded"></div>
                                 </div>
                                 <div class="h-2 w-16 bg-pink-100 rounded"></div>
                                 <div class="h-2 w-14 bg-gray-100 rounded"></div>
                                 <div class="h-2 w-14 bg-gray-100 rounded"></div>
                                 <div class="h-2 w-12 bg-gray-100 rounded"></div>
                             </div>
                             <!-- Main Content -->
                             <div class="flex-1 p-4 space-y-3 z-10">
                                 <div class="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
                                 <div class="grid grid-cols-3 gap-2">
                                      <div class="h-16 bg-white border border-gray-100 rounded p-2 flex flex-col justify-between">
                                          <div class="h-6 w-6 bg-blue-50 rounded-full text-blue-500 flex items-center justify-center"><i class="ph-bold ph-files"></i></div>
                                          <div class="h-2 w-8 bg-gray-100 rounded"></div>
                                      </div>
                                      <div class="h-16 bg-white border border-gray-100 rounded p-2 flex flex-col justify-between">
                                          <div class="h-6 w-6 bg-yellow-50 rounded-full text-yellow-500 flex items-center justify-center"><i class="ph-bold ph-download"></i></div>
                                          <div class="h-2 w-8 bg-gray-100 rounded"></div>
                                      </div>
                                      <div class="h-16 bg-white border border-gray-100 rounded p-2 flex flex-col justify-between">
                                           <div class="h-6 w-6 bg-red-50 rounded-full text-red-500 flex items-center justify-center"><i class="ph-bold ph-warning"></i></div>
                                          <div class="h-2 w-8 bg-gray-100 rounded"></div>
                                      </div>
                                 </div>
                                 <div class="h-24 bg-white border border-gray-100 rounded mt-2 p-2">
                                     <div class="flex gap-2 mb-2">
                                         <div class="h-8 w-8 bg-gray-50 rounded-full"></div>
                                         <div class="flex-1 space-y-1">
                                             <div class="h-2 w-full bg-gray-100 rounded"></div>
                                             <div class="h-2 w-2/3 bg-gray-100 rounded"></div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>`;
                    } else if (project.title.includes('Integrated Inventory')) {
                        // Dashboard UI for Integrated Inventory (Blue Theme)
                        imageHtml = `
                    <div class="mock-browser transform group-hover:scale-105 transition-transform duration-500">
                        <div class="mock-browser-header">
                            <div class="mock-browser-dot red"></div>
                            <div class="mock-browser-dot yellow"></div>
                            <div class="mock-browser-dot green"></div>
                        </div>
                        <div class="mock-browser-content h-64 bg-slate-50 relative overflow-hidden flex flex-col p-4">
                             <!-- Top Stats Row -->
                             <div class="flex gap-2 mb-4">
                                 <div class="flex-1 h-12 bg-blue-400 rounded-lg shadow-sm flex flex-col justify-center px-2">
                                     <div class="h-1 w-12 bg-blue-300 rounded mb-1"></div>
                                     <div class="h-3 w-8 bg-white rounded"></div>
                                 </div>
                                 <div class="flex-1 h-12 bg-blue-400 rounded-lg shadow-sm flex flex-col justify-center px-2">
                                     <div class="h-1 w-12 bg-blue-300 rounded mb-1"></div>
                                     <div class="h-3 w-8 bg-white rounded"></div>
                                 </div>
                                 <div class="flex-1 h-12 bg-blue-400 rounded-lg shadow-sm flex flex-col justify-center px-2">
                                     <div class="h-1 w-12 bg-blue-300 rounded mb-1"></div>
                                     <div class="h-3 w-8 bg-white rounded"></div>
                                 </div>
                             </div>

                             <!-- Main Content Area with Charts -->
                             <div class="flex gap-4 flex-1">
                                 <!-- Bar Chart Area -->
                                 <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-2 relative">
                                     <div class="h-2 w-20 bg-gray-100 rounded mb-4"></div>
                                     <div class="flex items-end gap-1 h-20 justify-around px-2">
                                         <div class="w-2 bg-green-500 rounded-t" style="height: 30%"></div>
                                         <div class="w-2 bg-green-500 rounded-t" style="height: 80%"></div>
                                         <div class="w-2 bg-green-500 rounded-t" style="height: 40%"></div>
                                         <div class="w-2 bg-green-500 rounded-t" style="height: 60%"></div>
                                         <div class="w-2 bg-green-500 rounded-t" style="height: 20%"></div>
                                     </div>
                                 </div>

                                 <!-- Pie Chart Area -->
                                 <div class="w-1/3 bg-white rounded-lg shadow-sm border border-gray-100 p-2 flex flex-col items-center">
                                      <div class="h-2 w-16 bg-gray-100 rounded mb-2"></div>
                                      <div class="h-16 w-16 rounded-full border-4 border-blue-400 border-r-yellow-400 border-b-pink-400"></div>
                                 </div>
                             </div>
                        </div>
                    </div>`;
                    } else if (project.title.includes('GiziSehat')) {
                        // Mobile App UI for GiziSehat (Teal/Green Gradient)
                        imageHtml = `
                    <div class="bg-gradient-to-br from-teal-400 to-emerald-500 h-64 relative overflow-hidden group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                        <!-- Abstract Phone Frame -->
                        <div class="w-32 h-56 bg-white rounded-[2rem] border-4 border-white shadow-xl transform rotate-[-5deg] translate-y-4 overflow-hidden flex flex-col relative">
                            <!-- Notch -->
                            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-white rounded-b-xl z-20"></div>

                            <!-- App Header -->
                            <div class="bg-teal-50 p-3 pt-6 flex items-center gap-2">
                                <div class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-xs"><i class="ph-bold ph-user"></i></div>
                                <div class="flex-1">
                                    <div class="h-2 w-12 bg-gray-200 rounded mb-1"></div>
                                    <div class="h-1.5 w-8 bg-gray-100 rounded"></div>
                                </div>
                            </div>

                            <!-- App Content -->
                            <div class="p-3 space-y-2 bg-white flex-1">
                                <div class="h-16 bg-teal-50 rounded-xl p-2 flex items-center gap-2">
                                     <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-400"><i class="ph-fill ph-carrot"></i></div>
                                     <div class="flex-1 space-y-1">
                                         <div class="h-2 w-10 bg-gray-200 rounded"></div>
                                         <div class="h-1.5 w-16 bg-gray-100 rounded"></div>
                                     </div>
                                </div>
                                <div class="h-16 bg-blue-50 rounded-xl p-2 flex items-center gap-2">
                                     <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-400"><i class="ph-fill ph-drop"></i></div>
                                     <div class="flex-1 space-y-1">
                                         <div class="h-2 w-10 bg-gray-200 rounded"></div>
                                         <div class="h-1.5 w-12 bg-gray-100 rounded"></div>
                                     </div>
                                </div>
                                <div class="h-20 bg-gray-50 rounded-xl mt-2 p-2 relative overflow-hidden">
                                     <div class="absolute bottom-0 left-0 right-0 h-8 bg-emerald-100/50"></div>
                                     <div class="flex items-end justify-between h-full px-1 pb-1 gap-1">
                                         <div class="w-1 bg-emerald-300 h-4 rounded-t"></div>
                                         <div class="w-1 bg-emerald-300 h-6 rounded-t"></div>
                                         <div class="w-1 bg-emerald-300 h-3 rounded-t"></div>
                                         <div class="w-1 bg-emerald-500 h-8 rounded-t"></div>
                                         <div class="w-1 bg-emerald-300 h-5 rounded-t"></div>
                                     </div>
                                </div>
                            </div>
                        </div>

                        <!-- Secondary Element (Floating Chat Bubble) -->
                        <div class="absolute top-10 right-8 bg-white/90 backdrop-blur-md p-2 rounded-lg rounded-bl-none shadow-lg transform rotate-[5deg] animate-bounce-slow">
                            <div class="flex items-center gap-1.5 text-xs font-bold text-teal-600">
                                <i class="ph-fill ph-sparkle"></i> AI Analysis
                            </div>
                        </div>
                    </div>`;
                    } else if (project.title.includes('Arknights') || project.title.includes('SNA')) {
                        // Network Graph UI for SNA Project
                        imageHtml = `
                    <div class="bg-slate-900 h-64 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <!-- Network Background -->
                        <div class="absolute inset-0 opacity-20">
                            <!-- Simulated Edges using SVG -->
                            <svg width="100%" height="100%">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />

                                <!-- Connection Lines -->
                                <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="#60a5fa" stroke-width="1" />
                                <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#60a5fa" stroke-width="1" />
                                <line x1="50%" y1="50%" x2="30%" y2="70%" stroke="#60a5fa" stroke-width="1" />
                                <line x1="50%" y1="50%" x2="70%" y2="80%" stroke="#60a5fa" stroke-width="1" />
                                <line x1="20%" y1="30%" x2="30%" y2="10%" stroke="#60a5fa" stroke-width="0.5" />
                                <line x1="80%" y1="20%" x2="90%" y2="40%" stroke="#60a5fa" stroke-width="0.5" />
                            </svg>
                        </div>

                        <!-- Central Hub -->
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-600/20 rounded-full blur-xl animate-pulse"></div>
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full ring-4 ring-blue-500/30 z-10 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>

                        <!-- Satellite Nodes -->
                        <div class="absolute top-[30%] left-[20%] w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50 z-10 animate-float"></div>
                        <div class="absolute top-[20%] left-[80%] w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50 z-10 animate-float animation-delay-1000"></div>
                        <div class="absolute top-[70%] left-[30%] w-5 h-5 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50 z-10 animate-float animation-delay-2000"></div>
                        <div class="absolute top-[80%] left-[70%] w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50 z-10 animate-float animation-delay-1500"></div>

                        <!-- Floating Data Labels -->
                        <div class="absolute top-[25%] left-[25%] text-[10px] text-red-300 font-mono opacity-80 backdrop-blur-sm bg-black/30 px-1 rounded border border-red-500/30">High Betweenness</div>
                        <div class="absolute bottom-[25%] right-[25%] text-[10px] text-purple-300 font-mono opacity-80 backdrop-blur-sm bg-black/30 px-1 rounded border border-purple-500/30">Community A</div>

                        <!-- Overlay overlay -->
                             <i class="ph-bold ph-graph"></i> Metrics: Centrality, Modularity
                        </div>
                    </div>`;
                    } else if (project.title.includes('Carpet Analysis')) {
                        // Computer Vision / Scanner UI
                        imageHtml = `
                    <div class="bg-indigo-900 h-64 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <!-- Background Texture -->
                        <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/fabric-of-squares.png')]"></div>

                        <!-- Image/Data Placeholder -->
                        <div class="absolute inset-4 border-2 border-indigo-500/30 rounded-lg flex items-center justify-center overflow-hidden">
                            <div class="w-full h-full bg-gradient-to-br from-indigo-800 to-purple-900 opacity-50"></div>
                            <div class="absolute text-indigo-300/20 text-9xl font-bold">DATA</div>
                        </div>

                        <!-- Scanning Beam -->
                        <div class="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] z-10 animate-scan"></div>

                        <!-- Detection Boxes -->
                        <div class="absolute top-[30%] left-[20%] w-16 h-12 border-2 border-green-400 rounded bg-green-400/10 z-10 flex items-start justify-end p-1">
                            <span class="bg-green-500 text-black text-[8px] font-bold px-1 rounded">PASS</span>
                        </div>
                        <div class="absolute bottom-[30%] right-[25%] w-20 h-16 border-2 border-red-500 rounded bg-red-500/10 z-10 flex items-start justify-start p-1">
                             <span class="bg-red-500 text-white text-[8px] font-bold px-1 rounded">DEFECT: 98%</span>
                        </div>

                        <!-- Stats Overlay -->
                        <div class="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-mono text-cyan-300">
                             <div>PROCESSING_IMG_0492.JPG</div>
                             <div>CONFIDENCE: 0.98</div>
                        </div>
                    </div>`;
                    } else {
                        // Default abstract UI
                        imageHtml = `
                    <div class="mock-browser transform group-hover:scale-105 transition-transform duration-500">
                        <div class="mock-browser-header">
                            <div class="mock-browser-dot red"></div>
                            <div class="mock-browser-dot yellow"></div>
                            <div class="mock-browser-dot green"></div>
                        </div>
                        <div class="mock-browser-content h-64 bg-slate-50 relative overflow-hidden">
                             <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        </div>
                    </div>`;
                    }


                    // Metrics display
                    const metricsHtml = project.metrics ? `
                        <div class="flex flex-wrap gap-3 mb-4">
                            ${project.metrics.map(metric => `
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                    <i class="ph-fill ph-trend-up mr-1.5"></i>${metric}
                                </span>
                            `).join('')}
                        </div>
                    ` : '';

                    card.innerHTML = `
                    <div class="project-image-wrapper relative overflow-hidden rounded-t-xl bg-gray-50 border-b border-gray-100">
                        ${imageHtml}
                        ${project.title.includes('Diamond') ? '<div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm z-20">Enterprise</div>' : ''}
                    </div>

                    <div class="p-8">
                        <h3 class="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">${project.title}</h3>
                        <p class="text-gray-600 mb-4 line-clamp-3">${project.description}</p>
                        
                        ${metricsHtml}

                        <div class="flex flex-wrap gap-2 mb-6">
                            ${techStackHtml}
                        </div>

                        <div class="flex items-center gap-4">
                            ${linkHtml}
                        </div>
                    </div>
                `;
                    projectsContainer.appendChild(card);
                });
            }

        } catch (e) {
            // Silent error handling in production
        }
    }

    // ==========================================
    //  LIGHTWEIGHT 3D EFFECTS ENGINE
    // ==========================================

    // --- 1. LIGHTWEIGHT CARD TILT (Applied to ALL cards EXCEPT protected) ---
    (function initCardTilt() {
        function applyTiltToCard(card) {
            // Skip if already initialized or protected
            if (card.dataset.tiltInit || card.closest('[data-no-transform]') || card.dataset.noTransform) return;
            card.dataset.tiltInit = 'true';
            card.style.transformStyle = 'preserve-3d';

            card.addEventListener('mousemove', (e) => {
                // Check if tilt is disabled
                if (document.body.classList.contains('disable-tilt')) return;
                if (card.closest('[data-no-transform]') || card.dataset.noTransform) return;
                
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            card.addEventListener('mouseenter', () => {
                if (!document.body.classList.contains('disable-tilt')) {
                    card.style.transition = 'transform 0.1s ease-out';
                }
            });
        }

        // Apply to existing cards
        function initAllCards() {
            const cards = document.querySelectorAll('.project-card, .certification-card, .feature-card, .skill-item, .learning-card');
            cards.forEach(applyTiltToCard);
        }

        // Initial run after a delay to let dynamic content load
        setTimeout(initAllCards, 800);

        // Watch for new cards being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.matches && node.matches('.project-card, .certification-card, .feature-card, .skill-item, .learning-card')) {
                            applyTiltToCard(node);
                        }
                        // Also check children
                        const childCards = node.querySelectorAll && node.querySelectorAll('.project-card, .certification-card, .feature-card, .skill-item, .learning-card');
                        if (childCards) childCards.forEach(applyTiltToCard);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Apply 3D to skill tags too
        const skillTags = document.querySelectorAll('.skill-tag, .tech-tag');
        skillTags.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                tag.style.transform = 'translateY(-3px) translateZ(15px) scale(1.05)';
                tag.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.25)';
            });
            tag.addEventListener('mouseleave', () => {
                tag.style.transform = 'translateY(0) translateZ(0) scale(1)';
                tag.style.boxShadow = 'none';
            });
        });
    })();

    // --- 2. CURSOR GLOW FOLLOWER ---
    (function initCursorGlow() {
        const glow = document.getElementById('cursor-glow');
        if (!glow || window.innerWidth < 768) return;

        let curX = 0, curY = 0;
        let tgtX = 0, tgtY = 0;

        document.addEventListener('mousemove', (e) => {
            tgtX = e.clientX;
            tgtY = e.clientY;
        });

        function smoothFollow() {
            curX += (tgtX - curX) * 0.08;
            curY += (tgtY - curY) * 0.08;
            glow.style.left = curX + 'px';
            glow.style.top = curY + 'px';
            requestAnimationFrame(smoothFollow);
        }
        smoothFollow();
    })();

    // --- 3. TYPING ANIMATION ON HERO ---
    (function initTypingAnimation() {
        // Wait for hero content to render
        setTimeout(() => {
            const heroHeading = document.querySelector('#hero-content h2');
            if (!heroHeading) return;

            const fullText = heroHeading.innerHTML;
            heroHeading.innerHTML = '';
            heroHeading.style.visibility = 'visible';

            let i = 0;
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            heroHeading.appendChild(cursor);

            function type() {
                if (i < fullText.length) {
                    // Handle HTML tags
                    if (fullText[i] === '<') {
                        let tag = '';
                        while (fullText[i] !== '>' && i < fullText.length) {
                            tag += fullText[i];
                            i++;
                        }
                        tag += '>';
                        i++;
                        heroHeading.insertBefore(
                            document.createRange().createContextualFragment(tag),
                            cursor
                        );
                    } else {
                        const textNode = document.createTextNode(fullText[i]);
                        heroHeading.insertBefore(textNode, cursor);
                        i++;
                    }
                    setTimeout(type, 30 + Math.random() * 40);
                } else {
                    // Remove cursor after typing
                    setTimeout(() => {
                        cursor.style.animation = 'none';
                        cursor.style.opacity = '0';
                        cursor.style.transition = 'opacity 0.5s ease';
                    }, 2000);
                }
            }
            type();
        }, 300);
    })();

    // --- 5. SCROLL-TRIGGERED REVEAL ANIMATIONS ---
    (function initScrollReveal() {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Stagger children
                    const children = entry.target.querySelectorAll('.reveal-child');
                    children.forEach((child, i) => {
                        child.style.transitionDelay = `${i * 0.1}s`;
                        child.classList.add('revealed');
                    });
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        // Apply reveal classes to sections
        setTimeout(() => {
            document.querySelectorAll('section .container, section > div').forEach((el, i) => {
                if (!el.classList.contains('reveal-up')) {
                    el.classList.add('reveal-up');
                    revealObserver.observe(el);
                }
            });

            document.querySelectorAll('.project-card, .feature-card, .certification-card').forEach((el, i) => {
                el.classList.add('reveal-scale');
                el.style.transitionDelay = `${(i % 4) * 0.12}s`;
                revealObserver.observe(el);
            });
        }, 500);

        // Re-observe when new cards are added
        const cardObserver = new MutationObserver(() => {
            document.querySelectorAll('.project-card:not(.reveal-scale), .certification-card:not(.reveal-scale)').forEach((el, i) => {
                el.classList.add('reveal-scale');
                el.style.transitionDelay = `${(i % 4) * 0.12}s`;
                revealObserver.observe(el);
            });
        });
        cardObserver.observe(document.body, { childList: true, subtree: true });
    })();

    // --- 6. PARALLAX BLOBS ON SCROLL ---
    (function initParallaxBlobs() {
        const blobs = document.querySelectorAll('.animate-blob');
        if (!blobs.length) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    blobs.forEach((blob, i) => {
                        const speed = 0.05 + (i * 0.02);
                        blob.style.transform = `translateY(${scrollY * speed}px)`;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    })();

    // --- 7. MAGNETIC BUTTON HOVER ---
    (function initMagneticButtons() {
        // Exclude problematic buttons from magnetic effect
        const magneticBtns = document.querySelectorAll(
            'a[data-section]:not(.sidebar-nav-link), \
             .linkedin-cta-btn:not(#mobile-menu-btn):not(#show-more-certifications)'
        );

        magneticBtns.forEach(btn => {
            // Skip if already initialized
            if (btn.dataset.magneticInit) return;
            btn.dataset.magneticInit = 'true';

            btn.addEventListener('mousemove', (e) => {
                // Skip if this is a protected button
                if (btn.id === 'mobile-menu-btn' || btn.id === 'show-more-certifications' || btn.classList.contains('cert-tab')) {
                    return;
                }
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transition = 'transform 0.1s ease-out';
            });
        });
    })();

    // --- 8. RIPPLE CLICK EFFECT ---
    (function initRippleEffect() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (!target) return;
            // Skip protected buttons - no ripple for them
            if (target.dataset.noTransform || target.closest('[data-no-transform]')) return;

            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

            target.style.position = 'relative';
            target.style.overflow = 'hidden';
            target.appendChild(ripple);

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    })();

    // --- 9. SMOOTH COUNTER ANIMATION ---
    (function initCounters() {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    const target = parseInt(entry.target.dataset.count);
                    const duration = 2000;
                    const start = performance.now();

                    function update(currentTime) {
                        const elapsed = currentTime - start;
                        const progress = Math.min(elapsed / duration, 1);
                        // easeOutExpo
                        const eased = 1 - Math.pow(2, -10 * progress);
                        entry.target.textContent = Math.floor(target * eased);
                        if (progress < 1) {
                            requestAnimationFrame(update);
                        } else {
                            entry.target.textContent = target;
                        }
                    }
                    requestAnimationFrame(update);
                }
            });
        }, { threshold: 0.5 });

        // Observe elements with data-count attribute
        setTimeout(() => {
            document.querySelectorAll('[data-count]').forEach(el => {
                counterObserver.observe(el);
            });
        }, 500);
    })();

    // --- 10. SKILL TAG HOVER SCATTER MICRO-ANIMATION ---
    (function initTagAnimation() {
        const tagsObserver = new MutationObserver(() => {
            document.querySelectorAll('#skills-container span').forEach(tag => {
                if (!tag.dataset.animated) {
                    tag.dataset.animated = 'true';
                    tag.classList.add('floating-tag');
                    tag.addEventListener('mouseenter', () => {
                        tag.style.transform = `translateY(-3px) scale(1.05) rotate(${(Math.random() - 0.5) * 4}deg)`;
                    });
                    tag.addEventListener('mouseleave', () => {
                        tag.style.transform = 'translateY(0) scale(1) rotate(0)';
                    });
                }
            });
        });
        tagsObserver.observe(document.body, { childList: true, subtree: true });
    })();

    // --- 11. SMOOTH PAGE LOAD ---
    setTimeout(() => {
        document.body.classList.add('page-loaded');
    }, 100);

    // --- 12. TECH STACK ICON ORBIT EFFECT ---
    (function initTechStackHover() {
        setTimeout(() => {
            const techIcons = document.querySelectorAll('#hero-content .flex-wrap i');
            techIcons.forEach((icon, i) => {
                icon.style.opacity = '0';
                icon.style.transform = 'translateY(20px) scale(0.5)';
                icon.style.transition = `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s`;

                setTimeout(() => {
                    icon.style.opacity = '1';
                    icon.style.transform = 'translateY(0) scale(1)';
                }, 800);

                // Continuous gentle float
                icon.addEventListener('mouseenter', () => {
                    icon.style.transform = 'translateY(-8px) scale(1.3) rotate(5deg)';
                    icon.style.filter = 'drop-shadow(0 4px 12px rgba(79, 70, 229, 0.4))';
                });
                icon.addEventListener('mouseleave', () => {
                    icon.style.transform = 'translateY(0) scale(1) rotate(0deg)';
                    icon.style.filter = 'none';
                });
            });
        }, 600);
    })();

    // --- 13. SECTION HEADER ANIMATE-IN ---
    (function initSectionHeaders() {
        const headerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const h2 = entry.target;
                    h2.style.opacity = '1';
                    h2.style.transform = 'translateY(0)';

                    // Animate the colored span
                    const span = h2.querySelector('span');
                    if (span) {
                        span.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s';
                        span.style.opacity = '1';
                        span.style.transform = 'translateX(0)';
                    }
                }
            });
        }, { threshold: 0.3 });

        setTimeout(() => {
            document.querySelectorAll('section h2').forEach(h2 => {
                h2.style.opacity = '0';
                h2.style.transform = 'translateY(30px)';
                h2.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

                const span = h2.querySelector('span');
                if (span) {
                    span.style.opacity = '0';
                    span.style.transform = 'translateX(-20px)';
                }

                headerObserver.observe(h2);
            });
        }, 400);
    })();

    // --- 14. GITHUB STATS IMAGES GLOW ON HOVER ---
    (function initGitHubGlow() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('#github-stats-container > div').forEach(card => {
                if (!card.dataset.glowInit) {
                    card.dataset.glowInit = 'true';
                    card.addEventListener('mouseenter', () => {
                        card.style.boxShadow = '0 0 30px rgba(79, 70, 229, 0.15), 0 0 60px rgba(79, 70, 229, 0.05)';
                        card.style.transform = 'translateY(-4px) scale(1.01)';
                        card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.boxShadow = '';
                        card.style.transform = '';
                    });
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    })();

    // --- 15. HERO AVATAR SPINNING GLOW RING ---
    (function initAvatarGlowRing() {
        setTimeout(() => {
            const avatarWrapper = document.querySelector('#hero-content .animate-float');
            if (!avatarWrapper) return;

            // Create rotating conic gradient ring
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                background: conic-gradient(from 0deg, #4F46E5, #EC4899, #8B5CF6, #06B6D4, #4F46E5);
                z-index: -1;
                animation: spinGlow 3s linear infinite;
                filter: blur(4px);
                opacity: 0.5;
            `;

            // Add keyframes dynamically
            if (!document.getElementById('spin-glow-style')) {
                const style = document.createElement('style');
                style.id = 'spin-glow-style';
                style.textContent = `@keyframes spinGlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }

            avatarWrapper.style.position = 'relative';
            avatarWrapper.appendChild(ring);
        }, 400);
    })();

    // --- 16. CERTIFICATION TABS FILTERING ---
    (function initCertificationTabs() {
        const certTabs = document.querySelectorAll('.cert-tab');
        const certContainer = document.getElementById('certifications-container');

        if (!certTabs.length || !certContainer) return;

        // Store reference to re-render function (set by certification render code)
        window.filterCertifications = function(category) {
            const certCards = certContainer.querySelectorAll('.cert-card');
            let visibleCount = 0;
            
            certCards.forEach(card => {
                const matches = category === 'all' || card.dataset.category === category;
                
                if (matches) {
                    visibleCount++;
                    card.style.display = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        card.style.transition = 'all 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 200);
                }
            });
            
            // Hide/show the "Show More" button based on filter
            const showMoreBtn = document.getElementById('show-more-certifications');
            if (showMoreBtn) {
                showMoreBtn.style.display = category === 'all' ? 'flex' : 'none';
            }
        };

        certTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab styling
                certTabs.forEach(t => {
                    t.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
                    t.classList.add('bg-white', 'text-gray-700');
                });
                tab.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
                tab.classList.remove('bg-white', 'text-gray-700');

                // Get category and filter
                const category = tab.dataset.category;
                
                // If filtering by category, first show all cards then filter
                if (category !== 'all') {
                    // Trigger show all first if not already
                    const showMoreBtn = document.getElementById('show-more-certifications');
                    if (showMoreBtn && showMoreBtn.textContent.includes('Show All')) {
                        showMoreBtn.click();
                        // Wait for render then filter
                        setTimeout(() => window.filterCertifications(category), 100);
                    } else {
                        window.filterCertifications(category);
                    }
                } else {
                    window.filterCertifications(category);
                }
            });
        });
    })();

    // ==========================================
    //  LIGHTWEIGHT CSS 3D EFFECTS
    // ==========================================

    // --- 17. HERO 3D EFFECTS ---
    (function initHero3D() {
        const heroContent = document.getElementById('hero-content');
        if (!heroContent) return;

        // Add 3D tilt to hero elements
        const heroElements = heroContent.querySelectorAll('.animate-float, .phosphor-icon');
        heroElements.forEach(el => {
            el.style.transformStyle = 'preserve-3d';
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'translateZ(30px) scale(1.05)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });

        // Add glow effect to tech stack icons
        const techIcons = heroContent.querySelectorAll('.flex-wrap i, .tech-icon');
        techIcons.forEach((icon, i) => {
            icon.style.transition = 'all 0.3s ease';
            icon.addEventListener('mouseenter', () => {
                icon.style.transform = 'translateY(-8px) scale(1.2) rotate(5deg)';
                icon.style.filter = 'drop-shadow(0 0 15px rgba(79, 70, 229, 0.6))';
            });
            icon.addEventListener('mouseleave', () => {
                icon.style.transform = '';
                icon.style.filter = '';
            });
        });
    })();

    // --- 18. SIMPLE FLOATING ANIMATION FOR CARDS ---
    (function initFloatingCards() {
        const cards = document.querySelectorAll('.project-card, .certification-card, .learning-card');
        cards.forEach((card, i) => {
            card.style.animationDelay = `${i * 0.1}s`;
        });
    })();

    // --- 19. HEADING 3D TEXT EFFECT ---
    (function init3DText() {
        const headings = document.querySelectorAll('h2');
        headings.forEach(heading => {
            heading.classList.add('text-3d');
        });
    })();

    // ==========================================
    //  EXTREME 3D EFFECTS - MORE DRAMA
    // ==========================================

    // --- 20. SCROLL-BASED 3D SECTION ROTATIONS ---
    (function initScrollRotation() {
        // DISABLED - This was causing buttons to grow incrementally
        return;

        const sections = document.querySelectorAll('section');

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            sections.forEach((section, i) => {
                const rect = section.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const distanceFromCenter = (centerY - windowHeight / 2) / windowHeight;

                // Calculate 3D rotation based on scroll position
                const rotateX = distanceFromCenter * 15; // ±15 degrees
                const translateZ = Math.abs(distanceFromCenter) * -100;
                const opacity = 1 - Math.abs(distanceFromCenter) * 0.3;

                section.style.transform = `perspective(2000px) rotateX(${rotateX}deg) translateZ(${translateZ}px)`;
                section.style.opacity = opacity;
                section.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            });
        });
    })();

    // --- 21. PARALLAX DEPTH LAYERS ---
    (function initParallaxDepth() {
        // DISABLED - This was causing buttons to grow incrementally
        return;

        const layers = document.querySelectorAll('.layer-1, .layer-2, .layer-3, .project-card, .certification-card');

        window.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

            layers.forEach((layer, i) => {
                const depth = (i % 3) + 1;
                const moveX = mouseX * depth * 15;
                const moveY = mouseY * depth * 15;
                const rotateY = mouseX * depth * 5;
                const rotateX = -mouseY * depth * 5;

                layer.style.transform = `translateX(${moveX}px) translateY(${moveY}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            });
        });
    })();

    // --- 22. 3D FLIP ENTRANCE FOR ALL CARDS ---
    (function initFlipEntrance() {
        // SIMPLIFIED - Let the cards use their own tilt effect
        // Only add subtle entrance animation without conflicting transforms
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px'
        };

        const flipObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !entry.target.dataset.entered) {
                    entry.target.dataset.entered = 'true';
                    entry.target.style.opacity = '1';
                }
            });
        }, observerOptions);

        // Apply after dynamic content loads
        setTimeout(() => {
            const cards = document.querySelectorAll('.project-card, .certification-card, .feature-card');
            cards.forEach((card, i) => {
                if (!card.dataset.entered) {
                    card.style.opacity = '0';
                    card.style.transition = `opacity 0.5s ease ${i * 0.1}s`;
                    flipObserver.observe(card);
                }
            });
        }, 100);
    })();

    // --- 23. STAGGERED 3D FLOATING ANIMATION ---
    (function initStaggeredFloat() {
        // Apply floating animation after content loads
        // Uses CSS class .float-animated with --float-delay variable
        setTimeout(() => {
            const allCards = document.querySelectorAll('.project-card, .certification-card, .skill-item, .learning-card');

            allCards.forEach((card, i) => {
                // Only add animation class, don't override inline styles
                card.classList.add('float-animated');
                card.style.setProperty('--float-delay', `${i * 0.15}s`);
            });
        }, 900);
    })();

    // --- 24. 3D TIMELINE EFFECT ---
    (function init3DTimeline() {
        const timeline = document.querySelector('#experience-container');
        if (!timeline) return;

        const items = timeline.querySelectorAll('.timeline-item, div[class*="experience"]');

        items.forEach((item, i) => {
            const isEven = i % 2 === 0;
            const initialRotate = isEven ? -45 : 45;

            item.style.opacity = '0';
            item.style.transform = `perspective(1000px) rotateY(${initialRotate}deg) translateZ(-200px)`;
            item.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';

            const itemObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'perspective(1000px) rotateY(0deg) translateZ(0)';
                        }, i * 200);
                    }
                });
            }, { threshold: 0.3 });

            itemObserver.observe(item);
        });
    })();

    // --- 25. MAGNETIC 3D EFFECT FOR INTERACTIVE ELEMENTS ---
    (function initMagnetic3D() {
        // Only apply to links and buttons, NOT cards (cards have their own tilt)
        const interactiveElements = document.querySelectorAll(
            'a:not(.cert-tab):not(.sidebar-nav-link):not(.project-card a):not(.certification-card a)'
        );

        interactiveElements.forEach(el => {
            // Skip if element already has 3D effects from other functions
            if (el.classList.contains('magnetic-initialized')) return;
            // Skip if element is protected
            if (el.dataset.noTransform) return;
            el.classList.add('magnetic-initialized');

            el.addEventListener('mousemove', (e) => {
                // Skip if element is protected
                if (el.dataset.noTransform) return;
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const rotateX = (y / rect.height) * -20;
                const rotateY = (x / rect.width) * 20;

                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px) scale(1.05)`;
            });

            el.addEventListener('mouseleave', () => {
                if (el.dataset.noTransform) return;
                el.style.transform = '';
                el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            });

            el.addEventListener('mouseenter', () => {
                if (el.dataset.noTransform) return;
                el.style.transition = 'transform 0.1s ease-out';
            });
        });
    })();

    // --- 26. 3D ICON ROTATIONS ---
    (function init3DIcons() {
        const icons = document.querySelectorAll('i[class*="ph-"], .devicon, .skill-icon');

        icons.forEach((icon, i) => {
            icon.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

            icon.addEventListener('mouseenter', () => {
                icon.style.transform = `rotateY(360deg) rotateX(360deg) scale(1.3)`;
                icon.style.filter = 'drop-shadow(0 10px 20px rgba(79, 70, 229, 0.4))';
            });

            icon.addEventListener('mouseleave', () => {
                icon.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
                icon.style.filter = 'none';
            });
        });
    })();

    // --- 27. SCROLL VELOCITY 3D EFFECT ---
    (function initScrollVelocity() {
        // DISABLED - This was causing buttons to grow incrementally
        return;

        let lastScrollY = window.scrollY;
        let velocity = 0;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            velocity = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;

            // Apply skew based on scroll velocity
            const skew = Math.min(Math.max(velocity * 0.1, -10), 10);

            document.querySelectorAll('.project-card, .certification-card').forEach(card => {
                card.style.transform = `perspective(1000px) skewY(${skew}deg)`;
            });

            // Reset after scroll stops
            clearTimeout(window.scrollTimeout);
            window.scrollTimeout = setTimeout(() => {
                document.querySelectorAll('.project-card, .certification-card').forEach(card => {
                    card.style.transform = '';
                });
            }, 150);
        });
    })();

    // --- 28. AMBIENT FLOATING PARTICLES ---
    (function initAmbientParticles() {
        const container = document.createElement('div');
        container.className = 'ambient-particles';
        container.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        `;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 8 + 4;
            const colors = ['#4F46E5', '#EC4899', '#8B5CF6', '#06B6D4'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                opacity: 0.3;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: ambientFloat ${5 + Math.random() * 10}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
                filter: blur(2px);
            `;
            container.appendChild(particle);
        }

        document.body.appendChild(container);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ambientFloat {
                0%, 100% { transform: translateY(0) translateX(0) scale(1); }
                33% { transform: translateY(-50px) translateX(20px) scale(1.2); }
                66% { transform: translateY(30px) translateX(-30px) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    })();

    // --- 29. 3D SPOTLIGHT EFFECT ---
    (function initSpotlight() {
        const spotlight = document.createElement('div');
        spotlight.className = 'spotlight-effect';
        spotlight.style.cssText = `
            position: fixed;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(spotlight);

        document.addEventListener('mousemove', (e) => {
            spotlight.style.left = e.clientX + 'px';
            spotlight.style.top = e.clientY + 'px';
            spotlight.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });
    })();

    // --- 30. GLITCH EFFECT ON HOVER FOR TITLES ---
    (function initGlitchEffect() {
        const titles = document.querySelectorAll('h1, h2, .project-card h3');

        titles.forEach(title => {
            title.addEventListener('mouseenter', () => {
                title.style.animation = 'glitchText 0.3s ease-in-out';
                setTimeout(() => {
                    title.style.animation = '';
                }, 300);
            });
        });

        const style = document.createElement('style');
        style.textContent = `
            @keyframes glitchText {
                0% { transform: translate(0); }
                20% { transform: translate(-3px, 3px); }
                40% { transform: translate(-3px, -3px); }
                60% { transform: translate(3px, 3px); }
                80% { transform: translate(3px, -3px); }
                100% { transform: translate(0); }
            }
        `;
        document.head.appendChild(style);
    })();

    // --- 31. EFFECTS CONFIG PANEL ---
    (function initEffectsConfigPanel() {
        const configBtn = document.getElementById('rain-config-btn');
        const configPanel = document.getElementById('rain-config-panel');
        const configClose = document.getElementById('rain-config-close');
        
        if (!configBtn || !configPanel) return;
        
        let isPanelOpen = false;
        
        // Toggle panel
        configBtn.addEventListener('click', () => {
            isPanelOpen = !isPanelOpen;
            if (isPanelOpen) {
                configPanel.style.transform = 'translateX(0)';
                configBtn.querySelector('i').classList.remove('ph-sliders');
                configBtn.querySelector('i').classList.add('ph-x');
            } else {
                configPanel.style.transform = 'translateX(120%)';
                configBtn.querySelector('i').classList.remove('ph-x');
                configBtn.querySelector('i').classList.add('ph-sliders');
            }
        });
        
        // Close button
        if (configClose) {
            configClose.addEventListener('click', () => {
                isPanelOpen = false;
                configPanel.style.transform = 'translateX(120%)';
                configBtn.querySelector('i').classList.remove('ph-x');
                configBtn.querySelector('i').classList.add('ph-sliders');
            });
        }
        
        // --- MOTION EFFECT CONTROLS ---
        
        // 3D Card Tilt Toggle
        const tiltToggle = document.getElementById('tilt-toggle');
        if (tiltToggle) {
            tiltToggle.addEventListener('change', (e) => {
                document.body.classList.toggle('disable-tilt', !e.target.checked);
            });
        }
        
        // Floating Animations Toggle
        const floatToggle = document.getElementById('float-toggle');
        if (floatToggle) {
            floatToggle.addEventListener('change', (e) => {
                document.body.classList.toggle('disable-float', !e.target.checked);
            });
        }
        
        // Cursor Glow Toggle
        const glowToggle = document.getElementById('glow-toggle');
        const cursorGlow = document.getElementById('cursor-glow');
        const spotlightEl = document.querySelector('.spotlight-effect');
        if (glowToggle) {
            glowToggle.addEventListener('change', (e) => {
                if (cursorGlow) cursorGlow.style.display = e.target.checked ? 'block' : 'none';
                if (spotlightEl) spotlightEl.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        
        // Ambient Particles Toggle
        const particlesToggle = document.getElementById('particles-toggle');
        if (particlesToggle) {
            particlesToggle.addEventListener('change', (e) => {
                const particles = document.querySelector('.ambient-particles');
                if (particles) particles.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        
        // All Effects On/Off Buttons
        const disableAllBtn = document.getElementById('disable-all-effects');
        const enableAllBtn = document.getElementById('enable-all-effects');
        
        if (disableAllBtn) {
            disableAllBtn.addEventListener('click', () => {
                // Disable all toggles
                if (tiltToggle) { tiltToggle.checked = false; tiltToggle.dispatchEvent(new Event('change')); }
                if (floatToggle) { floatToggle.checked = false; floatToggle.dispatchEvent(new Event('change')); }
                if (glowToggle) { glowToggle.checked = false; glowToggle.dispatchEvent(new Event('change')); }
                if (particlesToggle) { particlesToggle.checked = false; particlesToggle.dispatchEvent(new Event('change')); }
                const rainToggle = document.getElementById('rain-toggle');
                if (rainToggle && window.rainControls) {
                    rainToggle.checked = false;
                    window.rainControls.toggleRain(false);
                }
            });
        }
        
        if (enableAllBtn) {
            enableAllBtn.addEventListener('click', () => {
                // Enable all toggles
                if (tiltToggle) { tiltToggle.checked = true; tiltToggle.dispatchEvent(new Event('change')); }
                if (floatToggle) { floatToggle.checked = true; floatToggle.dispatchEvent(new Event('change')); }
                if (glowToggle) { glowToggle.checked = true; glowToggle.dispatchEvent(new Event('change')); }
                if (particlesToggle) { particlesToggle.checked = true; particlesToggle.dispatchEvent(new Event('change')); }
                const rainToggle = document.getElementById('rain-toggle');
                if (rainToggle && window.rainControls) {
                    rainToggle.checked = true;
                    window.rainControls.toggleRain(true);
                }
            });
        }
        
        // Wait for rain.js to initialize
        setTimeout(() => {
            if (!window.rainConfig || !window.rainControls) {
                return;
            }
            
            const config = window.rainConfig;
            const controls = window.rainControls;
            
            // Rain Toggle
            const rainToggle = document.getElementById('rain-toggle');
            if (rainToggle) {
                rainToggle.addEventListener('change', (e) => {
                    controls.toggleRain(e.target.checked);
                });
            }
            
            // Drop Count
            const dropCount = document.getElementById('drop-count');
            const dropCountValue = document.getElementById('drop-count-value');
            if (dropCount && dropCountValue) {
                dropCount.value = config.dropCount;
                dropCountValue.textContent = config.dropCount;
                dropCount.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    dropCountValue.textContent = value;
                    controls.adjustDropCount(value);
                });
            }
            
            // Drop Speed
            const dropSpeed = document.getElementById('drop-speed');
            const dropSpeedValue = document.getElementById('drop-speed-value');
            if (dropSpeed && dropSpeedValue) {
                dropSpeed.value = config.dropSpeed;
                dropSpeedValue.textContent = config.dropSpeed;
                dropSpeed.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    dropSpeedValue.textContent = value;
                    config.dropSpeed = value;
                });
            }
            
            // Wind
            const wind = document.getElementById('wind');
            const windValue = document.getElementById('wind-value');
            if (wind && windValue) {
                wind.value = config.wind;
                windValue.textContent = config.wind;
                wind.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    windValue.textContent = value;
                    config.wind = value;
                });
            }
            
            // Cursor Repel
            const cursorRepel = document.getElementById('cursor-repel');
            const cursorRepelValue = document.getElementById('cursor-repel-value');
            if (cursorRepel && cursorRepelValue) {
                cursorRepel.value = config.cursorRepelStrength;
                cursorRepelValue.textContent = config.cursorRepelStrength;
                cursorRepel.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    cursorRepelValue.textContent = value;
                    config.cursorRepelStrength = value;
                });
            }
            
            // Water Rise Speed
            const waterRise = document.getElementById('water-rise');
            const waterRiseValue = document.getElementById('water-rise-value');
            if (waterRise && waterRiseValue) {
                waterRise.value = config.waterRiseSpeed;
                waterRiseValue.textContent = config.waterRiseSpeed;
                waterRise.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    waterRiseValue.textContent = value.toFixed(2);
                    config.waterRiseSpeed = value;
                });
            }
            
            // Reset Water Button
            const resetWaterBtn = document.getElementById('reset-water-btn');
            if (resetWaterBtn) {
                resetWaterBtn.addEventListener('click', () => {
                    controls.resetWater();
                });
            }
            
        }, 500);
    })();

});


// --- 12. CUSTOM RIGHT-CLICK MENU ---
(function initContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'ctx-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
        <div class="ctx-header"><span class="ctx-dot"></span>yosedie.dev</div>
        <button type="button" class="ctx-item" data-section="hero"><i class="ph ph-house"></i>Home</button>
        <button type="button" class="ctx-item" data-section="about"><i class="ph ph-user"></i>About Me</button>
        <button type="button" class="ctx-item" data-section="skills"><i class="ph ph-code"></i>Skills</button>
        <button type="button" class="ctx-item" data-section="projects"><i class="ph ph-rocket-launch"></i>Projects</button>
        <button type="button" class="ctx-item" data-section="contact"><i class="ph ph-envelope"></i>Contact</button>
        <div class="ctx-sep"></div>
        <a class="ctx-item" href="https://github.com/yosedie" target="_blank" rel="noopener"><i class="ph ph-github-logo"></i>GitHub Profile</a>
        <a class="ctx-item" href="https://www.linkedin.com/in/yosedie" target="_blank" rel="noopener"><i class="ph ph-linkedin-logo"></i>LinkedIn</a>
        <div class="ctx-sep"></div>
        <div class="ctx-footer">custom-built &middot; no default menus here</div>
    `;
    document.body.appendChild(menu);

    window.__ctxOpen = function (e) {
        menu.classList.add('ctx-open');
        const w = menu.offsetWidth, h = menu.offsetHeight;
        const x = Math.min(e.clientX, window.innerWidth - w - 12);
        const y = Math.min(e.clientY, window.innerHeight - h - 12);
        menu.style.left = Math.max(8, x) + 'px';
        menu.style.top = Math.max(8, y) + 'px';
    };

    function close() { menu.classList.remove('ctx-open'); }

    menu.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-section]');
        close();
        if (btn) {
            const nav = document.querySelector('.sidebar-nav-link[data-section="' + btn.dataset.section + '"]');
            if (nav) nav.click(); // reuse the existing section router
        }
    });
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
})();
