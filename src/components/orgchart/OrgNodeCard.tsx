'use client';

import { useState, useRef, useEffect } from 'react';
import { getTeamIssues } from '@/lib/statusCalc';
import type { DbIssue, DbTeam } from '@/types/database';
import { cn } from '@/lib/utils';
import { AlertCircle, GripVertical, Users, Palette, X } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const TEAM_COLORS = [
  { value: null, label: '없음' },
  { value: '#3B82F6', label: '파랑' },
  { value: '#8B5CF6', label: '보라' },
  { value: '#EC4899', label: '핑크' },
  { value: '#EF4444', label: '빨강' },
  { value: '#F97316', label: '주황' },
  { value: '#EAB308', label: '노랑' },
  { value: '#22C55E', label: '초록' },
  { value: '#14B8A6', label: '청록' },
  { value: '#06B6D4', label: '시안' },
  { value: '#6366F1', label: '인디고' },
  { value: '#64748B', label: '슬레이트' },
] as const;

interface Props {
  team: DbTeam;
  issues: DbIssue[];
  isDragging?: boolean;
  onGripPointerDown?: (e: ReactPointerEvent) => void;
  onClick?: () => void;
  onColorChange?: (color: string | null) => void;
}

export default function OrgNodeCard({ team, issues, isDragging, onGripPointerDown, onClick, onColorChange }: Props) {
  const teamIssues = getTeamIssues(issues, team.id);
  const openIssues = teamIssues.filter((i) => i.state === 'open');
  const highIssues = openIssues.filter((i) => i.impact === 'high');
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const teamColor = team.color ?? null;

  return (
    <div
      className={cn(
        'w-[220px] rounded-xl border-2 shadow-md select-none transition-shadow relative',
        isDragging
          ? 'border-blue-400 shadow-xl shadow-blue-200/50 scale-[1.04]'
          : 'hover:border-blue-300 cursor-pointer',
        !isDragging && !teamColor && highIssues.length > 0 && 'border-red-200',
        !isDragging && !teamColor && highIssues.length === 0 && 'border-gray-200'
      )}
      style={{
        borderColor: !isDragging && teamColor ? teamColor : undefined,
        backgroundColor: teamColor ? `${teamColor}08` : '#fff',
      }}
      onClick={onClick}
    >
      {/* Color accent bar */}
      {teamColor && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-[10px]"
          style={{ backgroundColor: teamColor }}
        />
      )}

      {/* Drag handle + header */}
      <div className={cn('flex items-center gap-2 px-3 py-2.5 border-b border-gray-100', teamColor && 'pt-3.5')}>
        <div
          className="shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            e.stopPropagation();
            onGripPointerDown?.(e);
          }}
        >
          <GripVertical className="h-4 w-4 text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-gray-900 truncate">
            {team.name}
          </h3>
          {team.leader_name && (
            <p className="text-xs text-gray-500 truncate">{team.leader_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3 w-3" />
            <span>{team.member_count}</span>
          </div>
          {onColorChange && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowPicker(!showPicker);
              }}
              className={cn(
                'p-1 rounded-md transition-colors',
                teamColor ? 'hover:bg-white/60' : 'hover:bg-gray-100',
                'opacity-0 group-hover:opacity-100'
              )}
              style={{ opacity: showPicker ? 1 : undefined }}
              title="팀 색상 변경"
            >
              <Palette className="h-3.5 w-3.5" style={{ color: teamColor ?? '#9CA3AF' }} />
            </button>
          )}
        </div>
      </div>

      {/* Color picker popover */}
      {showPicker && onColorChange && (
        <div
          ref={pickerRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] bg-white rounded-xl border border-gray-200 shadow-xl p-3 w-[200px]"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">팀 색상</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPicker(false); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {TEAM_COLORS.map(({ value, label }) => (
              <button
                key={label}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onColorChange(value);
                  setShowPicker(false);
                }}
                className={cn(
                  'w-7 h-7 rounded-lg border-2 transition-all hover:scale-110',
                  teamColor === value ? 'border-gray-900 ring-2 ring-gray-300' : 'border-transparent'
                )}
                style={{
                  backgroundColor: value ?? '#f3f4f6',
                  ...(value === null ? { backgroundImage: 'linear-gradient(135deg, #f3f4f6 40%, #ef4444 40%, #ef4444 50%, #f3f4f6 50%)' } : {}),
                }}
                title={label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Issues summary */}
      <div className="px-3 py-2 space-y-1">
        {openIssues.length === 0 ? (
          <p className="text-xs text-gray-400">이슈 없음</p>
        ) : (
          <>
            {openIssues.slice(0, 2).map((issue) => (
              <div key={issue.id} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    issue.impact === 'high'
                      ? 'bg-red-400'
                      : issue.impact === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-gray-300'
                  )}
                />
                <p className="text-xs text-gray-600 truncate">{issue.title}</p>
              </div>
            ))}
            {openIssues.length > 2 && (
              <p className="text-[10px] text-gray-400 pl-3">
                +{openIssues.length - 2}개 더
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer badges */}
      {highIssues.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
            <AlertCircle className="h-2.5 w-2.5" />
            긴급 {highIssues.length}
          </span>
        </div>
      )}
    </div>
  );
}
