
import { FontPool, Tone } from './types';

export const FONT_POOLS: FontPool = {
  calm: [
    "'Lora', serif",
    "'EB Garamond', serif",
    "'Playfair Display', serif",
    "'Crimson Pro', serif"
  ],
  playful: [
    "'Comfortaa', cursive",
    "'Fredoka', sans-serif",
    "'Quicksand', sans-serif",
    "'Patrick Hand', cursive"
  ],
  serious: [
    "'Inter', sans-serif",
    "'Roboto Mono', monospace",
    "'Montserrat', sans-serif",
    "'Oswald', sans-serif"
  ],
  intense: [
    "'Anton', sans-serif",
    "'Syncopate', sans-serif",
    "'Bodoni Moda', serif",
    "'Oswald', sans-serif"
  ]
};

export const TONE_SHAPES: Record<Tone, string> = {
  calm: 'shape-calm',
  playful: 'shape-playful',
  serious: 'shape-serious',
  intense: 'shape-intense'
};

export const DEFAULT_TONE: Tone = 'serious';

export const INITIAL_TEXT = "TYPE SOMETHING TO EXPLORE TONE AND FORM.";
