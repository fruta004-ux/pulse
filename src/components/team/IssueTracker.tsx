'use client';

import { useState, useRef, useCallback, type ClipboardEvent } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getTeamIssues } from '@/lib/statusCalc';
import { createIssue, updateIssue, deleteIssue, uploadIssueImage } from '@/lib/queries';
import type { DbIssue, DbUser, IssueImpact, IssueState, IssueCategory } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
  ImagePlus,
  Loader2,
  Megaphone,
  CalendarIcon,
  Circle,
  Clock,
  Play,
  Pause,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

interface Props {
  issues: DbIssue[];
  teamId: string;
  users: DbUser[];
  onRefresh: () => Promise<void>;
}

const impactConfig: Record<IssueImpact, { label: string; color: string; bgColor: string; iconColor: string; order: number; icon: React.ReactNode }> = {
  high: { label: '높음', color: 'bg-red-50 text-red-600 border border-red-100', bgColor: 'bg-red-500', iconColor: 'text-red-500', order: 0, icon: <ArrowUp className="h-3 w-3" /> },
  medium: { label: '중간', color: 'bg-amber-50 text-amber-600 border border-amber-100', bgColor: 'bg-amber-500', iconColor: 'text-amber-500', order: 1, icon: <ArrowRight className="h-3 w-3" /> },
  low: { label: '낮음', color: 'bg-gray-50 text-gray-500 border border-gray-100', bgColor: 'bg-gray-400', iconColor: 'text-gray-400', order: 2, icon: <ArrowDown className="h-3 w-3" /> },
};

