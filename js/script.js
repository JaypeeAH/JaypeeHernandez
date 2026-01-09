document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initWarpBackground();
    initSmoothScroll();
    initCarousels();
    initCardModals();
    initSectionBackgrounds();
});

/* =========================================
   Theme Management
   ========================================= */
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Set initial icon based on stored or default
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        
        // Save preference
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        // Update Icon
        toggleBtn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        
        // Trigger a custom event so the canvas can update colors immediately
        window.dispatchEvent(new Event('themeChanged'));
    });
}

/* =========================================
   Warp / Grid Distortion Background
   ========================================= */
function initWarpBackground() {
    const canvas = document.getElementById('warp-background');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let points = [];
    const spacing = 40; // Grid spacing
    
    // Mouse State
    let mouse = { x: -1000, y: -1000 }; // Start off-screen
    
    // Current Colors
    let pointColor = '#30363d'; // Default dark mode border color
    let primaryColor = '#3794ff';
    
    function updateColors() {
        const styles = getComputedStyle(document.body);
        pointColor = styles.getPropertyValue('--border-color').trim();
        primaryColor = styles.getPropertyValue('--primary-color').trim();
    }
    
    // Listen for theme changes to update color variables
    window.addEventListener('themeChanged', updateColors);
    // Initial call
    updateColors();

    class Point {
        constructor(x, y) {
            this.ox = x; // Original X
            this.oy = y; // Original Y
            this.x = x;
            this.y = y;
        }

        update() {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Interaction Radius (LARGER)
            const radius = 500;
            const force = Math.max(0, (radius - dist) / radius); 
            // Quintic easing for smooth dropoff
            const power = force * force * force * force * force; 
            
            // 'Black Hole' Pull Effect (Attraction) - SLOWER
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * power * 60; // Reduced pull strength
            const moveY = Math.sin(angle) * power * 60;
            
            // Physics: Spring back to original - SLOWER
            this.x += (this.ox - this.x) * 0.05 + moveX * 0.3;
            this.y += (this.oy - this.y) * 0.05 + moveY * 0.3;
        }

        draw() {
            // Draw Point
            ctx.fillStyle = pointColor;
            ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
        }
    }

    function createGrid() {
        points = [];
        for (let x = 0; x < width + spacing; x += spacing) {
            for (let y = 0; y < height + spacing; y += spacing) {
                points.push(new Point(x, y));
            }
        }
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        updateColors();
        createGrid();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw Connecting Lines (Optional - can be heavy)
        // For performance, let's just draw points that warp. 
        // Or simple lines if count is low. 
        // Let's sticking to points for "clean IDE" look, 
        // maybe draw lines only near mouse to visualize the warp.
        
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            p.update();
            p.draw();
            
            // Connect to neighbors? Too many operations for JS loops typically
        }
        
        // Optional: Draw a "Cursor" glow (LARGER)
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
        gradient.addColorStop(0, primaryColor + '22'); // Hex + alpha
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0, width, height);

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    resize();
    animate();
}

/* =========================================
   Smooth Scroll
   ========================================= */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =========================================
   Section Background Animations (Warp Effect)
   ========================================= */
function initSectionBackgrounds() {
    const sections = document.querySelectorAll('.section-content, .section-gray');
    
    sections.forEach((section) => {
        // Skip if section already has a canvas
        if (section.querySelector('.section-background canvas')) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const container = document.createElement('div');
        container.className = 'section-background';
        container.appendChild(canvas);
        section.insertBefore(container, section.firstChild);
        
        let points = [];
        const spacing = 40;
        let mouseX = -1000;
        let mouseY = -1000;
        
        // Current Colors
        let pointColor = '#30363d';
        let primaryColor = '#3794ff';
        
        function updateColors() {
            const styles = getComputedStyle(document.body);
            pointColor = styles.getPropertyValue('--border-color').trim();
            primaryColor = styles.getPropertyValue('--primary-color').trim();
        }
        
        window.addEventListener('themeChanged', updateColors);
        updateColors();
        
        class Point {
            constructor(x, y) {
                this.ox = x;
                this.oy = y;
                this.x = x;
                this.y = y;
            }
            
            update() {
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const radius = 500;
                const force = Math.max(0, (radius - dist) / radius);
                const power = force * force * force * force * force;
                
                const angle = Math.atan2(dy, dx);
                const moveX = Math.cos(angle) * power * 60;
                const moveY = Math.sin(angle) * power * 60;
                
                this.x += (this.ox - this.x) * 0.05 + moveX * 0.3;
                this.y += (this.oy - this.y) * 0.05 + moveY * 0.3;
            }
            
            draw() {
                ctx.fillStyle = pointColor;
                ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
            }
        }
        
        function createGrid() {
            points = [];
            for (let x = 0; x < canvas.width + spacing; x += spacing) {
                for (let y = 0; y < canvas.height + spacing; y += spacing) {
                    points.push(new Point(x, y));
                }
            }
        }
        
        function resize() {
            canvas.width = section.offsetWidth;
            canvas.height = section.offsetHeight;
            updateColors();
            createGrid();
        }
        
        resize();
        window.addEventListener('resize', resize);
        
        // Mouse tracking
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });
        
        section.addEventListener('mouseleave', () => {
            mouseX = -1000;
            mouseY = -1000;
        });
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                p.update();
                p.draw();
            }
            
            // Cursor glow
            if (mouseX > 0 && mouseY > 0) {
                const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
                gradient.addColorStop(0, primaryColor + '22');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
    });
}

