'use client';

import { useState } from 'react';
import { usePulseData } from '@/hooks/usePulseData';
import { createTeam, updateTeam, deleteTeam } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings, Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import type { DbTeam } from '@/types/database';

export default function SettingsPage() {
  const { teams, loading, refresh } = usePulseData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<DbTeam | null>(null);
  const [name, setName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [description, setDescription] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingTeam(null);
    setName('');
    setLeaderName('');
    setDescription('');
    setMemberCount(0);
    setModalOpen(true);
  };

  const openEdit = (team: DbTeam) => {
    setEditingTeam(team);
    setName(team.name);
    setLeaderName(team.leader_name ?? '');
    setDescription(team.description ?? '');
    setMemberCount(team.member_count);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, {
          name: name.trim(),
          leader_name: leaderName.trim(),
          description: description.trim(),
          member_count: memberCount,
        });
      } else {
        await createTeam({
          name: name.trim(),
          leader_name: leaderName.trim(),
          description: description.trim(),
          member_count: memberCount,
        });
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      console.error('[PULSE] team save error', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (team: DbTeam) => {
    if (!confirm(`"${team.name}" 팀을 삭제하시겠습니까?`)) return;
    try {
      await deleteTeam(team.id);
      await refresh();
    } catch (err) {
      console.error('[PULSE] team delete error', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          <Settings className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
      </div>

      {/* 팀 관리 */}
      <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-lg text-gray-900">팀 관리</h2>
          </div>
          <Button
            onClick={openCreate}
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="h-4 w-4" /> 팀 추가
          </Button>
        </div>

        {teams.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm mb-3">등록된 팀이 없습니다</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="gap-1.5 rounded-lg">
              <Plus className="h-4 w-4" /> 첫 팀 만들기
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {teams.map((team) => (
              <div
                key={team.id}
                className="group flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{team.name}</h3>
                    {team.leader_name && (
                      <span className="text-xs text-gray-500">팀장: {team.leader_name}</span>
                    )}
                    {team.member_count > 0 && (
                      <span className="text-xs text-gray-400">{team.member_count}명</span>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{team.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-blue-50"
                    onClick={() => openEdit(team)}
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-red-50"
                    onClick={() => handleDelete(team)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 팀 생성/수정 모달 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {editingTeam ? '팀 수정' : '새 팀 만들기'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                팀 이름 <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                placeholder="예: 개발팀, 마케팅팀"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">팀장 이름</label>
              <Input
                className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                placeholder="팀장 이름"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">인원수</label>
              <Input
                className="h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                type="number"
                min={0}
                value={memberCount}
                onChange={(e) => setMemberCount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">설명</label>
              <Textarea
                className="bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl resize-none"
                placeholder="팀 설명 (선택)"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
            >
              {submitting ? '저장 중...' : editingTeam ? '수정' : '생성'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