const stateConfig: Record<IssueState, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  open: { label: '상태', color: 'bg-slate-100 text-slate-600', bgColor: 'bg-slate-500', icon: <Circle className="h-3.5 w-3.5" /> },
  waiting: { label: '대기', color: 'bg-orange-50 text-orange-600', bgColor: 'bg-orange-500', icon: <Pause className="h-3.5 w-3.5" /> },
  in_progress: { label: '진행중', color: 'bg-blue-50 text-blue-600', bgColor: 'bg-blue-500', icon: <Play className="h-3.5 w-3.5" /> },
  resolved: { label: '완료', color: 'bg-green-50 text-green-600', bgColor: 'bg-green-500', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const STATE_CHANGE_OPTIONS: IssueState[] = ['waiting', 'in_progress', 'resolved'];
const IMPACT_OPTIONS: IssueImpact[] = ['high', 'medium', 'low'];

const categoryConfig: Record<IssueCategory, { label: string; color: string; icon: React.ReactNode }> = {
  briefing: { label: '브리핑', color: 'bg-blue-50 text-blue-600', icon: <Megaphone className="h-3 w-3" /> },
  decision: { label: '의사결정', color: 'bg-purple-50 text-purple-600', icon: <Scale className="h-3 w-3" /> },
};
const CATEGORY_OPTIONS: IssueCategory[] = ['briefing', 'decision'];

function getImpactConfig(impact: IssueImpact | null | undefined) {
  return impactConfig[impact ?? 'medium'] ?? impactConfig.medium;
}
function getStateConfig(state: IssueState | null | undefined) {
  return stateConfig[state ?? 'open'] ?? stateConfig.open;
}
function getCategoryConfig(category: IssueCategory | null | undefined) {
  return categoryConfig[category ?? 'briefing'] ?? categoryConfig.briefing;
}

type TabType = 'briefing' | 'decision' | 'waiting' | 'in_progress' | 'resolved';

const tabConfig: Record<TabType, { label: string; icon: React.ReactNode; activeColor: string; barColor: string; countColor: string; countActiveColor: string }> = {
  briefing: {
    label: '브리핑',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    activeColor: 'text-blue-700',
    barColor: 'bg-blue-600',
    countColor: 'bg-gray-100 text-gray-500',
    countActiveColor: 'bg-blue-100 text-blue-700',
  },
  decision: {
    label: '의사결정',
    icon: <Scale className="h-3.5 w-3.5" />,
    activeColor: 'text-purple-700',
    barColor: 'bg-purple-600',
    countColor: 'bg-gray-100 text-gray-500',
    countActiveColor: 'bg-purple-100 text-purple-700',
  },
  waiting: {
    label: '대기',
    icon: <Pause className="h-3.5 w-3.5" />,
    activeColor: 'text-orange-700',
    barColor: 'bg-orange-500',
    countColor: 'bg-gray-100 text-gray-500',
    countActiveColor: 'bg-orange-100 text-orange-700',
  },
  in_progress: {
    label: '진행중',
    icon: <Play className="h-3.5 w-3.5" />,
    activeColor: 'text-sky-700',
    barColor: 'bg-sky-500',
    countColor: 'bg-gray-100 text-gray-500',
    countActiveColor: 'bg-sky-100 text-sky-700',
  },
  resolved: {
    label: '완료',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    activeColor: 'text-green-700',
    barColor: 'bg-green-600',
    countColor: 'bg-gray-100 text-gray-500',
    countActiveColor: 'bg-green-100 text-green-700',
  },
};

function sortByImpact(issues: DbIssue[]): DbIssue[] {
  return [...issues].sort((a, b) => getImpactConfig(a.impact).order - getImpactConfig(b.impact).order);
}

export default function IssueTracker({ issues, teamId, users, onRefresh }: Props) {
  const teamIssues = getTeamIssues(issues, teamId);
  const briefingIssues = sortByImpact(teamIssues.filter((i) => i.state === 'open' && (i.category ?? 'briefing') === 'briefing'));
  const decisionIssues = sortByImpact(teamIssues.filter((i) => i.state === 'open' && (i.category ?? 'briefing') === 'decision'));
  const waitingIssues = sortByImpact(teamIssues.filter((i) => i.state === 'waiting'));
  const inProgressIssues = sortByImpact(teamIssues.filter((i) => i.state === 'in_progress'));
  const resolvedIssues = sortByImpact(teamIssues.filter((i) => i.state === 'resolved'));

  const [tab, setTab] = useState<TabType>('briefing');
  const displayIssues =
    tab === 'briefing' ? briefingIssues : tab === 'decision' ? decisionIssues : tab === 'waiting' ? waitingIssues : tab === 'in_progress' ? inProgressIssues : resolvedIssues;

  const tabCounts: Record<TabType, number> = {
    briefing: briefingIssues.length,
    decision: decisionIssues.length,
    waiting: waitingIssues.length,
    in_progress: inProgressIssues.length,
    resolved: resolvedIssues.length,
  };

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newImpact, setNewImpact] = useState<IssueImpact>('medium');
  const [newCategory, setNewCategory] = useState<IssueCategory>('briefing');
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editTitleId, setEditTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [editDescId, setEditDescId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  const [editDecisionId, setEditDecisionId] = useState<string | null>(null);
  const [editDecision, setEditDecision] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageTargetIssueId, setImageTargetIssueId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleUploadImages = useCallback(async (issueId: string, files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setUploading(issueId);
    try {
      const urls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadIssueImage(file);
        urls.push(url);
      }
      const issue = teamIssues.find((i) => i.id === issueId);
      const existing = issue?.images ?? [];
      await updateIssue(issueId, { images: [...existing, ...urls] });
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] upload image error', err);
    } finally {
      setUploading(null);
    }
  }, [teamIssues, onRefresh]);

  const handlePaste = useCallback((issueId: string, e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleUploadImages(issueId, imageFiles);
    }
  }, [handleUploadImages]);

  const handleRemoveImage = async (issueId: string, imageUrl: string) => {
    const issue = teamIssues.find((i) => i.id === issueId);
    if (!issue) return;
    const updated = (issue.images ?? []).filter((url) => url !== imageUrl);
    try {
      await updateIssue(issueId, { images: updated });
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] remove image error', err);
    }
  };

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
        category: newCategory,
        due_date: newDueDate ? `${newDueDate.getFullYear()}-${String(newDueDate.getMonth() + 1).padStart(2, '0')}-${String(newDueDate.getDate()).padStart(2, '0')}` : null,
      });
      setNewTitle('');
      setNewDesc('');
      setNewAssignee('');
      setNewImpact('medium');
      setNewCategory('briefing');
      setNewDueDate(null);
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

  const handleImpactChange = async (issue: DbIssue, newImpact: IssueImpact) => {
    try {
      await updateIssue(issue.id, { impact: newImpact });
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update impact error', err);
    }
  };

  const handleCategoryChange = async (issue: DbIssue, newCat: IssueCategory) => {
    try {
      await updateIssue(issue.id, { category: newCat });
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update category error', err);
    }
  };

  const handleDueDateChange = async (issueId: string, date: Date | null) => {
    try {
      await updateIssue(issueId, { due_date: date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : undefined });
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update due_date error', err);
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
      await updateIssue(issueId, { decision: editDecision.trim() || undefined });
      setEditDecisionId(null);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update decision error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (imageTargetIssueId && e.target.files) {
            handleUploadImages(imageTargetIssueId, Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-xl text-gray-900">이슈 트래커</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-sm gap-1.5 rounded-lg border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
          onClick={() => { setShowCreate(!showCreate); }}
        >
          <Plus className="h-4 w-4" /> 이슈 추가
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['briefing', 'decision', 'waiting', 'in_progress', 'resolved'] as TabType[]).map((t) => {
          const cfg = tabConfig[t];
          const isActive = tab === t;
          const count = tabCounts[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center transition-all duration-200 relative',
                isActive ? cfg.activeColor : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {cfg.icon}
                {cfg.label}
                {count > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold min-w-[20px]',
                    isActive ? cfg.countActiveColor : cfg.countColor
                  )}>
                    {count}
                  </span>
                )}
              </span>
              {isActive && <div className={cn('absolute bottom-0 left-4 right-4 h-0.5 rounded-full', cfg.barColor)} />}
            </button>
          );
        })}
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
          <div className="grid grid-cols-2 gap-3">
            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as IssueCategory)}
            >
              <option value="briefing">현황 브리핑</option>
              <option value="decision">의사결정 필요</option>
            </select>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-left flex items-center gap-2 hover:border-blue-300 transition-colors w-full',
                    !newDueDate && 'text-gray-400'
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  {newDueDate
                    ? format(newDueDate, 'yyyy.MM.dd', { locale: ko })
                    : '마감일 선택'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <Calendar selected={newDueDate} onSelect={setNewDueDate} />
              </PopoverContent>
            </Popover>
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
            {tab === 'briefing' ? '브리핑 이슈가 없습니다' : tab === 'decision' ? '의사결정 필요 이슈가 없습니다' : tab === 'waiting' ? '대기중인 이슈가 없습니다' : tab === 'in_progress' ? '진행중인 이슈가 없습니다' : '완료된 이슈가 없습니다'}
          </div>
        ) : (
          displayIssues.map((issue, idx) => {
            const isExpanded = expandedId === issue.id;
            const isEditingTitle = editTitleId === issue.id;
            const isEditingDesc = editDescId === issue.id;
            const isEditingDecision = editDecisionId === issue.id;
            const isUploading = uploading === issue.id;
            const issueImages = issue.images ?? [];
            const seqNum = idx + 1;

            return (
              <div
                key={issue.id}
                className="hover:bg-gray-50/50 transition-colors duration-200"
                onPaste={(e) => { if (isExpanded) handlePaste(issue.id, e); }}
              >
                {/* Row Header */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  {/* 순번 */}
                  <span className="text-sm font-bold text-gray-400 w-5 text-center shrink-0">
                    {seqNum}
                  </span>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                    className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className={cn(
                    'h-2.5 w-2.5 rounded-full shrink-0 transition-transform hover:scale-125',
                    getImpactConfig(issue.impact).bgColor
                  )} />

                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-9 text-base font-medium bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); saveTitle(issue.id); }
                            if (e.key === 'Escape') setEditTitleId(null);
                          }}
                        />
                        <button onClick={() => saveTitle(issue.id)} disabled={saving || !editTitle.trim()} className="text-blue-600 hover:text-blue-700 shrink-0">
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
                          'text-base font-medium',
                          issue.state === 'resolved' ? 'text-gray-400 line-through' : 'text-gray-800'
                        )}>
                          {issue.title}
                        </p>
                        {!isExpanded && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {issue.description && <p className="text-sm text-gray-400 line-clamp-1">{issue.description}</p>}
                            {issueImages.length > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
                                <ImagePlus className="h-3 w-3" /> {issueImages.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {issue.decision && (
                      <span className="rounded-full bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                        <Scale className="h-3 w-3" /> 결정
                      </span>
                    )}
                    {/* Priority selector */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1',
                            getImpactConfig(issue.impact).color,
                            'hover:ring-' + ((issue.impact ?? 'medium') === 'high' ? 'red' : (issue.impact ?? 'medium') === 'medium' ? 'amber' : 'gray') + '-200'
                          )}
                        >
                          {getImpactConfig(issue.impact).icon}
                          {getImpactConfig(issue.impact).label}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-1" align="end">
                        <div className="flex flex-col gap-0.5">
                          {IMPACT_OPTIONS.map((impact) => (
                            <button
                              key={impact}
                              onClick={() => handleImpactChange(issue, impact)}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors w-full text-left',
                                (issue.impact ?? 'medium') === impact ? getImpactConfig(impact).color : 'hover:bg-gray-100 text-gray-600'
                              )}
                            >
                              {getImpactConfig(impact).icon}
                              {getImpactConfig(impact).label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {/* Category selector */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1',
                            getCategoryConfig(issue.category).color
                          )}
                        >
                          {getCategoryConfig(issue.category).icon}
                          {getCategoryConfig(issue.category).label}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-1" align="end">
                        <div className="flex flex-col gap-0.5">
                          {CATEGORY_OPTIONS.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => handleCategoryChange(issue, cat)}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors w-full text-left',
                                (issue.category ?? 'briefing') === cat ? getCategoryConfig(cat).color : 'hover:bg-gray-100 text-gray-600'
                              )}
                            >
                              {getCategoryConfig(cat).icon}
                              {getCategoryConfig(cat).label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {/* State selector */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1',
                            getStateConfig(issue.state).color
                          )}
                        >
                          {getStateConfig(issue.state).icon}
                          {getStateConfig(issue.state).label}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-1" align="end">
                        <div className="flex flex-col gap-0.5">
                          {STATE_CHANGE_OPTIONS.map((state) => (
                            <button
                              key={state}
                              onClick={() => handleStateChange(issue, state)}
                              className={cn(
                                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors w-full text-left',
                                (issue.state ?? 'open') === state ? getStateConfig(state).color : 'hover:bg-gray-100 text-gray-600'
                              )}
                            >
                              {getStateConfig(state).icon}
                              {getStateConfig(state).label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Meta */}
                <div className="px-5 pb-2 pl-16 flex items-center gap-3 flex-wrap">
                  {issue.assignee_name && (
                    <span className="text-sm text-gray-400">담당: {issue.assignee_name}</span>
                  )}
                  {/* Due date with calendar */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-1 text-sm rounded-md px-2 py-0.5 transition-colors',
                          issue.due_date
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {issue.due_date
                          ? format(new Date(issue.due_date), 'M월 d일', { locale: ko })
                          : '날짜 지정'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <Calendar
                        selected={issue.due_date ? new Date(issue.due_date) : null}
                        onSelect={(date) => handleDueDateChange(issue.id, date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 mx-5 py-4 pl-11 space-y-4">
                    {/* Description */}
                    {isEditingDesc ? (
                      <div className="space-y-2">
                        <Textarea
                          className="text-base resize-none bg-white border-gray-200 focus:border-blue-400 rounded-xl"
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
                          <Button variant="ghost" size="sm" className="h-8 text-sm rounded-lg" onClick={() => setEditDescId(null)}>취소</Button>
                          <Button size="sm" className="h-8 text-sm gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={saving} onClick={() => saveDesc(issue.id)}>
                            <Check className="h-3.5 w-3.5" /> {saving ? '저장 중...' : '저장'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEditDesc(issue)}
                        className="cursor-pointer rounded-xl hover:bg-gray-50 p-3 -m-3 transition-all duration-200 group/desc"
                      >
                        <p className="text-sm font-semibold text-gray-500 mb-1">내용</p>
                        {issue.description ? (
                          <p className="text-base text-gray-600 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
                        ) : (
                          <p className="text-base text-gray-400 italic">클릭하여 내용을 추가하세요...</p>
                        )}
                        <Pencil className="h-3.5 w-3.5 text-gray-300 mt-1.5 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
                      </div>
                    )}

                    {/* Images */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <ImagePlus className="h-4 w-4 text-teal-500" />
                          <span className="text-sm font-semibold text-teal-600">
                            첨부 이미지 {issueImages.length > 0 && `(${issueImages.length})`}
                          </span>
                        </div>
                        <button
                          onClick={() => { setImageTargetIssueId(issue.id); fileInputRef.current?.click(); }}
                          disabled={isUploading}
                          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          {isUploading ? '업로드 중...' : '이미지 추가'}
                        </button>
                      </div>

                      {issueImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {issueImages.map((url, imgIdx) => (
                            <div key={imgIdx} className="relative group/img rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                              <img
                                src={url}
                                alt={`첨부 ${imgIdx + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setPreviewImage(url)}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(issue.id, url); }}
                                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-400">
                        Ctrl+V로 클립보드 이미지를 바로 붙여넣을 수 있습니다
                      </p>
                    </div>

                    {/* Decision */}
                    <div className="border-t border-gray-100 pt-4">
                      {isEditingDecision ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Scale className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-semibold text-purple-600">결정사항</span>
                          </div>
                          <Textarea
                            className="text-base resize-none bg-white border-gray-200 focus:border-purple-400 rounded-xl"
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
                            <Button variant="ghost" size="sm" className="h-8 text-sm rounded-lg" onClick={() => setEditDecisionId(null)}>취소</Button>
                            <Button size="sm" className="h-8 text-sm gap-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg" disabled={saving} onClick={() => saveDecision(issue.id)}>
                              <Check className="h-3.5 w-3.5" /> {saving ? '저장 중...' : '저장'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditDecision(issue)}
                          className="cursor-pointer rounded-xl hover:bg-purple-50/50 p-3 -m-3 transition-all duration-200 group/dec"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Scale className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-semibold text-purple-600">결정사항</span>
                          </div>
                          {issue.decision ? (
                            <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                              <p className="text-base text-purple-800 whitespace-pre-wrap leading-relaxed">{issue.decision}</p>
                              {issue.decision_at && (
                                <p className="text-sm text-purple-400 mt-1">
                                  {new Date(issue.decision_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 결정
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-base text-gray-400 italic">클릭하여 결정사항을 입력하세요...</p>
                          )}
                          <Pencil className="h-3.5 w-3.5 text-gray-300 mt-1.5 opacity-0 group-hover/dec:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="border-t border-gray-100 pt-4 flex justify-end">
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
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
