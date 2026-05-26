/**
 * CORE INTERACTIVITY ENGINE
 * Implements premium 3D effects, theme toggling, scroll reveals,
 * mobile drawer controls, and WCAG-compliant keyboard focus utilities.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initActiveNavLink();
  initHamburgerMenu();
  initTilt3DEffect();
  initScrollReveal();
  initSkillBarsReveal();
  initProjectModals();
});

/* ==========================================================================
   1. THEME CONTROLLER (Dark Mode / Light Mode)
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');
  
  // Read preference from storage or fallback to system dark preference
  const savedTheme = localStorage.getItem('portfolio-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  setTheme(currentTheme);
  
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
  
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);
    
    // Accessibility state updates
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    
    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }
  }
}

/* ==========================================================================
   2. NAV STATE MANAGER
   ========================================================================== */
function initActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    // Extract page name from link href
    const href = link.getAttribute('href');
    if (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/* ==========================================================================
   3. RESPONSIVE HAMBURGER NAVIGATION (Accessible)
   ========================================================================== */
function initHamburgerMenu() {
  const menuBtn = document.getElementById('hamburger-menu');
  const navMenu = document.getElementById('nav-menu');
  
  if (!menuBtn || !navMenu) return;
  
  menuBtn.addEventListener('click', () => {
    const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    toggleMenu(!isOpen);
  });
  
  // Close menu if user clicks outside of it
  document.addEventListener('click', (e) => {
    if (menuBtn.getAttribute('aria-expanded') === 'true' && 
        !navMenu.contains(e.target) && 
        !menuBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });
  
  // Close menu when Escape key is pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
      menuBtn.focus();
    }
  });
  
  function toggleMenu(open) {
    menuBtn.setAttribute('aria-expanded', open.toString());
    
    if (open) {
      navMenu.classList.add('open');
      document.body.style.overflow = 'hidden'; // Stop body scrolling
      
      // Accessibility: Trap focus inside menu (when in mobile view)
      trapMenuFocus(navMenu, menuBtn);
    } else {
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
      removeMenuFocusTrap();
    }
  }
}

let menuFocusHandler = null;

function trapMenuFocus(menu, trigger) {
  const focusableEls = menu.querySelectorAll('a, button');
  if (focusableEls.length === 0) return;
  
  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];
  
  menuFocusHandler = function(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) { // Shift + Tab (Backward)
      if (document.activeElement === firstEl || document.activeElement === trigger) {
        lastEl.focus();
        e.preventDefault();
      }
    } else { // Tab (Forward)
      if (document.activeElement === lastEl) {
        firstEl.focus();
        e.preventDefault();
      }
    }
  };
  
  document.addEventListener('keydown', menuFocusHandler);
}

function removeMenuFocusTrap() {
  if (menuFocusHandler) {
    document.removeEventListener('keydown', menuFocusHandler);
    menuFocusHandler = null;
  }
}

/* ==========================================================================
   4. PREMIUM 3D MOUSE-FOLLOW TILT INTERACTION
   ========================================================================== */
function initTilt3DEffect() {
  // Check if user prefers reduced motion (accessibility priority)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  
  const cards = document.querySelectorAll('.tilt-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      
      // Get mouse position relative to card boundaries
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convert positions to relative percentages for CSS spotlight variables
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      
      card.style.setProperty('--mouse-x', `${percentX}%`);
      card.style.setProperty('--mouse-y', `${percentY}%`);
      
      // Calculate rotation angles based on mouse offset relative to center of the card
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const tiltIntensity = 10; // Degrees of max tilt rotation
      const rotateY = ((x - centerX) / centerX) * tiltIntensity;
      const rotateX = -((y - centerY) / centerY) * tiltIntensity; // Inverted X axis
      
      // Hardware-accelerated smooth spatial transform
      card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      // Smooth reset to neutral center state
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    });
  });
}

/* ==========================================================================
   5. VIEWPORT SCROLL REVEAL (Intersection Observer)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve once shown to prevent redundant calculations
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before element fully rolls into view
  });
  
  revealElements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   6. SKILL BARS RADIAL ANIME
   ========================================================================== */
function initSkillBarsReveal() {
  const skillContainer = document.querySelector('.skills-grid');
  if (!skillContainer) return;
  
  const bars = document.querySelectorAll('.skill-bar-fill');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        bars.forEach(bar => {
          const progress = bar.getAttribute('data-progress');
          bar.style.width = `${progress}%`;
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  
  observer.observe(skillContainer);
}

/* ==========================================================================
   7. ACCESSIBLE DETAILS MODAL (Focus Lock)
   ========================================================================== */
let previouslyFocusedElement = null;
let modalFocusHandler = null;

function initProjectModals() {
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeButtons = document.querySelectorAll('[data-close-modal]');
  const modals = document.querySelectorAll('.modal-backdrop');
  
  if (openButtons.length === 0) return;
  
  openButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-open-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        openModal(targetModal, btn);
      }
    });
  });
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) closeModal(modal);
    });
  });
  
  // Close modal when clicking backdrop area
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
  
  // Universal key handler for escape and tab-trapping inside modal
  document.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.modal-backdrop[style*="display: flex"]');
    if (!activeModal) return;
    
    if (e.key === 'Escape') {
      closeModal(activeModal);
    }
  });
}

function openModal(modal, triggerBtn) {
  previouslyFocusedElement = triggerBtn;
  
  // Show modal using Flexbox alignment
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Set focus to the modal close button or container header
  const closeBtn = modal.querySelector('[data-close-modal]');
  if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 50);
  }
  
  // Trapping focus strictly inside the modal container
  trapModalFocus(modal);
}

function closeModal(modal) {
  modal.style.display = 'none';
  document.body.style.overflow = '';
  
  // Remove the event lock
  removeModalFocusTrap();
  
  // Restore focus back to original trigger button
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
    previouslyFocusedElement = null;
  }
}

function trapModalFocus(modal) {
  const focusableEls = modal.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]');
  if (focusableEls.length === 0) return;
  
  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];
  
  modalFocusHandler = function(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) { // Tab Backward
      if (document.activeElement === firstEl) {
        lastEl.focus();
        e.preventDefault();
      }
    } else { // Tab Forward
      if (document.activeElement === lastEl) {
        firstEl.focus();
        e.preventDefault();
      }
    }
  };
  
  document.addEventListener('keydown', modalFocusHandler);
}

function removeModalFocusTrap() {
  if (modalFocusHandler) {
    document.removeEventListener('keydown', modalFocusHandler);
    modalFocusHandler = null;
  }
}
