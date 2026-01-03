
import { Curriculum } from './types';

export const CURRICULUM: Curriculum = {
  units: [
    {
      id: 'unit-1',
      titleAr: 'الحساب الكيميائي',
      titleEn: 'Chemical Arithmetic',
      topics: [
        { id: 't1-1', titleAr: 'المول', titleEn: 'The Mole', parts: 4, currentPart: 1 },
        { id: 't1-2', titleAr: 'حساب الصيغ الكيميائية', titleEn: 'Chemical Formula Calculation', parts: 4, currentPart: 1 },
        { id: 't1-3', titleAr: 'تركيز المحاليل', titleEn: 'Concentration of Solutions', parts: 4, currentPart: 1 },
      ]
    },
    {
      id: 'unit-2',
      titleAr: 'بنية الذرة',
      titleEn: 'Atomic Structure',
      topics: [
        { id: 't2-1', titleAr: 'تطور مفهوم بنية الذرة', titleEn: 'Evolution of Atomic Theory', parts: 4, currentPart: 1 },
        { id: 't2-2', titleAr: 'أعداد الكم', titleEn: 'Quantum Numbers', parts: 4, currentPart: 1 },
        { id: 't2-3', titleAr: 'قواعد توزيع الإلكترونات', titleEn: 'Electron Distribution Rules', parts: 4, currentPart: 1 },
      ]
    },
    {
      id: 'unit-3',
      titleAr: 'الجدول الدوري وتصنيف العناصر',
      titleEn: 'Periodic Table and Element Classification',
      topics: [
        { id: 't3-1', titleAr: 'وصف الجدول الدوري', titleEn: 'Description of Periodic Table', parts: 4, currentPart: 1 },
        { id: 't3-2', titleAr: 'تدرج الخواص في الجدول الدوري', titleEn: 'Periodicity of Properties', parts: 4, currentPart: 1 },
        { id: 't3-3', titleAr: 'أعداد التأكسد', titleEn: 'Oxidation Numbers', parts: 4, currentPart: 1 },
      ]
    }
  ]
};
