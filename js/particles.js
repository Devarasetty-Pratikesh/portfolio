/**
 * FUTURISTIC 2D/3D PARTICLE ENGINE
 * A high-performance, interactive, responsive particle webbing system using HTML5 Canvas.
 */

class ParticleEngine {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numberOfParticles = 65;
    this.connectionDistance = 120;
    this.mouse = {
      x: null,
      y: null,
      radius: 150,
      active: false
    };
    
    this.themeColors = {
      dark: {
        particle: 'rgba(0, 242, 254, 0.4)',
        line: 'rgba(0, 242, 254, 0.08)',
        accentParticle: 'rgba(255, 0, 127, 0.35)',
        accentLine: 'rgba(255, 0, 127, 0.06)'
      },
      light: {
        particle: 'rgba(2, 132, 199, 0.3)',
        line: 'rgba(2, 132, 199, 0.06)',
        accentParticle: 'rgba(147, 51, 234, 0.25)',
        accentLine: 'rgba(147, 51, 234, 0.04)'
      }
    };
    
    this.activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    this.init();
    this.bindEvents();
    this.animate();
  }
  
  init() {
    this.resizeCanvas();
    this.particles = [];
    
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this.canvas.width, this.canvas.height, i % 4 === 0));
    }
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Adjust density based on screen size
    if (window.innerWidth < 768) {
      this.numberOfParticles = 35;
      this.connectionDistance = 90;
    } else {
      this.numberOfParticles = 75;
      this.connectionDistance = 130;
    }
  }
  
  bindEvents() {
    // Resize event
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.init();
    });
    
    // Mouse movement inside viewport
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });
    
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.active = false;
    });
    
    // Watch theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          this.activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    const colors = this.themeColors[this.activeTheme];
    
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(this.mouse);
      this.particles[i].draw(this.ctx, colors);
    }
    
    this.connectParticles(colors);
    
    requestAnimationFrame(() => this.animate());
  }
  
  connectParticles(colors) {
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a + 1; b < this.particles.length; b++) {
        const dx = this.particles[a].x - this.particles[b].x;
        const dy = this.particles[a].y - this.particles[b].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.connectionDistance) {
          // Calculate line opacity based on distance
          const opacity = (1 - distance / this.connectionDistance).toFixed(2);
          
          // Use distinct line colors depending on particle types
          const isAccent = this.particles[a].isAccent || this.particles[b].isAccent;
          
          this.ctx.strokeStyle = isAccent 
            ? colors.accentLine.replace('0.06', (opacity * 0.12).toString()) 
            : colors.line.replace('0.08', (opacity * 0.15).toString());
            
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
          this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
          this.ctx.stroke();
        }
      }
    }
  }
}

class Particle {
  constructor(canvasWidth, canvasHeight, isAccent = false) {
    this.isAccent = isAccent;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.size = Math.random() * (isAccent ? 3.5 : 2) + 1;
    
    // Slow drifting speed
    this.speedX = (Math.random() - 0.5) * 0.35;
    this.speedY = (Math.random() - 0.5) * 0.35;
    
    // Parallax depth multiplier (deeper items move slower, sizing matches depth)
    this.depth = Math.random() * 0.6 + 0.4;
    this.speedX *= this.depth;
    this.speedY *= this.depth;
  }
  
  update(mouse) {
    // Standard drifty movement
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Screen boundary wrap-around
    if (this.x < 0) this.x = window.innerWidth;
    if (this.x > window.innerWidth) this.x = 0;
    if (this.y < 0) this.y = window.innerHeight;
    if (this.y > window.innerHeight) this.y = 0;
    
    // Mouse avoidance vector
    if (mouse.active && mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius) {
        // Force vector pointing away from mouse
        const force = (mouse.radius - distance) / mouse.radius;
        const forceX = (dx / distance) * force * 1.8;
        const forceY = (dy / distance) * force * 1.8;
        
        // Push particle away slightly
        this.x += forceX * this.depth;
        this.y += forceY * this.depth;
      }
    }
  }
  
  draw(ctx, colors) {
    ctx.fillStyle = this.isAccent ? colors.accentParticle : colors.particle;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle glow rings around primary active particles
    if (this.isAccent && Math.random() > 0.85) {
      ctx.strokeStyle = colors.accentParticle.replace('0.35', '0.1');
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Initialise particles once page loads
document.addEventListener('DOMContentLoaded', () => {
  new ParticleEngine();
});
