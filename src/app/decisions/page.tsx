'use client';

import { useState } from 'react';
import { usePulseData } from '@/hooks/usePulseData';
import { updateDecisionLog } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { DbDecisionLog, DecisionState } from '@/types/database';
import Link from 'next/link';

const stateConfig: Record<DecisionState, { icon: typeof AlertCircle; label: string; color: string; badgeBg: string }> = {
  pending: { icon: AlertCircle, label: '대기중', color: 'text-amber-500', badgeBg: 'bg-amber-50 text-amber-600 border-amber-100' },
  decided: { icon: CheckCircle2, label: '결정됨', color: 'text-green-500', badgeBg: 'bg-green-50 text-green-600 border-green-100' },
  followup_done: { icon: Clock, label: '후속완료', color: 'text-blue-500', badgeBg: 'bg-blue-50 text-blue-600 border-blue-100' },
};

const STATE_OPTIONS: DecisionState[] = ['pending', 'decided', 'followup_done'];

export default function DecisionsPage() {
  const { teams, decisions, loading, error, refresh } = usePulseData();

  const [filterState, setFilterState] = useState<DecisionState | 'all'>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 수정
  const [editId, setEditId] = useState<string | null>(null);
  const [editDecision, setEditDecision] = useState('');
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-red-500 font-medium">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? '알 수 없음';

  let filtered = [...decisions];
  if (filterState !== 'all') {
    filtered = filtered.filter((d) => d.state === filterState);
  }
  if (filterTeam !== 'all') {
    filtered = filtered.filter((d) => d.team_id === filterTeam);
  }

  const pendingCount = decisions.filter((d) => d.state === 'pending').length;

  const handleStateChange = async (id: string, newState: DecisionState) => {
    try {
      const updates: Partial<DbDecisionLog> = { state: newState };
      if (newState === 'decided') {
        updates.decided_at = new Date().toISOString();
      }
      await updateDecisionLog(id, updates);
      await refresh();
    } catch (err) {
      console.error('[PULSE] update decision state error', err);
    }
  };

  const startEdit = (d: DbDecisionLog) => {
    setEditId(d.id);
    setEditDecision(d.decision ?? '');
    setEditComment(d.comment ?? '');
    setExpandedId(d.id);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDecision('');
    setEditComment('');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await updateDecisionLog(id, {
        decision: editDecision.trim() || null,
        comment: editComment.trim() || null,
      });
      setEditId(null);
      await refresh();
    } catch (err) {
      console.error('[PULSE] update decision error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">결정 로그</h1>
            <p className="text-sm text-gray-500">전체 팀의 의사결정 기록</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
            {pendingCount}건 대기중
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 상태 필터 */}
        <div className="flex items-center gap-1">
          {(['all', ...STATE_OPTIONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterState(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                filterState === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {s === 'all' ? '전체' : stateConfig[s].label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* 팀 필터 */}
        <select
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-all duration-200"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
        >
          <option value="all">전체 팀</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
          {decisions.length === 0
            ? '등록된 결정 사항이 없습니다. 팀 상세 페이지에서 결정 로그를 추가하세요.'
            : '필터 조건에 맞는 결정 로그가 없습니다.'
          }
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-lg overflow-hidden divide-y divide-gray-100">
          {filtered.map((d) => {
            const config = stateConfig[d.state];
            const isExpanded = expandedId === d.id;
            const isEditing = editId === d.id;

            return (
              <div key={d.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                {/* Row */}
                <div className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  >
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-medium',
                        d.state === 'followup_done' ? 'text-gray-400' : 'text-gray-800'
                      )}>
                        {d.title}
                      </p>
                      <Link
                        href={`/teams/${d.team_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline shrink-0 transition-colors"
                      >
                        {getTeamName(d.team_id)}
                      </Link>
                    </div>
                    {!isExpanded && d.context && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{d.context}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      className={cn('rounded-full px-2 py-0.5 text-xs font-medium border cursor-pointer appearance-none', config.badgeBg)}
                      value={d.state}
                      onChange={(e) => handleStateChange(d.id, e.target.value as DecisionState)}
                    >
                      {STATE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{stateConfig[s].label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => startEdit(d)}
                      className="rounded-lg p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      title="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 mx-5 py-3 space-y-3">
                    {d.context && (
                      <p className="text-sm text-gray-600 leading-relaxed">{d.context}</p>
                    )}

                    {(d.option_a || d.option_b) && (
                      <div className="grid grid-cols-2 gap-2">
                        {d.option_a && (
                          <div className={cn(
                            'rounded-xl border p-3 text-sm',
                            d.decision?.includes('A') ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 bg-white'
                          )}>
                            <span className="font-bold text-blue-600">A.</span> {d.option_a}
                          </div>
                        )}
                        {d.option_b && (
                          <div className={cn(
                            'rounded-xl border p-3 text-sm',
                            d.decision?.includes('B') ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 bg-white'
                          )}>
                            <span className="font-bold text-blue-600">B.</span> {d.option_b}
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing ? (
                      <div className="space-y-2 rounded-xl bg-gray-50 p-3">
                        <Input
                          className="h-9 text-sm bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                          placeholder="최종 결정 내용 (예: A안 채택)"
                          value={editDecision}
                          onChange={(e) => setEditDecision(e.target.value)}
                          autoFocus
                        />
                        <Textarea
                          className="text-sm resize-none bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                          placeholder="코멘트 (선택)"
                          rows={2}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200">
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => saveEdit(d.id)}
                            disabled={saving}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {d.decision && (
                          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                            <span className="font-bold">결정:</span> {d.decision}
                          </div>
                        )}
                        {d.comment && (
                          <p className="text-sm text-gray-600 italic pl-3 border-l-2 border-gray-300">
                            &ldquo;{d.comment}&rdquo;
                          </p>
                        )}
                        {!d.decision && !d.comment && (
                          <button
                            onClick={() => startEdit(d)}
                            className="text-sm text-gray-400 italic hover:text-blue-600 transition-colors"
                          >
                            클릭하여 결정 내용을 입력하세요...
                          </button>
                        )}
                      </>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {d.decided_at && <span>결정일: {new Date(d.decided_at).toLocaleDateString('ko-KR')}</span>}
                      {d.followup_date && <span>후속 점검: {new Date(d.followup_date).toLocaleDateString('ko-KR')}</span>}
                      <span>{new Date(d.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 등록</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
