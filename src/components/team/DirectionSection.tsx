'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchTeamDirections,
  createTeamDirection,
  updateTeamDirection,
  deleteTeamDirection,
} from '@/lib/queries';
import type { DbTeamDirection } from '@/types/database';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Compass,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  teamId: string;
}

export default function DirectionSection({ teamId }: Props) {
  const [directions, setDirections] = useState<DbTeamDirection[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchTeamDirections(teamId);
      setDirections(data);
    } catch (err) {
      console.error('[PULSE] fetch directions error', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createTeamDirection(teamId, newTitle.trim(), newContent.trim());
      setNewTitle('');
      setNewContent('');
      setShowCreate(false);
      await load();
    } catch (err) {
      console.error('[PULSE] create direction error', err);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (d: DbTeamDirection) => {
    setEditId(d.id);
    setEditTitle(d.title);
    setEditContent(d.content);
    setExpandedId(d.id);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await updateTeamDirection(id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
      setEditId(null);
      await load();
    } catch (err) {
      console.error('[PULSE] update direction error', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 방향성을 삭제하시겠습니까?')) return;
    try {
      await deleteTeamDirection(id);
      await load();
    } catch (err) {
      console.error('[PULSE] delete direction error', err);
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border-2 border-indigo-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-gray-900">방향성</h3>
          {directions.length > 0 && (
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
              {directions.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border-b border-indigo-100 bg-indigo-50/30 px-3 py-3 space-y-2">
          <Input
            className="h-9 text-sm bg-white border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-lg"
            placeholder="제목 *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            className="bg-white border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-lg resize-none text-xs"
            placeholder="상세 내용"
            rows={2}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex justify-end gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => setShowCreate(false)}>
              취소
            </Button>
            <Button
              size="sm"
              disabled={!newTitle.trim() || creating}
              onClick={handleCreate}
              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              {creating ? '저장 중...' : '추가'}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-gray-100">
        {directions.length === 0 && !showCreate ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">
            등록된 방향성이 없습니다
          </div>
        ) : (
          directions.map((d) => {
            const isExpanded = expandedId === d.id;
            const isEditing = editId === d.id;

            return (
              <div key={d.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                {/* Row */}
                <div
                  className="flex items-start gap-2 px-3 py-2.5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                >
                  <div className="h-2 w-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{d.title}</p>
                    {!isExpanded && d.content && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{d.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(d); }}
                      className="rounded p-0.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                      className="rounded p-0.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 mx-3 py-2.5 pl-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          className="h-8 text-xs font-medium bg-white border-gray-200 focus:border-indigo-400 rounded-lg"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                        />
                        <Textarea
                          className="text-xs resize-none bg-white border-gray-200 focus:border-indigo-400 rounded-lg"
                          rows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="상세 내용"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEdit(d.id); }
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => saveEdit(d.id)}
                            disabled={saving || !editTitle.trim()}
                            className="text-indigo-600 hover:text-indigo-700 p-0.5 rounded hover:bg-indigo-50 transition-all"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEdit(d)}
                        className="cursor-pointer rounded-lg hover:bg-indigo-50/50 p-2 -m-2 transition-all duration-200 group/dir"
                      >
                        {d.content ? (
                          <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {d.content}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">클릭하여 내용 추가...</p>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(d.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
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
