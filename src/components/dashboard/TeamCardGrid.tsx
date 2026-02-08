'use client';

import TeamCard from './TeamCard';
import { useFilterStore } from '@/stores/useFilterStore';
import type { DbTeam, DbIssue } from '@/types/database';

interface Props {
  teams: DbTeam[];
  issues: DbIssue[];
}

export default function TeamCardGrid({ teams, issues }: Props) {
  const { searchQuery } = useFilterStore();

  let filtered = [...teams];

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((t) => {
      const teamIssues = issues.filter((i) => i.team_id === t.id);
      return (
        t.name.toLowerCase().includes(q) ||
        t.leader_name?.toLowerCase().includes(q) ||
        teamIssues.some((i) => i.title.toLowerCase().includes(q))
      );
    });
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        조건에 맞는 팀이 없습니다
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((t) => (
        <TeamCard
          key={t.id}
          team={t}
          issues={issues}
        />
      ))}
    </div>
  );
}
