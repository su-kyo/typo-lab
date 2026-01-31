
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tone, CharacterData } from './types';
import { FONT_POOLS, DEFAULT_TONE, INITIAL_TEXT } from './constants';
import { detectTone } from './services/geminiService';
import Character from './components/Character';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const App: React.FC = () => {
  const [text, setText] = useState(INITIAL_TEXT);
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [isLocked, setIsLocked] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [characters, setCharacters] = useState<CharacterData[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard and Viewport handling
  useEffect(() => {
    const handleResize = () => {
      // Small delay to let browser finish resizing
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Particle System Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const p = particlesRef.current;
      for (let i = p.length - 1; i >= 0; i--) {
        const part = p[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.02;

        if (part.life <= 0) {
          p.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${part.life})`;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const emitParticles = useCallback((x: number, y: number) => {
    if (isLocked) return;
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.6 + Math.random() * 0.4,
        size: 1 + Math.random() * 2
      });
    }
    // Cap particles
    if (particlesRef.current.length > 200) {
      particlesRef.current.shift();
    }
  }, [isLocked]);

  // Initial character data setup
  useEffect(() => {
    const chars = INITIAL_TEXT.split('').map((char, i) => ({
      id: `char-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      char,
      font: FONT_POOLS[DEFAULT_TONE][Math.floor(Math.random() * FONT_POOLS[DEFAULT_TONE].length)],
    }));
    setCharacters(chars);
  }, []);

  // Handle live typing with reconciliation
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    setCharacters(prev => {
      const nextChars: CharacterData[] = [];
      const newCharsArray = newText.split('');

      newCharsArray.forEach((char, i) => {
        if (prev[i] && prev[i].char === char) {
          nextChars.push(prev[i]);
        } else {
          nextChars.push({
            id: `char-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            char,
            font: FONT_POOLS[tone][Math.floor(Math.random() * FONT_POOLS[tone].length)],
          });
        }
      });
      return nextChars;
    });

    setText(newText);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (newText.trim().length >= 5) {
        const detected = await detectTone(newText);
        setTone(detected);
      }
    }, 1000);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const dynamicStyles = {
    letterSpacing: `${(mousePos.x - 0.5) * (window.innerWidth < 768 ? 15 : 40)}px`,
    fontWeight: Math.floor(100 + mousePos.y * 800),
    fontSize: `clamp(1.5rem, 6vw, 5rem)`,
    lineHeight: '1.2',
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col bg-black text-white font-sans overflow-hidden">
      {/* Particle Canvas Overlay */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />

      {/* UI Controls - Top */}
      <div className="absolute top-4 sm:top-10 left-4 sm:left-10 flex flex-col gap-2 sm:gap-4 z-30">
        <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-40 flex items-center gap-2 sm:gap-3">
          <span className={`w-1.5 h-1.5 rounded-full bg-white ${tone === 'intense' ? 'animate-ping' : 'animate-pulse'}`}></span>
          Tone: <span className="opacity-100 font-bold">{tone}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsLocked(true)}
            className={`text-[8px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] px-3 sm:px-4 py-1 sm:py-1.5 border transition-all ${isLocked ? 'bg-white text-black border-white' : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white'}`}
          >
            Lock
          </button>
          <button
            onClick={() => setIsLocked(false)}
            className={`text-[8px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] px-3 sm:px-4 py-1 sm:py-1.5 border transition-all ${!isLocked ? 'bg-white text-black border-white' : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white'}`}
          >
            Melt
          </button>
        </div>
      </div>

      <div className="absolute top-4 sm:top-10 right-4 sm:right-10 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-30 text-right z-30 pointer-events-none hidden xs:block">
        Modulation Active<br />
        <span className="opacity-100">X: Letter Spacing</span><br />
        <span className="opacity-100">Y: Weight</span>
      </div>

      {/* Text Stage - Centered but scrollable if too long */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 z-20 overflow-y-auto no-scrollbar">
        <div
          className="w-full max-w-7xl text-center break-words select-none"
          style={dynamicStyles}
        >
          {characters.map((charData) => (
            <Character
              key={charData.id}
              char={charData.char}
              initialFont={charData.font}
              currentTone={tone}
              isLocked={isLocked}
              onMutation={emitParticles}
            />
          ))}
        </div>
      </main>

      {/* Input Field - Bottom Docked */}
      <div className="w-full flex flex-col items-center px-6 sm:px-10 pb-6 sm:pb-12 pt-2 z-30 bg-black/80 backdrop-blur-sm">
        <div ref={scrollContainerRef} className="w-full max-w-lg relative group">
          <textarea
            value={text}
            onChange={handleInputChange}
            placeholder="TYPE TO MUTATE..."
            className="w-full bg-transparent border-b border-white/10 focus:border-white/40 outline-none py-3 text-center text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase transition-all resize-none h-14 no-scrollbar placeholder:opacity-30"
            spellCheck={false}
            autoFocus
          />
          <div className="mt-2 sm:mt-4 text-[7px] sm:text-[8px] opacity-10 uppercase tracking-widest text-center">
            Typography Experimental Lab // Mobile Optimized
          </div>
        </div>
      </div>

      {/* Aesthetic Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-40"></div>

      {/* Vercel Debug Overlay - remove after fixing */}
      <div className="fixed bottom-0 right-0 p-2 bg-red-500 text-white text-xs z-[9999] pointer-events-none opacity-50">
        VERCEL_DEBUG_MODE_ACTIVE
      </div>
    </div>
  );
};

export default App;
