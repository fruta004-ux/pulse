'use client';

import type { DbTeam } from '@/types/database';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface Props {
  team: DbTeam;
}

export default function TeamHeader({ team }: Props) {
  return (
    <div className="flex items-center gap-4">
      <Link href="/" className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 shrink-0">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 shrink-0">
        <Users className="h-5 w-5 text-blue-600" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{team.name}</h1>
          <span className="text-sm text-gray-400 shrink-0">
            {team.leader_name && `${team.leader_name}`}
            {team.member_count > 0 && ` · ${team.member_count}명`}
          </span>
        </div>
        {team.description && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{team.description}</p>
        )}
      </div>
    </div>
  );
}
