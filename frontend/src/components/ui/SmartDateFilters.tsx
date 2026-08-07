import React from 'react';

interface SmartDateFiltersProps {
  onSelect: (startDate: string, endDate: string) => void;
}

export const SmartDateFilters: React.FC<SmartDateFiltersProps> = ({ onSelect }) => {
  const handleSelect = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date();
    
    // Format helper YYYY-MM-DD
    const format = (d: Date) => {
      return d.toISOString().split('T')[0];
    };

    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // already today
    } else if (type === 'week') {
      start.setDate(today.getDate() - today.getDay()); // Sunday as start of week
    } else if (type === 'month') {
      start.setDate(1); // 1st of current month
    } else if (type === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    onSelect(format(start), format(end));
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button 
        onClick={() => handleSelect('today')}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
      >
        اليوم
      </button>
      <button 
        onClick={() => handleSelect('week')}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
      >
        هذا الأسبوع
      </button>
      <button 
        onClick={() => handleSelect('month')}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
      >
        هذا الشهر
      </button>
      <button 
        onClick={() => handleSelect('lastMonth')}
        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
      >
        الشهر الماضي
      </button>
    </div>
  );
};