/* =========================================
   Carousel Navigation
   ========================================= */
function initCarousels() {
    const carousels = {
        'portfolio-carousel': document.getElementById('portfolio-description'),
        'cert-carousel': document.getElementById('cert-description'),
        'video-carousel': document.getElementById('video-description')
    };
    
    // Update description based on visible card and handle full-width last card
    function updateDescription(carouselId) {
        const carousel = document.getElementById(carouselId);
        const descEl = carousels[carouselId];
        if (!carousel || !descEl) return;
        
        const cards = carousel.querySelectorAll('.carousel-card');
        const carouselRect = carousel.getBoundingClientRect();
        
        // Find the leftmost visible card
        let leftmostCard = null;
        let leftmostPosition = Infinity;
        let isLastCardVisible = false;
        
        cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardLeft = cardRect.left - carouselRect.left;
            
            // Check if this is the last card and it's visible
            if (index === cards.length - 1 && cardLeft >= -50 && cardLeft < carouselRect.width) {
                isLastCardVisible = true;
            }
            
            if (cardLeft >= -50 && cardLeft < leftmostPosition) {
                leftmostPosition = cardLeft;
                leftmostCard = card;
            }
        });
        
        // Toggle full-width class on last card when it's the primary visible card
        cards.forEach((card, index) => {
            if (index === cards.length - 1) {
                if (isLastCardVisible && leftmostCard === card) {
                    card.classList.add('full-width');
                } else {
                    card.classList.remove('full-width');
                }
            }
        });
        
        if (leftmostCard) {
            const title = leftmostCard.getAttribute('data-title');
            const desc = leftmostCard.getAttribute('data-desc');
            descEl.querySelector('h4').textContent = title;
            descEl.querySelector('p').textContent = desc;
        }
    }
    
    // Navigation buttons
    const navBtns = document.querySelectorAll('.carousel-nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const carousel = document.getElementById(targetId);
            const cards = carousel.querySelectorAll('.carousel-card');
            const carouselRect = carousel.getBoundingClientRect();
            
            if (btn.classList.contains('prev-btn')) {
                // Find the current leftmost card
                let currentIndex = -1;
                cards.forEach((card, index) => {
                    const cardRect = card.getBoundingClientRect();
                    const cardLeft = cardRect.left - carouselRect.left;
                    if (cardLeft >= -10 && cardLeft <= 10 && currentIndex === -1) {
                        currentIndex = index;
                    }
                });
                
                // Scroll to previous card
                if (currentIndex > 0) {
                    const targetCard = cards[currentIndex - 1];
                    const targetLeft = targetCard.offsetLeft;
                    carousel.scrollTo({ left: targetLeft, behavior: 'smooth' });
                }
            } else {
                // Find the current leftmost card
                let currentIndex = -1;
                cards.forEach((card, index) => {
                    const cardRect = card.getBoundingClientRect();
                    const cardLeft = cardRect.left - carouselRect.left;
                    if (cardLeft >= -10 && cardLeft <= 10 && currentIndex === -1) {
                        currentIndex = index;
                    }
                });
                
                // Scroll to next card
                if (currentIndex < cards.length - 1) {
                    const targetCard = cards[currentIndex + 1];
                    const targetLeft = targetCard.offsetLeft;
                    const cardWidth = targetCard.offsetWidth;
                    const carouselWidth = carousel.offsetWidth;
                    // Ensure the card is fully visible by scrolling enough to fit it
                    const scrollLeft = Math.max(0, targetLeft + cardWidth - carouselWidth + 20);
                    carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
            
            // Update description after scroll
            setTimeout(() => updateDescription(targetId), 400);
        });
    });
    
    // Track scroll to update descriptions
    Object.keys(carousels).forEach(carouselId => {
        const carousel = document.getElementById(carouselId);
        if (carousel) {
            carousel.addEventListener('scroll', () => {
                updateDescription(carouselId);
            });
            // Initial update
            updateDescription(carouselId);
        }
    });
}

/* =========================================
   Card Modal Popups
   ========================================= */
function initCardModals() {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalVideo = document.getElementById('modal-video');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const closeBtn = document.querySelector('.close');
    
    // Click handler for all carousel cards
    document.querySelectorAll('.carousel-card').forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-type');
            const src = card.getAttribute('data-src');
            const title = card.getAttribute('data-title');
            const desc = card.getAttribute('data-desc');
            
            modalTitle.textContent = title;
            modalDesc.textContent = desc;
            
            if (type === 'video') {
                // Show video, hide image
                modalVideo.style.display = 'block';
                modalImg.style.display = 'none';
                modalVideo.querySelector('source').src = src;
                modalVideo.load();
            } else {
                // Show image, hide video
                modalImg.style.display = 'block';
                modalVideo.style.display = 'none';
                modalImg.src = src;
            }
            
            modal.style.display = 'block';
        });
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        // Pause video if playing
        if (modalVideo.style.display === 'block') {
            modalVideo.pause();
        }
    });
    
    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            if (modalVideo.style.display === 'block') {
                modalVideo.pause();
            }
        }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            if (modalVideo.style.display === 'block') {
                modalVideo.pause();
            }
        }
    });
}
