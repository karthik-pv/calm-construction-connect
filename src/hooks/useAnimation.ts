import { useRef, useEffect } from 'react';
import { initParticleEffects, createMeditationTimer } from '../lib/animations';

type AnimationOptions = {
  type?: 'particles' | 'meditation' | 'parallax' | 'magnetic';
  duration?: number;
  onComplete?: () => void;
};

/**
 * Custom hook for adding animations to components
 * @param options Animation options
 * @returns ref that should be attached to the element to animate
 */
export function useAnimation(options: AnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Add animation classes based on type
    if (options.type) {
      switch (options.type) {
        case 'particles':
          element.classList.add('particle-container');
          initParticleEffects(element);
          break;
        case 'meditation':
          element.classList.add('meditation-circle');
          if (options.duration && options.onComplete) {
            createMeditationTimer(`#${element.id}`, options.duration, options.onComplete);
          }
          break;
        case 'parallax':
          element.classList.add('parallax-tilt');
          break;
        case 'magnetic':
          element.classList.add('magnetic-effect');
          break;
      }
    }
    
    // Cleanup
    return () => {
      // Remove any necessary classes or event listeners
      if (options.type === 'particles') {
        element.querySelectorAll('.particle').forEach(p => p.remove());
      }
    };
  }, [options]);
  
  return ref;
}

/**
 * Hook for scroll-triggered animations
 * @param direction Direction to animate from
 * @returns ref that should be attached to the element to animate
 */
export function useScrollAnimation(direction: 'bottom' | 'left' | 'right' = 'bottom') {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Add appropriate classes
    element.classList.add('reveal-on-scroll', `from-${direction}`);
    
    // Check if element is already in viewport on mount
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          element.classList.add('visible');
          observer.unobserve(element);
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [direction]);
  
  return ref;
}

/**
 * Hook for staggered animations on lists or groups
 * @returns ref that should be attached to the parent container
 */
export function useStaggeredAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    element.classList.add('stagger-fade-in');
    
    // Force reflow to trigger animations
    setTimeout(() => {
      Array.from(element.children).forEach(child => {
        void child.offsetWidth;
      });
    }, 10);
  }, []);
  
  return ref;
}

/**
 * Hook for adding hover effects
 * @param type Type of hover effect to apply
 * @returns ref that should be attached to the element
 */
export function useHoverEffect(type: 'lift' | 'expand' | 'glow' | 'ripple' = 'lift') {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    switch (type) {
      case 'lift':
        element.classList.add('hover-lift');
        break;
      case 'expand':
        element.classList.add('hover-expand');
        break;
      case 'glow':
        element.classList.add('hover-glow');
        break;
      case 'ripple':
        element.classList.add('ripple');
        break;
    }
  }, [type]);
  
  return ref;
}

/**
 * Hook for text animation effects
 * @param type Type of text animation
 * @returns ref that should be attached to the text element
 */
export function useTextAnimation(type: 'gradient' | 'typing' | 'shimmer' = 'gradient') {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    switch (type) {
      case 'gradient':
        element.classList.add('gradient-text');
        break;
      case 'typing':
        element.classList.add('typing');
        // Store original text
        const text = element.textContent || '';
        // Clear and re-add for animation
        element.textContent = '';
        
        setTimeout(() => {
          element.textContent = text;
        }, 100);
        break;
      case 'shimmer':
        element.classList.add('shimmer');
        break;
    }
  }, [type]);
  
  return ref;
} 