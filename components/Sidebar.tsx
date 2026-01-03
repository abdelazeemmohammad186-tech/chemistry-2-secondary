
import React from 'react';
import { CURRICULUM } from '../constants';
import { Language, Unit, Topic } from '../types';

interface SidebarProps {
  language: Language;
  onSelectTopic: (unit: Unit, topic: Topic) => void;
  selectedTopicId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ language, onSelectTopic, selectedTopicId }) => {
  return (
    <aside className="w-full md:w-80 bg-white border-r border-slate-200 overflow-y-auto h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-bold text-slate-500 uppercase tracking-wider text-xs">
          {language === 'ar' ? 'قائمة الدروس' : 'Course Modules'}
        </h2>
      </div>
      <div className="p-2 space-y-6">
        {CURRICULUM.units.map((unit) => (
          <div key={unit.id} className="space-y-1">
            <h3 className="px-3 py-2 text-sm font-bold text-teal-700 flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center bg-teal-50 rounded text-xs">
                {unit.id.split('-')[1]}
              </span>
              {language === 'ar' ? unit.titleAr : unit.titleEn}
            </h3>
            <div className="space-y-1">
              {unit.topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(unit, topic)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-md transition-all flex justify-between items-center active:scale-95 ${
                    selectedTopicId === topic.id
                      ? 'bg-teal-50 text-teal-900 border-l-4 border-teal-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={language === 'ar' ? 'text-right' : ''}>
                    {language === 'ar' ? topic.titleAr : topic.titleEn}
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded">
                    4 Parts
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
