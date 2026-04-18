// Dark Mode Manager
class DarkModeManager {
    constructor() {
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.darkModeIcon = document.getElementById('darkModeIcon');
        this.isDarkMode = false;
        
        this.init();
    }
    
    init() {
        // Check localStorage for saved preference
        const savedMode = localStorage.getItem('darkMode');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial mode
        if (savedMode !== null) {
            this.isDarkMode = savedMode === 'true';
        } else {
            this.isDarkMode = systemPrefersDark;
        }
        
        this.applyDarkMode();
        
        // Add event listener to toggle button
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDarkMode();
            });
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                this.isDarkMode = e.matches;
                this.applyDarkMode();
            }
        });
        
        // Initial icon setup
        this.updateIcon();
    }
    
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyDarkMode();
        this.updateIcon();
        
        // Optional: Send to server
        this.syncWithServer();
    }
    
    applyDarkMode() {
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
    }
    
    updateIcon() {
        if (this.darkModeIcon) {
            if (this.isDarkMode) {
                this.darkModeIcon.classList.remove('fa-moon');
                this.darkModeIcon.classList.add('fa-sun');
            } else {
                this.darkModeIcon.classList.remove('fa-sun');
                this.darkModeIcon.classList.add('fa-moon');
            }
        }
    }
    
    async syncWithServer() {
        try {
            await fetch('/toggle-darkmode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ darkMode: this.isDarkMode })
            });
        } catch (error) {
            console.error('Failed to sync dark mode with server:', error);
        }
    }
}

// Mobile Menu Manager
class MobileMenuManager {
    constructor() {
        this.menuBtn = document.getElementById('mobileMenuBtn');
        this.closeBtn = document.getElementById('closeMobileMenu');
        this.mobileMenu = document.getElementById('mobileMenu');
        
        this.init();
    }
    
    init() {
        if (this.menuBtn && this.mobileMenu) {
            this.menuBtn.addEventListener('click', () => this.openMenu());
            this.closeBtn?.addEventListener('click', () => this.closeMenu());
            
            // Close on outside click
            this.mobileMenu.addEventListener('click', (e) => {
                if (e.target === this.mobileMenu) {
                    this.closeMenu();
                }
            });
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.mobileMenu.classList.contains('open')) {
                    this.closeMenu();
                }
            });
        }
    }
    
    openMenu() {
        this.mobileMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    closeMenu() {
        this.mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Navbar Scroll Effect
class NavbarScrollEffect {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.init();
    }
    
    init() {
        if (this.navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    this.navbar.classList.add('shadow-lg');
                    this.navbar.style.backdropFilter = 'blur(8px)';
                    this.navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    
                    if (document.documentElement.classList.contains('dark')) {
                        this.navbar.style.backgroundColor = 'rgba(17, 24, 39, 0.95)';
                    }
                } else {
                    this.navbar.classList.remove('shadow-lg');
                    this.navbar.style.backdropFilter = 'none';
                    this.navbar.style.backgroundColor = '';
                }
            });
        }
    }
}

// Active Link Highlighter
class ActiveLinkHighlighter {
    constructor() {
        this.init();
    }
    
    init() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && currentPath === href) {
                link.classList.add('active');
            }
        });
    }
}

// Search Functionality
class SearchHandler {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.init();
    }
    
    init() {
        if (this.searchInput) {
            let debounceTimer;
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }
    }
    
    handleSearch(query) {
        if (query.length > 2) {
            console.log('Searching for:', query);
            // Implement search logic here
        }
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
    new MobileMenuManager();
    new NavbarScrollEffect();
    new ActiveLinkHighlighter();
    new SearchHandler();
});

//home page animations 
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let dataPackets = [];
const mouse = { x: null, y: null, radius: 150 }; // Moderate radius for focused effect

