'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selected?: Date | null;
  onSelect?: (date: Date | null) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ?? new Date()
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={cn('w-[280px] select-none', className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center text-xs font-medium py-1.5',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, idx) => {
          const inMonth = isSameMonth(d, currentMonth);
          const sel = selected && isSameDay(d, selected);
          const today = isToday(d);
          const dayOfWeek = d.getDay();

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (sel) {
                  onSelect?.(null);
                } else {
                  onSelect?.(d);
                }
              }}
              className={cn(
                'relative h-9 w-full rounded-lg text-sm font-medium transition-all duration-150',
                !inMonth && 'text-gray-300',
                inMonth && !sel && 'hover:bg-blue-50',
                inMonth && dayOfWeek === 0 && !sel && 'text-red-500',
                inMonth && dayOfWeek === 6 && !sel && 'text-blue-500',
                inMonth && dayOfWeek !== 0 && dayOfWeek !== 6 && !sel && 'text-gray-700',
                sel && 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700',
                today && !sel && 'ring-2 ring-blue-300 ring-inset'
              )}
            >
              {format(d, 'd')}
              {today && !sel && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-center">
        <button
          type="button"
          onClick={() => {
            setCurrentMonth(new Date());
            onSelect?.(new Date());
          }}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
        >
          오늘
        </button>
      </div>
    </div>
  );
}
