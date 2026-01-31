
export type Tone = 'calm' | 'playful' | 'serious' | 'intense';

export interface CharacterData {
  id: string;
  char: string;
  font: string;
}

export interface FontPool {
  calm: string[];
  playful: string[];
  serious: string[];
  intense: string[];
}
