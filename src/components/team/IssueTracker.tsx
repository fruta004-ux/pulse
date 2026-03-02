'use client';

import { useState } from 'react';
import { getTeamIssues } from '@/lib/statusCalc';
import { createIssue, updateIssue, deleteIssue } from '@/lib/queries';
import type { DbIssue, DbUser, IssueImpact, IssueState } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Scale,
  Trash2,
} from 'lucide-react';

interface Props {
  issues: DbIssue[];
  teamId: string;
  users: DbUser[];
  onRefresh: () => Promise<void>;
}

const impactConfig: Record<IssueImpact, { label: string; color: string }> = {
  high: { label: '높음', color: 'bg-red-50 text-red-600 border border-red-100' },
  medium: { label: '중간', color: 'bg-amber-50 text-amber-600 border border-amber-100' },
  low: { label: '낮음', color: 'bg-gray-50 text-gray-500 border border-gray-100' },
};

const stateConfig: Record<IssueState, { label: string; color: string }> = {
  open: { label: '열림', color: 'bg-blue-50 text-blue-600' },
  in_progress: { label: '진행중', color: 'bg-blue-50 text-blue-700' },
  resolved: { label: '해결', color: 'bg-green-50 text-green-600' },
};

const STATE_OPTIONS: IssueState[] = ['open', 'in_progress', 'resolved'];

type TabType = 'active' | 'resolved';

