'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StatusSelector from './StatusSelector';
import RiskTagPicker from './RiskTagPicker';
import CharCounter from '@/components/layout/CharCounter';
import { useUIStore } from '@/stores/useUIStore';
import { insertReport, insertDecisionLog } from '@/lib/queries';
import { calculateStreak } from '@/lib/statusCalc';
import { getStreakMessage } from '@/data/streakMessages';
import type { TeamStatus, DbWeeklyReport, DbTeam, DbUser } from '@/types/database';

interface Props {
  teams: DbTeam[];
  reports: DbWeeklyReport[];
  users: DbUser[];
  onSuccess: () => Promise<void>;
}

export default function UpdateModal({ teams, reports, users, onSuccess }: Props) {
  const { updateModalOpen, updateModalTeamId, closeUpdateModal } = useUIStore();

  const [status, setStatus] = useState<TeamStatus>('green');
  const [headline, setHeadline] = useState('');
  const [anomaly1, setAnomaly1] = useState('');
  const [anomaly2, setAnomaly2] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [execDecision, setExecDecision] = useState(false);
  const [decisionReason, setDecisionReason] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [riskTags, setRiskTags] = useState<string[]>([]);
  const [links, setLinks] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const teamId = updateModalTeamId ?? selectedTeamId;
  const streak = teamId ? calculateStreak(reports ?? [], teamId) : 0;

  const resetForm = () => {
    setStatus('green');
    setHeadline('');
    setAnomaly1('');
    setAnomaly2('');
    setNextAction('');
    setExecDecision(false);
    setDecisionReason('');
    setOptionA('');
    setOptionB('');
    setDueDate('');
    setRiskTags([]);
    setLinks('');
    setSelectedTeamId('');
  };

  const handleSubmit = async () => {
    if (!teamId || !headline || !nextAction) return;
    setSubmitting(true);
    try {
      const now = new Date();
      const monday = new Date(now);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
      const weekStart = monday.toISOString().slice(0, 10);

      // Find a valid user (first lead or first user)
      const leadUser = users.find((u) => u.team_id === teamId && u.role === 'lead');
      const createdBy = leadUser?.id ?? users[0]?.id ?? '';

      const anomalies = [anomaly1, anomaly2].filter(Boolean);
      const linkArr = links.split('\n').filter(Boolean);

      const report = await insertReport({
        team_id: teamId,
        week_start_date: weekStart,
        status,
        headline,
        anomalies,
        next_action: nextAction,
        exec_decision_needed: execDecision,
        decision_reason: execDecision ? decisionReason : null,
        option_a: execDecision ? optionA : null,
        option_b: execDecision ? optionB : null,
        due_date: execDecision && dueDate ? dueDate : null,
        risk_tags: riskTags,
        links: linkArr,
        created_by: createdBy,
      });

      if (execDecision && decisionReason) {
        await insertDecisionLog({
          team_id: teamId,
          report_id: report.id,
          title: decisionReason.slice(0, 80),
          context: decisionReason,
          option_a: optionA || null,
          option_b: optionB || null,
          recommendation: null,
          decision: null,
          decided_by: null,
          decided_at: null,
          comment: null,
          followup_date: null,
          outcome_note: null,
          state: 'pending',
        });
      }

      resetForm();
      closeUpdateModal();
      await onSuccess();
    } catch (err) {
      console.error('[PULSE] submit error', err);
      alert('업데이트 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={updateModalOpen} onOpenChange={(open) => !open && closeUpdateModal()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">📝 주간 업데이트</DialogTitle>
          <p className="text-sm text-zinc-500">60초 안에 완료하세요 · {getStreakMessage(streak)}</p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Team selector */}
          {!updateModalTeamId && (
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">팀 선택</label>
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">팀을 선택하세요</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">이번 주 상태 *</label>
            <StatusSelector value={status} onChange={setStatus} />
          </div>

          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700">핵심 진행 *</label>
              <CharCounter current={headline.length} max={60} />
            </div>
            <Input
              placeholder="이번 주 가장 중요한 진행 사항 한 줄"
              maxLength={60}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          {/* Anomalies */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700">특이사항 (선택, 최대 2개)</label>
              <CharCounter current={Math.max(anomaly1.length, anomaly2.length)} max={70} />
            </div>
            <div className="space-y-2">
              <Input placeholder="특이사항 1" maxLength={70} value={anomaly1} onChange={(e) => setAnomaly1(e.target.value)} />
              <Input placeholder="특이사항 2" maxLength={70} value={anomaly2} onChange={(e) => setAnomaly2(e.target.value)} />
            </div>
          </div>

          {/* Next action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700">다음 액션 *</label>
              <CharCounter current={nextAction.length} max={70} />
            </div>
            <Input
              placeholder="다음 주에 반드시 해야 할 일 (명령문)"
              maxLength={70}
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
            />
          </div>

          {/* Exec decision */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={execDecision}
                onChange={(e) => setExecDecision(e.target.checked)}
                className="rounded border-zinc-300"
              />
              대표/임원 결정 필요
            </label>
          </div>

          {execDecision && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <Input placeholder="결정이 필요한 이유" value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="선택지 A (50자)" maxLength={50} value={optionA} onChange={(e) => setOptionA(e.target.value)} />
                <Input placeholder="선택지 B (50자)" maxLength={50} value={optionB} onChange={(e) => setOptionB(e.target.value)} />
              </div>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

          {/* Risk tags */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">리스크 태그 (선택)</label>
            <RiskTagPicker selected={riskTags} onChange={setRiskTags} />
          </div>

          {/* Links */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-1.5 block">첨부 링크 (선택)</label>
            <Textarea
              placeholder="링크를 한 줄에 하나씩"
              rows={2}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!teamId || !headline || !nextAction || submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {submitting ? '저장 중...' : '업데이트 제출'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
