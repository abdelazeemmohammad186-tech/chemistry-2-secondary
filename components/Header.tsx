
import React from 'react';
import { Language } from '../types';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenLive: () => void;
  isLive: boolean;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage, onOpenLive, isLive }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-2xl bg-teal-50 w-10 h-10 flex items-center justify-center rounded-xl border border-teal-100 shadow-sm">
          👩‍🏫
        </div>
        <h1 className="text-lg md:text-xl font-bold text-slate-800">
          {language === 'ar' ? 'معلمة الكيمياء الذكية' : 'AI Chemistry Teacher'}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onOpenLive}
          className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm md:text-base transition-all active:scale-95 ${
            isLive 
              ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' 
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-100'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-600' : 'bg-white'}`}></span>
          {language === 'ar' ? 'أون إير' : 'On Air'}
        </button>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-slate-100 border-none rounded-lg px-2 py-2 text-xs md:text-sm font-medium focus:ring-2 focus:ring-teal-500 cursor-pointer active:bg-slate-200 transition-colors"
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>
  );
};

export default Header;
