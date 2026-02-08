export function getStreakMessage(streak: number): string {
  if (streak >= 12) return '🏆 레전드! 12주 연속 업데이트!';
  if (streak >= 8) return '🔥 대단해요! 8주 연속!';
  if (streak >= 4) return '💪 꾸준함이 힘! 4주 연속!';
  if (streak >= 2) return '👍 좋은 흐름! 연속 기록 유지 중';
  if (streak === 1) return '✅ 이번 주 업데이트 완료';
  return '⏳ 아직 이번 주 업데이트가 없어요';
}

export const RISK_TAG_OPTIONS = [
  '일정',
  '품질',
  '인력',
  '비용',
  '고객',
  '법무',
  '기술',
  '보안',
] as const;