export default function IssueTracker({ issues, teamId, users, onRefresh }: Props) {
  const teamIssues = getTeamIssues(issues, teamId);
  const activeIssues = teamIssues.filter((i) => i.state !== 'resolved');
  const resolvedIssues = teamIssues.filter((i) => i.state === 'resolved');

  const [tab, setTab] = useState<TabType>('active');
  const displayIssues = tab === 'active' ? activeIssues : resolvedIssues;

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newImpact, setNewImpact] = useState<IssueImpact>('medium');
  const [creating, setCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editTitleId, setEditTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [editDescId, setEditDescId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  const [editDecisionId, setEditDecisionId] = useState<string | null>(null);
  const [editDecision, setEditDecision] = useState('');

  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createIssue({
        team_id: teamId,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        assignee_name: newAssignee.trim(),
        impact: newImpact,
      });
      setNewTitle('');
      setNewDesc('');
      setNewAssignee('');
      setNewImpact('medium');
      setShowCreate(false);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] create issue error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleStateChange = async (issue: DbIssue, newState: IssueState) => {
    try {
      await updateIssue(issue.id, { state: newState });
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update issue error', err);
    }
  };

  const startEditTitle = (issue: DbIssue) => {
    setEditTitleId(issue.id);
    setEditTitle(issue.title);
  };

  const saveTitle = async (issueId: string) => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await updateIssue(issueId, { title: editTitle.trim() });
      setEditTitleId(null);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update title error', err);
    } finally {
      setSaving(false);
    }
  };

  const startEditDesc = (issue: DbIssue) => {
    setEditDescId(issue.id);
    setEditDesc(issue.description ?? '');
    setExpandedId(issue.id);
  };

  const saveDesc = async (issueId: string) => {
    setSaving(true);
    try {
      await updateIssue(issueId, { description: editDesc.trim() || undefined });
      setEditDescId(null);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update desc error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (!confirm('이 이슈를 삭제하시겠습니까?')) return;
    try {
      await deleteIssue(issueId);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] delete issue error', err);
    }
  };

  const startEditDecision = (issue: DbIssue) => {
    setEditDecisionId(issue.id);
    setEditDecision(issue.decision ?? '');
    setExpandedId(issue.id);
  };

  const saveDecision = async (issueId: string) => {
    setSaving(true);
    try {
      await updateIssue(issueId, {
        decision: editDecision.trim() || undefined,
      });
      setEditDecisionId(null);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update decision error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-lg text-gray-900">이슈 트래커</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-lg border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
          onClick={() => { setShowCreate(!showCreate); setTab('active'); }}
        >
          <Plus className="h-3.5 w-3.5" /> 이슈 추가
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setTab('active')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium text-center transition-all duration-200 relative',
            tab === 'active'
              ? 'text-blue-700'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            진행중
            {activeIssues.length > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[20px]',
                tab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              )}>
                {activeIssues.length}
              </span>
            )}
          </span>
          {tab === 'active' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setTab('resolved')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium text-center transition-all duration-200 relative',
            tab === 'resolved'
              ? 'text-green-700'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            완료
            {resolvedIssues.length > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[20px]',
                tab === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              )}>
                {resolvedIssues.length}
              </span>
            )}
          </span>
          {tab === 'resolved' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border-b border-blue-100 bg-blue-50/30 px-5 py-4 space-y-3">
          <Input
            className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
            placeholder="이슈 제목 *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl resize-none text-sm"
            placeholder="내용 (상세 설명, 배경, 영향 등)"
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
              placeholder="담당자"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
            />
            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              value={newImpact}
              onChange={(e) => setNewImpact(e.target.value as IssueImpact)}
            >
              <option value="high">높음</option>
              <option value="medium">중간</option>
              <option value="low">낮음</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowCreate(false)}>취소</Button>
            <Button
              size="sm"
              disabled={!newTitle.trim() || creating}
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {creating ? '저장 중...' : '추가'}
            </Button>
          </div>
        </div>
      )}

      {/* Issue List */}
      <div className="divide-y divide-gray-100">
        {displayIssues.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            {tab === 'active' ? '진행중인 이슈가 없습니다' : '완료된 이슈가 없습니다'}
          </div>
        ) : (
          displayIssues.map((issue) => {
            const isExpanded = expandedId === issue.id;
            const isEditingTitle = editTitleId === issue.id;
            const isEditingDesc = editDescId === issue.id;
            const isEditingDecision = editDecisionId === issue.id;

            return (
              <div key={issue.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                {/* Row Header */}
                <div className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                    className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className={cn(
                    'h-2.5 w-2.5 rounded-full shrink-0',
                    issue.impact === 'high' ? 'bg-red-400' :
                    issue.impact === 'medium' ? 'bg-amber-400' : 'bg-gray-300'
                  )} />

                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-8 text-sm font-medium bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); saveTitle(issue.id); }
                            if (e.key === 'Escape') setEditTitleId(null);
                          }}
                        />
                        <button
                          onClick={() => saveTitle(issue.id)}
                          disabled={saving || !editTitle.trim()}
                          className="text-blue-600 hover:text-blue-700 shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditTitleId(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                        onDoubleClick={(e) => { e.stopPropagation(); startEditTitle(issue); }}
                      >
                        <p className={cn(
                          'text-sm font-medium',
                          issue.state === 'resolved' ? 'text-gray-400 line-through' : 'text-gray-800'
                        )}>
                          {issue.title}
                        </p>
                        {!isExpanded && issue.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{issue.description}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {issue.decision && (
                      <span className="rounded-full bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                        <Scale className="h-3 w-3" /> 결정
                      </span>
                    )}
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', impactConfig[issue.impact].color)}>
                      {impactConfig[issue.impact].label}
                    </span>
                    <select
                      className={cn('rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer appearance-none', stateConfig[issue.state].color)}
                      value={issue.state}
                      onChange={(e) => handleStateChange(issue, e.target.value as IssueState)}
                    >
                      {STATE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{stateConfig[s].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Meta */}
                {(issue.assignee_name || issue.due_date) && (
                  <div className="px-5 pb-2 pl-14">
                    <p className="text-xs text-gray-400">
                      {issue.assignee_name && `담당: ${issue.assignee_name}`}
                      {issue.due_date && ` · 마감: ${new Date(issue.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                )}

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 mx-5 py-3 pl-9 space-y-3">
                    {/* Description */}
                    {isEditingDesc ? (
                      <div className="space-y-2">
                        <Textarea
                          className="text-sm resize-none bg-white border-gray-200 focus:border-blue-400 rounded-xl"
                          rows={4}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="내용을 입력하세요..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveDesc(issue.id); }
                            if (e.key === 'Escape') setEditDescId(null);
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => setEditDescId(null)}>
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            disabled={saving}
                            onClick={() => saveDesc(issue.id)}
                          >
                            <Check className="h-3 w-3" /> {saving ? '저장 중...' : '저장'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditDesc(issue)}
                        className="cursor-pointer rounded-xl hover:bg-gray-50 p-3 -m-3 transition-all duration-200 group/desc"
                      >
                        <p className="text-xs font-semibold text-gray-500 mb-1">내용</p>
                        {issue.description ? (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {issue.description}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">클릭하여 내용을 추가하세요...</p>
                        )}
                        <Pencil className="h-3 w-3 text-gray-300 mt-1 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
                      </div>
                    )}

                    {/* Decision */}
                    <div className="border-t border-gray-100 pt-3">
                      {isEditingDecision ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Scale className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600">결정사항</span>
                          </div>
                          <Textarea
                            className="text-sm resize-none bg-white border-gray-200 focus:border-purple-400 rounded-xl"
                            rows={3}
                            value={editDecision}
                            onChange={(e) => setEditDecision(e.target.value)}
                            placeholder="이 이슈에 대한 결정사항을 입력하세요..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveDecision(issue.id); }
                              if (e.key === 'Escape') setEditDecisionId(null);
                            }}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => setEditDecisionId(null)}>
                              취소
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                              disabled={saving}
                              onClick={() => saveDecision(issue.id)}
                            >
                              <Check className="h-3 w-3" /> {saving ? '저장 중...' : '저장'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditDecision(issue)}
                          className="cursor-pointer rounded-xl hover:bg-purple-50/50 p-3 -m-3 transition-all duration-200 group/dec"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Scale className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600">결정사항</span>
                          </div>
                          {issue.decision ? (
                            <div className="rounded-lg bg-purple-50 border border-purple-100 p-2.5">
                              <p className="text-sm text-purple-800 whitespace-pre-wrap leading-relaxed">
                                {issue.decision}
                              </p>
                              {issue.decision_at && (
                                <p className="text-xs text-purple-400 mt-1">
                                  {new Date(issue.decision_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 결정
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">클릭하여 결정사항을 입력하세요...</p>
                          )}
                          <Pencil className="h-3 w-3 text-gray-300 mt-1 opacity-0 group-hover/dec:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="border-t border-gray-100 pt-3 flex justify-end">
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        이슈 삭제
                      </button>
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
