'use client';

import type { DbTeam } from '@/types/database';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface Props {
  team: DbTeam;
}

export default function TeamHeader({ team }: Props) {
  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-lg">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-3 transition-colors duration-200">
        <ArrowLeft className="h-4 w-4" /> 대시보드
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {team.leader_name && `팀장: ${team.leader_name}`}
            {team.member_count > 0 && ` · ${team.member_count}명`}
          </p>
        </div>
      </div>
      {team.description && (
        <p className="text-sm text-gray-500 mt-3 pl-[52px]">{team.description}</p>
      )}
    </div>
  );
}
