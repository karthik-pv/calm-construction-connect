import { useState } from 'react';
import { 
  useAnimation, 
  useScrollAnimation, 
  useStaggeredAnimation, 
  useHoverEffect,
  useTextAnimation
} from '../hooks/useAnimation';

export function AnimationShowcase() {
  const [meditationComplete, setMeditationComplete] = useState(false);
  
  // Refs for different animation types
  const particlesRef = useAnimation({ type: 'particles' });
  const parallaxRef = useAnimation({ type: 'parallax' });
  const magneticRef = useAnimation({ type: 'magnetic' });
  const meditationRef = useAnimation({ 
    type: 'meditation', 
    duration: 5, 
    onComplete: () => setMeditationComplete(true)
  });
  
  // Scroll animation refs
  const fromBottomRef = useScrollAnimation('bottom');
  const fromLeftRef = useScrollAnimation('left');
  const fromRightRef = useScrollAnimation('right');
  
  // Staggered animation for list items
  const staggeredRef = useStaggeredAnimation();
  
  // Hover effects
  const liftRef = useHoverEffect('lift');
  const expandRef = useHoverEffect('expand');
  const glowRef = useHoverEffect('glow');
  const rippleRef = useHoverEffect('ripple');
  
  // Text animations
  const gradientTextRef = useTextAnimation('gradient');
  const typingTextRef = useTextAnimation('typing');
  const shimmerTextRef = useTextAnimation('shimmer');
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl mb-8 gradient-heading">Animation Showcase</h1>
      
      {/* Breathing and Floating Animations */}
      <section className="mb-12">
        <h2 ref={fromBottomRef} className="text-2xl mb-4">Soothing Animations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl mb-2">Breathing Effect</h3>
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full breathe black-on-cream flex items-center justify-center">
              <span className="text-sm">Breathe</span>
            </div>
          </div>
          
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl mb-2">Floating Effect</h3>
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full float-element black-on-cream flex items-center justify-center">
              <span className="text-sm">Float</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Particle Effects */}
      <section className="mb-12">
        <h2 ref={fromLeftRef} className="text-2xl mb-4">Particle Effects</h2>
        
        <div ref={particlesRef} className="glass h-48 rounded-lg flex items-center justify-center">
          <p className="text-xl">Ambient Particles</p>
        </div>
      </section>
      
      {/* Interactive Cards */}
      <section className="mb-12">
        <h2 ref={fromRightRef} className="text-2xl mb-4">Interactive Cards</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div ref={parallaxRef} className="glass-card p-6 rounded-lg">
            <div className="bg-amber-50 p-4 rounded black-on-cream">
              <h3 className="text-xl mb-2">Parallax Effect</h3>
              <p>Move your mouse over this card to see the parallax effect</p>
            </div>
          </div>
          
          <div ref={magneticRef} className="glass-card p-6 rounded-lg flex items-center justify-center">
            <button className="cream-button px-6 py-3 rounded-full">
              Magnetic Button
            </button>
          </div>
        </div>
      </section>
      
      {/* Hover Effects */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Hover Effects</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div ref={liftRef} className="glass p-4 rounded-lg text-center">
            <p>Lift Effect</p>
          </div>
          
          <div ref={expandRef} className="glass p-4 rounded-lg text-center">
            <p>Expand Effect</p>
          </div>
          
          <div ref={glowRef} className="glass p-4 rounded-lg text-center">
            <p>Glow Effect</p>
          </div>
          
          <div ref={rippleRef} className="glass p-4 rounded-lg text-center">
            <p>Ripple Effect</p>
          </div>
        </div>
      </section>
      
      {/* Text Effects */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Text Effects</h2>
        
        <div className="space-y-6">
          <div className="glass p-4 rounded-lg">
            <h3 ref={gradientTextRef} className="text-2xl">Gradient Text Effect</h3>
          </div>
          
          <div className="glass p-4 rounded-lg">
            <h3 ref={typingTextRef} className="text-2xl">Typing Animation Effect</h3>
          </div>
          
          <div className="glass p-4 rounded-lg">
            <h3 ref={shimmerTextRef} className="text-2xl">Shimmer Text Effect</h3>
          </div>
        </div>
      </section>
      
      {/* Staggered Animation */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Staggered Animation</h2>
        
        <ul ref={staggeredRef} className="glass p-4 rounded-lg space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="p-2 cream-container rounded">
              <span className="black-on-cream">Staggered Item {i + 1}</span>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Meditation Timer */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Meditation Timer</h2>
        
        <div className="glass p-6 rounded-lg flex flex-col items-center">
          <div 
            id="meditationTimer"
            ref={meditationRef} 
            className="mb-4 flex items-center justify-center"
          >
            <span>{meditationComplete ? "Complete" : "5s"}</span>
          </div>
          
          <div className="progress-line w-full" style={{ "--progress": "100%" } as React.CSSProperties}></div>
        </div>
      </section>
      
      {/* Scroll Triggered Animations */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Scroll Animations</h2>
        
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="reveal-on-scroll from-bottom glass p-6 rounded-lg">
              <h3 className="text-xl mb-2">Scroll Reveal {i + 1}</h3>
              <p>This element animates when you scroll to it.</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Gradient Background Animation */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4">Gradient Animation</h2>
        
        <div className="gradient-animate p-6 rounded-lg h-48 flex items-center justify-center">
          <p className="text-xl">Animated Gradient Background</p>
        </div>
      </section>
    </div>
  );
} 