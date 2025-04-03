// Animations utility for the mental health app

// Initialize scroll-based animations
export function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally unobserve if animation should only happen once
        // observer.unobserve(entry.target);
      } else {
        // Comment this line if animations should only trigger once
        // entry.target.classList.remove('visible');
      }
    });
  }, observerOptions);

  // Observe all elements with animation classes
  document.querySelectorAll('.reveal-on-scroll, .fade-in-up, .scale-in').forEach(el => {
    observer.observe(el);
  });
}

// Initialize particle effects
export function initParticleEffects(container: HTMLElement) {
  // Number of particles
  const particleCount = 15;
  
  // Clear existing particles
  container.querySelectorAll('.particle').forEach(p => p.remove());
  
  // Create new particles
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Randomize particle properties
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.width = `${Math.random() * 4 + 2}px`;
    particle.style.height = particle.style.width;
    particle.style.opacity = `${Math.random() * 0.6}`;
    
    // Randomize animation
    particle.style.animationDuration = `${Math.random() * 10 + 5}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    container.appendChild(particle);
  }
}

// Cursor-tracking effects for hover elements
export function initCursorEffects() {
  document.addEventListener('mousemove', (e) => {
    // Update CSS variables for cursor position
    document.documentElement.style.setProperty('--cursor-x', e.clientX.toString());
    document.documentElement.style.setProperty('--cursor-y', e.clientY.toString());
    
    // Handle magnetic effects
    document.querySelectorAll('.magnetic-effect').forEach((el) => {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Calculate center point of element
      const elX = rect.left + rect.width / 2;
      const elY = rect.top + rect.height / 2;
      
      // Calculate distance from cursor to element center
      const distanceX = e.clientX - elX;
      const distanceY = e.clientY - elY;
      
      // Define max distance for the effect
      const maxDistance = 100;
      
      // Check if cursor is within effect range
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      if (distance < maxDistance) {
        // Calculate how much to move based on distance (closer = stronger)
        const strength = maxDistance / (distance + 1) * 0.2;
        const moveX = distanceX * strength;
        const moveY = distanceY * strength;
        
        // Apply transform
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      } else {
        // Reset position if cursor is too far
        element.style.transform = '';
      }
    });
  });
}

// Initialize parallax tilt effect
export function initParallaxTilt() {
  document.querySelectorAll('.parallax-tilt').forEach((card) => {
    const element = card as HTMLElement;
    
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);
      
      // Limit rotation to a subtle amount
      const maxRotate = 5;
      
      element.style.transform = `
        perspective(1000px)
        rotateY(${percentX * maxRotate}deg)
        rotateX(${-percentY * maxRotate}deg)
      `;
    });
    
    // Reset on mouse leave
    element.addEventListener('mouseleave', () => {
      element.style.transform = `
        perspective(1000px)
        rotateY(0deg)
        rotateX(0deg)
      `;
    });
  });
}

// Initialize typing animation
export function initTypingAnimation() {
  document.querySelectorAll('.typing').forEach((element) => {
    // Get the text content
    const text = element.textContent || '';
    
    // Clear the element
    element.textContent = '';
    
    // Create wrapper for text
    const wrapper = document.createElement('span');
    wrapper.textContent = text;
    
    // Setup animation
    element.appendChild(wrapper);
  });
}

// Initialize all animations
export function initAllAnimations() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAnimations);
  } else {
    setupAnimations();
  }
  
  function setupAnimations() {
    initScrollAnimations();
    initCursorEffects();
    initParallaxTilt();
    initTypingAnimation();
    
    // Initialize particle effects for containers
    document.querySelectorAll('.particle-container').forEach((container) => {
      initParticleEffects(container as HTMLElement);
    });
    
    // Set up staggered animations
    document.querySelectorAll('.stagger-fade-in').forEach((container) => {
      // Reflow to trigger the animation
      Array.from(container.children).forEach((child) => {
        // Force a reflow
        void child.offsetWidth;
      });
    });
  }
}

// Create meditation animation
export function createMeditationTimer(elementSelector: string, durationSeconds: number, onComplete: () => void) {
  const element = document.querySelector(elementSelector);
  if (!element) return;
  
  // Set up the timer animation
  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);
  
  const updateTimer = () => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const remaining = Math.max(0, endTime - currentTime);
    
    // Calculate progress (0 to 1)
    const progress = Math.min(1, elapsed / (durationSeconds * 1000));
    
    // Update visual representation
    if (element instanceof HTMLElement) {
      element.style.setProperty('--progress', `${progress * 100}%`);
    }
    
    // Continue or complete
    if (remaining > 0) {
      requestAnimationFrame(updateTimer);
    } else {
      onComplete();
    }
  };
  
  // Start the animation
  requestAnimationFrame(updateTimer);
} 