// --- Configuration ---
const config = {
    nodeColor: 'rgba(103, 232, 249,', // Cyan base
    alertColor: 'rgba(239, 68, 68,',   // Red base (Tailwind red-500)
    linkColor: 'rgba(103, 232, 249,', // Cyan connections
    packetColor: 'rgba(255, 255, 255,', // White packets
    maxVelocity: 0.6,
    connectionDist: 160,
    nodeGlow: 12,
};

// --- Initialization & Events ---
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// --- Classes ---

class Node {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 2; // Bolder nodes: 2-4px
        this.vx = (Math.random() - 0.5) * config.maxVelocity;
        this.vy = (Math.random() - 0.5) * config.maxVelocity;
        this.pulse = Math.random() * Math.PI; // Random start phase for pulsing
        this.isAlert = false;
    }

    update() {
        // Base Movement
        this.x += this.vx;
        this.y += this.vy;

        // Pulse (alters size subtly)
        this.pulse += 0.03;
        this.currentSize = this.size + Math.sin(this.pulse) * 0.8;

        // Screen Boundary Bounce
        if (this.x > canvas.width || this.x < 0) this.vx *= -1;
        if (this.y > canvas.height || this.y < 0) this.vy *= -1;

        // Mouse (Threat) Interaction
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            this.isAlert = true; // Turn red
            // Gentle Repulsion (Scramble)
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * 1.8;
            this.y -= (dy / distance) * force * 1.8;
        } else {
            this.isAlert = false; // Normal blue
        }
    }

    draw() {
        // Higher visibility and glow
        const opacity = 0.85;
        const color = this.isAlert ? config.alertColor : config.nodeColor;
        
        ctx.fillStyle = color + opacity + ')';
        ctx.shadowBlur = this.isAlert ? config.nodeGlow * 1.5 : config.nodeGlow;
        ctx.shadowColor = color + ' 0.6)';
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow for next draw operations
        ctx.shadowBlur = 0;
    }
}

// DataPacket: Tiny point that travels between connected nodes
class DataPacket {
    constructor(startNode, endNode) {
        this.start = startNode;
        this.end = endNode;
        this.progress = 0; // 0 to 1
        this.speed = 0.005 + Math.random() * 0.01; // Travel speed
    }

    update() {
        this.progress += this.speed;
        // Linear Interpolation: Move from start to end
        this.x = this.start.x + (this.end.x - this.start.x) * this.progress;
        this.y = this.start.y + (this.end.y - this.start.y) * this.progress;

        // Remove packet when it reaches the destination
        if (this.progress >= 1) {
            return false;
        }
        return true;
    }

    draw() {
        ctx.fillStyle = config.packetColor + ' 1)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = config.packetColor + ' 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); // Tiny, bright packet
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// --- Functions ---

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    dataPackets = [];
    // Lower node count (1 per 12000px) for a clean network look
    const numberOfParticles = (canvas.width * canvas.height) / 12000;
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Node());
    }
}

function connect() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.connectionDist) {
                // Determine connection color based on alert status
                let baseOpacity = 1 - (distance / config.connectionDist);
                let opacity = baseOpacity * 0.35; // Bolder lines
                let lineColor = (particles[a].isAlert || particles[b].isAlert) 
                    ? config.alertColor 
                    : config.linkColor;

                ctx.strokeStyle = lineColor + opacity + ')';
                ctx.lineWidth = 1.3; 
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();

                // Spawning Data Packets (rare chance on established link)
                if (Math.random() < 0.001 && !particles[a].isAlert && !particles[b].isAlert) {
                    dataPackets.push(new DataPacket(particles[a], particles[b]));
                }
            }
        }
    }
}

function animate() {
    // Clear with slight trailing effect for smooth motion
    ctx.fillStyle = 'rgba(10, 20, 40, 0.2)'; // Match dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update & Draw Nodes
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }

    // Connect Nodes (Draw Links)
    connect();

    // Update & Draw Data Packets
    dataPackets = dataPackets.filter(packet => {
        if (packet.update()) {
            packet.draw();
            return true;
        }
        return false;
    });

    requestAnimationFrame(animate);
}

// --- Start ---
init();
animate();