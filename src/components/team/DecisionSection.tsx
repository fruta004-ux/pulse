'use client';

import { useState } from 'react';
import { insertDecisionLog, updateDecisionLog } from '@/lib/queries';
import type { DbDecisionLog, DecisionState } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Scale,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  decisions: DbDecisionLog[];
  teamId: string;
  onRefresh: () => Promise<void>;
}

const stateConfig: Record<DecisionState, { icon: typeof AlertCircle; label: string; color: string; badgeBg: string }> = {
  pending: { icon: AlertCircle, label: '대기중', color: 'text-amber-500', badgeBg: 'bg-amber-50 text-amber-600 border-amber-100' },
  decided: { icon: CheckCircle2, label: '결정됨', color: 'text-green-500', badgeBg: 'bg-green-50 text-green-600 border-green-100' },
  followup_done: { icon: Clock, label: '후속완료', color: 'text-blue-500', badgeBg: 'bg-blue-50 text-blue-600 border-blue-100' },
};

const STATE_OPTIONS: DecisionState[] = ['pending', 'decided', 'followup_done'];

export default function DecisionSection({ decisions, teamId, onRefresh }: Props) {
  const teamDecisions = decisions.filter((d) => d.team_id === teamId);

  // 생성 폼
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContext, setNewContext] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [creating, setCreating] = useState(false);

  // 수정
  const [editId, setEditId] = useState<string | null>(null);
  const [editDecision, setEditDecision] = useState('');
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  // 펼침
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await insertDecisionLog({
        team_id: teamId,
        report_id: null,
        title: newTitle.trim(),
        context: newContext.trim() || null,
        option_a: newOptionA.trim() || null,
        option_b: newOptionB.trim() || null,
        recommendation: null,
        decision: null,
        decided_by: null,
        decided_at: null,
        comment: null,
        followup_date: null,
        outcome_note: null,
        state: 'pending',
      });
      setNewTitle('');
      setNewContext('');
      setNewOptionA('');
      setNewOptionB('');
      setShowCreate(false);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] create decision error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleStateChange = async (id: string, newState: DecisionState) => {
    try {
      const updates: Partial<DbDecisionLog> = { state: newState };
      if (newState === 'decided') {
        updates.decided_at = new Date().toISOString();
      }
      await updateDecisionLog(id, updates);
      await onRefresh();
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
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update decision error', err);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = teamDecisions.filter((d) => d.state === 'pending').length;

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Scale className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-lg text-gray-900">결정 로그</h3>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {pendingCount} 대기
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-lg border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="h-3.5 w-3.5" /> 결정 요청
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border-b border-blue-100 bg-blue-50/30 px-5 py-4 space-y-3">
          <Input
            className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
            placeholder="결정이 필요한 사안 제목 *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl resize-none text-sm"
            placeholder="배경 설명 (왜 결정이 필요한지)"
            rows={2}
            value={newContext}
            onChange={(e) => setNewContext(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
              placeholder="선택지 A"
              value={newOptionA}
              onChange={(e) => setNewOptionA(e.target.value)}
            />
            <Input
              className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
              placeholder="선택지 B"
              value={newOptionB}
              onChange={(e) => setNewOptionB(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowCreate(false)}>취소</Button>
            <Button
              size="sm"
              disabled={!newTitle.trim() || creating}
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {creating ? '저장 중...' : '등록'}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-gray-100">
        {teamDecisions.length === 0 && !showCreate ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            등록된 결정 사항이 없습니다
          </div>
        ) : (
          teamDecisions.map((d) => {
            const config = stateConfig[d.state];
            const Icon = config.icon;
            const isExpanded = expandedId === d.id;
            const isEditing = editId === d.id;

            return (
              <div key={d.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                {/* Row Header */}
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
                    <p className={cn(
                      'text-sm font-medium',
                      d.state === 'followup_done' ? 'text-gray-400' : 'text-gray-800'
                    )}>
                      {d.title}
                    </p>
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
                      title="결정 내용 수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 mx-5 py-3 space-y-3">
                    {/* 배경 */}
                    {d.context && (
                      <p className="text-sm text-gray-600 leading-relaxed">{d.context}</p>
                    )}

                    {/* 선택지 */}
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

                    {/* 결정/코멘트 수정 */}
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
                        {/* 결정 내용 */}
                        {d.decision && (
                          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                            <span className="font-bold">결정:</span> {d.decision}
                          </div>
                        )}

                        {/* 코멘트 */}
                        {d.comment && (
                          <p className="text-sm text-gray-600 italic pl-3 border-l-2 border-gray-300">
                            &ldquo;{d.comment}&rdquo;
                          </p>
                        )}

                        {/* 결정/코멘트 없을 때 클릭 유도 */}
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

                    {/* 메타 */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {d.decided_at && <span>결정일: {new Date(d.decided_at).toLocaleDateString('ko-KR')}</span>}
                      {d.followup_date && <span>후속 점검: {new Date(d.followup_date).toLocaleDateString('ko-KR')}</span>}
                      <span>{new Date(d.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 등록</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
