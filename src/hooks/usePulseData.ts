'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchUsers,
  fetchTeams,
  fetchWeeklyReports,
  fetchIssues,
  fetchActionItems,
  fetchDecisionLogs,
} from '@/lib/queries';
import type {
  DbUser,
  DbTeam,
  DbWeeklyReport,
  DbIssue,
  DbActionItem,
  DbDecisionLog,
} from '@/types/database';

interface PulseData {
  users: DbUser[];
  teams: DbTeam[];
  reports: DbWeeklyReport[];
  issues: DbIssue[];
  actions: DbActionItem[];
  decisions: DbDecisionLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePulseData(): PulseData {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [teams, setTeams] = useState<DbTeam[]>([]);
  const [reports, setReports] = useState<DbWeeklyReport[]>([]);
  const [issues, setIssues] = useState<DbIssue[]>([]);
  const [actions, setActions] = useState<DbActionItem[]>([]);
  const [decisions, setDecisions] = useState<DbDecisionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, t, r, i, a, d] = await Promise.all([
        fetchUsers(),
        fetchTeams(),
        fetchWeeklyReports(),
        fetchIssues(),
        fetchActionItems(),
        fetchDecisionLogs(),
      ]);
      setUsers(u);
      setTeams(t);
      setReports(r);
      setIssues(i);
      setActions(a);
      setDecisions(d);
    } catch (err: unknown) {
      console.error('[PULSE] fetch error', err);
      // Supabase error 객체 전체 정보 추출
      const errObj = err as Record<string, unknown> | null;
      const parts: string[] = [];
      if (errObj && typeof errObj === 'object') {
        if (errObj.message) parts.push(`message: ${errObj.message}`);
        if (errObj.code) parts.push(`code: ${errObj.code}`);
        if (errObj.details) parts.push(`details: ${errObj.details}`);
        if (errObj.hint) parts.push(`hint: ${errObj.hint}`);
        if (errObj.statusCode) parts.push(`statusCode: ${errObj.statusCode}`);
      }
      if (parts.length === 0) {
        parts.push(err instanceof Error ? err.message : JSON.stringify(err));
      }
      setError(parts.join('\n'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { users, teams, reports, issues, actions, decisions, loading, error, refresh: load };
}
