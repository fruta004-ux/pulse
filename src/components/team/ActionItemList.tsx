'use client';

import { useState } from 'react';
import { getTeamActions } from '@/lib/statusCalc';
import {
  createActionItem,
  updateActionItem,
  toggleActionDone,
  deleteActionItem,
  addActionHistory,
  updateActionHistory,
  deleteActionHistory,
  fetchActionHistory,
} from '@/lib/queries';
import type { DbActionItem, DbActionHistory, DbUser } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Check,
  Circle,
  Plus,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  CheckSquare,
  Pencil,
  X,
} from 'lucide-react';

interface Props {
  actions: DbActionItem[];
  teamId: string;
  users: DbUser[];
  onRefresh: () => Promise<void>;
}

export default function ActionItemList({ actions, teamId, users, onRefresh }: Props) {
  const teamActions = getTeamActions(actions, teamId);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, DbActionHistory[]>>({});
  const [historyInput, setHistoryInput] = useState('');
  const [sendingHistory, setSendingHistory] = useState(false);

  // 할 일 인라인 수정
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemAssignee, setEditItemAssignee] = useState('');
  const [editItemDueDate, setEditItemDueDate] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // 진행 기록 수정
  const [editHistoryId, setEditHistoryId] = useState<string | null>(null);
  const [editHistoryContent, setEditHistoryContent] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);

  // ── 할 일 CRUD ──────────────────────────────

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createActionItem({
        team_id: teamId,
        title: newTitle.trim(),
        assignee_name: newAssignee.trim(),
        due_date: newDueDate || null,
      });
      setNewTitle('');
      setNewAssignee('');
      setNewDueDate('');
      setShowCreate(false);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] create action error', err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (item: DbActionItem) => {
    try {
      await toggleActionDone(item.id, item.done_at);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] toggle error', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await deleteActionItem(id);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] delete action error', err);
    }
  };

  // 할 일 수정 시작
  const startEditItem = (item: DbActionItem) => {
    setEditItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemAssignee(item.assignee_name ?? '');
    setEditItemDueDate(item.due_date ?? '');
  };

  const cancelEditItem = () => {
    setEditItemId(null);
    setEditItemTitle('');
    setEditItemAssignee('');
    setEditItemDueDate('');
  };

  const saveEditItem = async (id: string) => {
    if (!editItemTitle.trim()) return;
    setSavingItem(true);
    try {
      await updateActionItem(id, {
        title: editItemTitle.trim(),
        assignee_name: editItemAssignee.trim(),
        due_date: editItemDueDate || null,
      });
      setEditItemId(null);
      await onRefresh();
    } catch (err) {
      console.error('[PULSE] update action error', err);
    } finally {
      setSavingItem(false);
    }
  };

  // ── 진행 기록 ──────────────────────────────

  const loadHistory = async (actionItemId: string) => {
    try {
      const history = await fetchActionHistory(actionItemId);
      setHistoryMap((prev) => ({ ...prev, [actionItemId]: history }));
    } catch (err) {
      console.error('[PULSE] fetch history error', err);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadHistory(id);
    }
    setHistoryInput('');
    setEditHistoryId(null);
  };

  const handleAddHistory = async (actionItemId: string) => {
    if (!historyInput.trim()) return;
    setSendingHistory(true);
    try {
      await addActionHistory(actionItemId, historyInput.trim());
      setHistoryInput('');
      await loadHistory(actionItemId);
    } catch (err) {
      console.error('[PULSE] add history error', err);
    } finally {
      setSendingHistory(false);
    }
  };

  // 진행 기록 수정
  const startEditHistory = (h: DbActionHistory) => {
    setEditHistoryId(h.id);
    setEditHistoryContent(h.content);
  };

  const cancelEditHistory = () => {
    setEditHistoryId(null);
    setEditHistoryContent('');
  };

  const saveEditHistory = async (historyId: string, actionItemId: string) => {
    if (!editHistoryContent.trim()) return;
    setSavingHistory(true);
    try {
      await updateActionHistory(historyId, editHistoryContent.trim());
      setEditHistoryId(null);
      await loadHistory(actionItemId);
    } catch (err) {
      console.error('[PULSE] update history error', err);
    } finally {
      setSavingHistory(false);
    }
  };

  // 진행 기록 삭제
  const handleDeleteHistory = async (historyId: string, actionItemId: string) => {
    if (!confirm('기록을 삭제하시겠습니까?')) return;
    try {
      await deleteActionHistory(historyId);
      await loadHistory(actionItemId);
    } catch (err) {
      console.error('[PULSE] delete history error', err);
    }
  };

  const completed = teamActions.filter((a) => a.done_at).length;
  const total = teamActions.length;

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-lg text-gray-900">할 일</h3>
          {total > 0 && (
            <span className="text-sm text-gray-500">
              {completed}/{total}
              <span className="ml-1 text-blue-600 font-semibold">
                ({Math.round((completed / total) * 100)}%)
              </span>
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 rounded-lg border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="h-3.5 w-3.5" /> 할 일 추가
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border-b border-blue-100 bg-blue-50/30 px-5 py-4 space-y-3">
          <Input
            className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
            placeholder="할 일 제목 *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
              placeholder="담당자"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
            />
            <Input
              className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
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
              {creating ? '저장 중...' : '추가'}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-gray-100">
        {teamActions.length === 0 && !showCreate ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            등록된 할 일이 없습니다
          </div>
        ) : (
          teamActions.map((item) => {
            const isExpanded = expandedId === item.id;
            const isEditing = editItemId === item.id;
            const history = historyMap[item.id] ?? [];
            return (
              <div key={item.id} className={cn(
                'transition-colors duration-200',
                item.done_at ? 'bg-green-50/50' : 'hover:bg-gray-50/50'
              )}>
                {/* Row */}
                <div className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => handleToggle(item)}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
                      item.done_at
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 hover:border-blue-400'
                    )}
                  >
                    {item.done_at ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3 text-transparent" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      /* 수정 모드 */
                      <div className="space-y-2">
                        <Input
                          className="h-8 text-sm font-medium bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                          value={editItemTitle}
                          onChange={(e) => setEditItemTitle(e.target.value)}
                          autoFocus
                          placeholder="할 일 제목 *"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); saveEditItem(item.id); }
                            if (e.key === 'Escape') cancelEditItem();
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            className="h-7 text-xs bg-white border-gray-200 focus:border-blue-400 rounded-lg flex-1"
                            value={editItemAssignee}
                            onChange={(e) => setEditItemAssignee(e.target.value)}
                            placeholder="담당자"
                          />
                          <Input
                            className="h-7 text-xs bg-white border-gray-200 focus:border-blue-400 rounded-lg w-36"
                            type="date"
                            value={editItemDueDate}
                            onChange={(e) => setEditItemDueDate(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={cancelEditItem}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => saveEditItem(item.id)}
                            disabled={savingItem || !editItemTitle.trim()}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 보기 모드 — 더블클릭으로 수정 */
                      <div
                        className="cursor-pointer"
                        onDoubleClick={() => startEditItem(item)}
                      >
                        <p className={cn('text-sm font-medium', item.done_at ? 'text-gray-400 line-through' : 'text-gray-800')}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          {item.assignee_name && <span>{item.assignee_name}</span>}
                          {item.due_date && (
                            <span>· {new Date(item.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditItem(item)}
                        className="rounded-lg p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="수정"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="히스토리"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* History Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 mx-5 py-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-500">진행 기록</p>

                    <div className="flex gap-2">
                      <Input
                        placeholder="진행 내용을 기록하세요..."
                        className="flex-1 h-9 text-sm bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                        value={historyInput}
                        onChange={(e) => setHistoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddHistory(item.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        disabled={!historyInput.trim() || sendingHistory}
                        onClick={() => handleAddHistory(item.id)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {history.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">아직 기록이 없습니다</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {history.map((h) => {
                          const isEditingH = editHistoryId === h.id;
                          return (
                            <div key={h.id} className="group/hist flex gap-2.5 rounded-lg hover:bg-gray-50 p-1.5 -mx-1.5 transition-colors duration-200">
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                {isEditingH ? (
                                  /* 진행 기록 수정 모드 */
                                  <div className="space-y-1.5">
                                    <Input
                                      className="h-8 text-sm bg-white border-gray-200 focus:border-blue-400 rounded-lg"
                                      value={editHistoryContent}
                                      onChange={(e) => setEditHistoryContent(e.target.value)}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); saveEditHistory(h.id, item.id); }
                                        if (e.key === 'Escape') cancelEditHistory();
                                      }}
                                    />
                                    <div className="flex justify-end gap-1">
                                      <button
                                        onClick={cancelEditHistory}
                                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => saveEditHistory(h.id, item.id)}
                                        disabled={savingHistory || !editHistoryContent.trim()}
                                        className="text-blue-600 hover:text-blue-700 p-0.5 rounded transition-colors"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* 진행 기록 보기 모드 */
                                  <>
                                    <p className="text-sm text-gray-700">{h.content}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {new Date(h.created_at).toLocaleDateString('ko-KR', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </>
                                )}
                              </div>
                              {/* 수정/삭제 버튼 — hover 시 노출 */}
                              {!isEditingH && (
                                <div className="flex items-start gap-0.5 shrink-0 opacity-0 group-hover/hist:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditHistory(h)}
                                    className="rounded p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                    title="수정"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHistory(h.id, item.id)}
                                    className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                                    title="삭제"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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
