
export type Language = 'ar' | 'en';

export interface Topic {
  id: string;
  titleAr: string;
  titleEn: string;
  parts: number; // 1 to 4
  currentPart: number;
}

export interface Unit {
  id: string;
  titleAr: string;
  titleEn: string;
  topics: Topic[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Curriculum {
  units: Unit[];
}
