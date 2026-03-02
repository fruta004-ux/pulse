'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import type { DbTeam, DbIssue } from '@/types/database';
import { updateTeamPosition } from '@/lib/queries';
import OrgNodeCard from './OrgNodeCard';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  teams: DbTeam[];
  issues: DbIssue[];
  onPositionChange?: () => void;
}

interface DragState {
  teamId: string;
  startX: number;
  startY: number;
  origPosX: number;
  origPosY: number;
}

const CARD_W = 220;
const CARD_H = 140;
const CONNECTOR_OFFSET_TOP = 0;
const CONNECTOR_OFFSET_BOTTOM = CARD_H;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

function autoLayout(teams: DbTeam[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const hasPositions = teams.some((t) => t.pos_x !== 0 || t.pos_y !== 0);
  if (hasPositions) {
    teams.forEach((t) => positions.set(t.id, { x: t.pos_x, y: t.pos_y }));
    return positions;
  }

  const roots = teams.filter((t) => !t.parent_team_id);
  const childrenOf = (parentId: string) =>
    teams.filter((t) => t.parent_team_id === parentId);

  let globalX = 0;

  function layout(teamId: string, depth: number): number {
    const children = childrenOf(teamId);
    if (children.length === 0) {
      const x = globalX;
      positions.set(teamId, { x, y: depth * 200 });
      globalX += CARD_W + 60;
      return x;
    }

    const childXs = children.map((c) => layout(c.id, depth + 1));
    const minX = Math.min(...childXs);
    const maxX = Math.max(...childXs);
    const centerX = (minX + maxX) / 2;
    positions.set(teamId, { x: centerX, y: depth * 200 });
    return centerX;
  }

  roots.forEach((root) => {
    layout(root.id, 0);
    globalX += 100;
  });

  const orphans = teams.filter(
    (t) => !positions.has(t.id)
  );
  orphans.forEach((t) => {
    positions.set(t.id, { x: globalX, y: 0 });
    globalX += CARD_W + 60;
  });

  return positions;
}

export default function OrgCanvas({ teams, issues, onPositionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    () => autoLayout(teams)
  );
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPositions(autoLayout(teams));
  }, [teams]);

  const savePosition = useCallback(
    (teamId: string, x: number, y: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateTeamPosition(teamId, x, y);
          onPositionChange?.();
        } catch (err) {
          console.error('Failed to save position', err);
        }
      }, 300);
    },
    [onPositionChange]
  );

  const handleNodePointerDown = useCallback(
    (teamId: string, e: ReactPointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const pos = positions.get(teamId);
      if (!pos) return;
      setDragging({
        teamId,
        startX: e.clientX,
        startY: e.clientY,
        origPosX: pos.x,
        origPosY: pos.y,
      });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [positions]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / zoom;
        const dy = (e.clientY - dragging.startY) / zoom;
        const newX = dragging.origPosX + dx;
        const newY = dragging.origPosY + dy;
        setPositions((prev) => {
          const next = new Map(prev);
          next.set(dragging.teamId, { x: newX, y: newY });
          return next;
        });
      } else if (panning) {
        const dx = e.clientX - panning.startX;
        const dy = e.clientY - panning.startY;
        setCamera({ x: panning.camX + dx, y: panning.camY + dy });
      }
    },
    [dragging, panning, zoom]
  );

  const handlePointerUp = useCallback(
    (_e: ReactPointerEvent) => {
      if (dragging) {
        const pos = positions.get(dragging.teamId);
        if (pos) savePosition(dragging.teamId, pos.x, pos.y);
        setDragging(null);
      }
      if (panning) setPanning(null);
    },
    [dragging, panning, positions, savePosition]
  );

  const handleCanvasPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      setPanning({
        startX: e.clientX,
        startY: e.clientY,
        camX: camera.x,
        camY: camera.y,
      });
    },
    [camera]
  );

  const handleWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    },
    []
  );

  const fitToView = useCallback(() => {
    if (!containerRef.current || positions.size === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + CARD_W);
      maxY = Math.max(maxY, y + CARD_H);
    });
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const padding = 80;
    const scaleX = (rect.width - padding * 2) / contentW;
    const scaleY = (rect.height - padding * 2) / contentH;
    const newZoom = Math.max(MIN_ZOOM, Math.min(1.5, Math.min(scaleX, scaleY)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setZoom(newZoom);
    setCamera({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom,
    });
  }, [positions]);

  useEffect(() => {
    if (positions.size > 0 && camera.x === 0 && camera.y === 0) {
      const timer = setTimeout(fitToView, 100);
      return () => clearTimeout(timer);
    }
  }, [positions.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectors: { fromId: string; toId: string }[] = [];
  teams.forEach((t) => {
    if (t.parent_team_id && positions.has(t.parent_team_id) && positions.has(t.id)) {
      connectors.push({ fromId: t.parent_team_id, toId: t.id });
    }
  });

  return (
    <div className="relative w-full h-[calc(100vh-160px)] rounded-2xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow-sm p-1">
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15))}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="확대"
        >
          <ZoomIn className="h-4 w-4 text-gray-600" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15))}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="축소"
        >
          <ZoomOut className="h-4 w-4 text-gray-600" />
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <button
          onClick={fitToView}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="전체 보기"
        >
          <Maximize2 className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-xs text-gray-500 px-1 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-3 z-20 text-xs text-gray-400">
        드래그로 팀 이동 · 빈 곳 드래그로 화면 이동 · 스크롤로 확대/축소
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: panning ? 'grabbing' : dragging ? 'default' : 'grab' }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* SVG connectors */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: 10000, height: 10000, overflow: 'visible' }}
          >
            {connectors.map(({ fromId, toId }) => {
              const parentPos = positions.get(fromId)!;
              const childPos = positions.get(toId)!;
              const x1 = parentPos.x + CARD_W / 2;
              const y1 = parentPos.y + CONNECTOR_OFFSET_BOTTOM;
              const x2 = childPos.x + CARD_W / 2;
              const y2 = childPos.y + CONNECTOR_OFFSET_TOP;
              const midY = (y1 + y2) / 2;
              return (
                <path
                  key={`${fromId}-${toId}`}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  strokeDasharray={dragging?.teamId === toId ? '6 4' : 'none'}
                />
              );
            })}
          </svg>

          {/* Team nodes */}
          {teams.map((team) => {
            const pos = positions.get(team.id);
            if (!pos) return null;
            return (
              <div
                key={team.id}
                className="absolute"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  zIndex: dragging?.teamId === team.id ? 50 : 1,
                }}
                onPointerDown={(e) => handleNodePointerDown(team.id, e)}
              >
                <OrgNodeCard
                  team={team}
                  issues={issues}
                  isDragging={dragging?.teamId === team.id}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
