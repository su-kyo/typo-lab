
import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { FONT_POOLS, TONE_SHAPES } from '../constants';
import { Tone } from '../types';

interface CharacterProps {
  char: string;
  initialFont: string;
  currentTone: Tone;
  isLocked: boolean;
  onMutation: (x: number, y: number) => void;
}

const Character: React.FC<CharacterProps> = ({ char, initialFont, currentTone, isLocked, onMutation }) => {
  const [font, setFont] = useState(initialFont);
  const [isHovered, setIsHovered] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  const triggerEffects = useCallback(() => {
    if (spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      onMutation(rect.left + rect.width / 2, rect.top + rect.height / 2);
      setFlashKey(prev => prev + 1);
    }
  }, [onMutation]);

  // Initial mount effects
  useEffect(() => {
    triggerEffects();
  }, []); // Only on mount

  const mutate = useCallback(() => {
    if (isLocked) return;
    
    const pool = FONT_POOLS[currentTone];
    const newFont = pool[Math.floor(Math.random() * pool.length)];
    setFont(newFont);
    triggerEffects();
  }, [isLocked, currentTone, triggerEffects]);

  const handleMouseEnter = useCallback(() => {
    mutate();
    setIsHovered(true);
  }, [mutate]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Prevent default to avoid ghost clicks or scroll issues, but allow normal interaction
    mutate();
    setIsHovered(true);
    setTimeout(() => setIsHovered(false), 200);
  }, [mutate]);

  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <span
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      className="relative select-none inline-block px-[0.05em] touch-manipulation"
      style={{
        fontFamily: font,
        transition: 'all 0.1s cubic-bezier(0.2, 0, 0, 1)',
        opacity: isHovered ? 0.7 : 1,
        transform: isHovered && !isLocked ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Geometry Flash Background */}
      {!isLocked && (
        <div 
          key={flashKey}
          className={`geometry-flash active ${TONE_SHAPES[currentTone]}`} 
        />
      )}
      
      {displayChar}
    </span>
  );
};

export default memo(Character);
