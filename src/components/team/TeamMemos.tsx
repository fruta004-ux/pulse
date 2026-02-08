'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTeamMemos,
  createTeamMemo,
  updateTeamMemo,
  toggleMemoPinned,
  deleteTeamMemo,
} from '@/lib/queries';
import type { DbTeamMemo } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Pin, PinOff, Trash2, Send, StickyNote, Check, X } from 'lucide-react';

interface Props {
  teamId: string;
}

export default function TeamMemos({ teamId }: Props) {
  const [memos, setMemos] = useState<DbTeamMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTeamMemos(teamId);
      setMemos(data);
    } catch (err) {
      console.error('[PULSE] fetch memos error', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      await createTeamMemo(teamId, input.trim());
      setInput('');
      await load();
    } catch (err) {
      console.error('[PULSE] create memo error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (memo: DbTeamMemo) => {
    setEditingId(memo.id);
    setEditContent(memo.content);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    setSaving(true);
    try {
      await updateTeamMemo(editingId, editContent.trim());
      setEditingId(null);
      await load();
    } catch (err) {
      console.error('[PULSE] update memo error', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async (memo: DbTeamMemo) => {
    try {
      await toggleMemoPinned(memo.id, memo.pinned);
      await load();
    } catch (err) {
      console.error('[PULSE] pin memo error', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    try {
      await deleteTeamMemo(id);
      await load();
    } catch (err) {
      console.error('[PULSE] delete memo error', err);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <StickyNote className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-lg text-gray-900">메모</h3>
        <span className="text-sm text-gray-400">{memos.length}개</span>
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex gap-2">
          <Textarea
            placeholder="팀 현황, 공유사항, 특이사항 등을 자유롭게 기록하세요..."
            className="flex-1 min-h-[60px] text-sm resize-none bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
          <Button
            className="self-end bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            disabled={!input.trim() || submitting}
            onClick={handleCreate}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Ctrl+Enter로 빠르게 등록</p>
      </div>

      {/* Memo List */}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : memos.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          아직 메모가 없습니다
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {memos.map((memo) => {
            const isEditing = editingId === memo.id;

            return (
              <div
                key={memo.id}
                className={cn(
                  'group relative px-5 py-4 hover:bg-gray-50/50 transition-colors duration-200',
                  memo.pinned && 'bg-amber-50/30'
                )}
              >
                {memo.pinned && (
                  <div className="absolute top-3 right-5">
                    <Pin className="h-3.5 w-3.5 text-amber-400 fill-amber-400 rotate-[-30deg]" />
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={editRef}
                      className="text-sm resize-none bg-white border-gray-200 focus:border-blue-400 rounded-xl"
                      rows={4}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={cancelEdit}>
                        <X className="h-3 w-3" /> 취소
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        disabled={!editContent.trim() || saving}
                        onClick={saveEdit}
                      >
                        <Check className="h-3 w-3" /> {saving ? '저장 중...' : '저장'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      onClick={() => startEdit(memo)}
                      className="cursor-pointer rounded-xl hover:bg-gray-100/50 p-1 -m-1 transition-all duration-200"
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{memo.content}</p>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePin(memo)}
                          className={cn(
                            'rounded-lg p-1 transition-all duration-200',
                            memo.pinned
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-100'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          )}
                          title={memo.pinned ? '고정 해제' : '상단 고정'}
                        >
                          {memo.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(memo.id)}
                          className="rounded-lg p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
