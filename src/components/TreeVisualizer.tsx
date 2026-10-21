import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BalanceStep, TreeType, VisualNode } from '../types/tree';
import { LayoutTarget, useAnimatedLayout } from '../hooks/useAnimatedLayout';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  GitCommit,
  Layers,
  Play,
  Pause,
  StepBack,
  StepForward
} from 'lucide-react';

interface TreeVisualizerProps {
  treeType: TreeType;
  root: VisualNode | null;
  snapshotBefore?: VisualNode | null;
  balanceSteps?: BalanceStep[];
  operationId?: string;
  highlightedPath?: number[];
  targetKey?: number;
  title?: string;
  compact?: boolean;
}

interface PositionedNode {
  node: VisualNode;
  x: number;
  y: number;
  depth: number;
  parentKey?: number;
  isLeft?: boolean;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +z.toFixed(3)));

/** Duração da transição de posição dos nós; o autoplay espera um pouco mais que isso. */
const ANIMATION_MS = 850;
const AUTOPLAY_MS = 1700;

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  treeType,
  root,
  snapshotBefore,
  balanceSteps = [],
  operationId,
  highlightedPath = [],
  targetKey,
  title,
  compact = false
}) => {
  const [zoom, setZoom] = useState(1);
  // null = árvore centralizada automaticamente; caso contrário, deslocamento manual (px do viewport)
  const [pan, setPan] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ w: 600, h: 440 });
  const [showBefore, setShowBefore] = useState(false);
  const [showNilLeaves, setShowNilLeaves] = useState(false);
  const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; viewX: number; viewY: number; moved: boolean } | null>(null);

  const currentFrame = balanceSteps[frameIndex];
  const displayedRoot = currentFrame ? currentFrame.snapshot : root;
  const activeRoot = showBefore && snapshotBefore !== undefined ? snapshotBefore : displayedRoot;
  const focusSet = useMemo(() => new Set(currentFrame?.focusKeys ?? []), [currentFrame]);

  const viewX = pan?.x ?? viewport.w / 2;
  const viewY = pan?.y ?? 56;

  useEffect(() => {
    setFrameIndex(0);
    setIsPlaying(balanceSteps.length > 1);
    setShowBefore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationId]);

  useEffect(() => {
    if (!isPlaying || balanceSteps.length < 2) return;
    if (frameIndex >= balanceSteps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setFrameIndex((index) => index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [balanceSteps.length, frameIndex, isPlaying]);

  // Acompanha o tamanho real do painel para centralizar a árvore e calcular o zoom.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * Layout em ordem simétrica (sem colisões), centralizado em x = 0.
   * As posições finais alimentam a animação, que desliza os nós até elas.
   */
  const { nodes, targets } = useMemo(() => {
    const positioned: PositionedNode[] = [];
    const targetMap = new Map<number, LayoutTarget>();
    if (!activeRoot) return { nodes: positioned, targets: targetMap };

    let orderIndex = 0;
    const horizontalGap = compact ? 54 : 68;
    const verticalGap = compact ? 78 : 92;

    const assign = (current: VisualNode | null, depth: number, parentKey?: number, isLeft?: boolean) => {
      if (!current) return;
      assign(current.left, depth + 1, current.key, true);
      const item: PositionedNode = {
        node: current,
        x: orderIndex * horizontalGap,
        y: depth * verticalGap,
        depth,
        parentKey,
        isLeft
      };
      orderIndex++;
      positioned.push(item);
      assign(current.right, depth + 1, current.key, false);
    };
    assign(activeRoot, 0);

    const xs = positioned.map((p) => p.x);
    const center = (Math.min(...xs) + Math.max(...xs)) / 2;
    positioned.forEach((p) => {
      p.x -= center;
      targetMap.set(p.node.key, { x: p.x, y: p.y, parentKey: p.parentKey });
    });
    return { nodes: positioned, targets: targetMap };
  }, [activeRoot, compact]);

  const anim = useAnimatedLayout(targets, ANIMATION_MS);
  const highlightedSet = useMemo(() => new Set(highlightedPath), [highlightedPath]);

  const positionOf = (key: number) => anim.pos.get(key) ?? targets.get(key) ?? { x: 0, y: 0 };
  const opacityOf = (key: number) =>
    anim.pos.has(key) ? (anim.entering.has(key) ? anim.t : 1) : 0;

  /** Zoom mantendo fixo o ponto (cx, cy) do viewport — o que está sob o cursor não "foge". */
  const zoomAt = (factor: number, cx: number, cy: number) => {
    const next = clampZoom(zoom * factor);
    if (next === zoom) return;
    const ratio = next / zoom;
    setPan({ x: cx - (cx - viewX) * ratio, y: cy - (cy - viewY) * ratio });
    setZoom(next);
  };

  // O listener de wheel precisa ser nativo e não-passivo para impedir a rolagem da página.
  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const factor = Math.exp(-delta * 0.0015);
      zoomAtRef.current(factor, event.clientX - rect.left, event.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomFromCenter = (factor: number) => zoomAt(factor, viewport.w / 2, viewport.h / 2);

  const resetView = () => {
    setZoom(1);
    setPan(null);
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      viewX,
      viewY,
      moved: false
    };
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = panStart.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.abs(dx) + Math.abs(dy) > 4) {
      start.moved = true;
      setIsPanning(true);
      // Só captura o ponteiro quando é arraste de fato, para que cliques em nós continuem funcionando.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (start.moved) {
      setPan({ x: start.viewX + dx, y: start.viewY + dy });
    }
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    panStart.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const radius = compact ? 22 : 25;
  const frameKind = currentFrame?.kind;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Barra de Ferramentas do Visualizador */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              treeType === 'AVL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            {title ?? (treeType === 'AVL' ? 'Árvore AVL' : 'Árvore Rubro-Negra')}
          </span>

          {showBefore && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Visualizando Estado ANTES da Última Operação
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {snapshotBefore !== undefined && (
            <button
              onClick={() => {
                setIsPlaying(false);
                setShowBefore((previous) => !previous);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showBefore
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Alternar entre a estrutura Antes e Depois da última operação"
            >
              <Eye className="w-3.5 h-3.5" />
              {showBefore ? 'Ver Estado Atual (Depois)' : 'Comparar: Antes da Operação'}
            </button>
          )}

          {treeType === 'RB' && (
            <button
              onClick={() => setShowNilLeaves((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showNilLeaves
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Exibir ou ocultar folhas sentinelas NIL pretas"
            >
              <Layers className="w-3.5 h-3.5" />
              {showNilLeaves ? 'Ocultar Folhas NIL' : 'Mostrar Folhas NIL'}
            </button>
          )}

          <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => zoomFromCenter(1 / 1.2)}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              aria-label="Zoom da árvore"
              type="range"
              min={Math.round(MIN_ZOOM * 100)}
              max={Math.round(MAX_ZOOM * 100)}
              step="5"
              value={Math.round(zoom * 100)}
              onChange={(event) => zoomFromCenter(Number(event.target.value) / 100 / zoom)}
              className="w-16 accent-amber-500"
            />
            <span className="px-2 text-xs text-slate-300 font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => zoomFromCenter(1.2)}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 hover:bg-slate-700 rounded text-slate-300"
              title="Resetar zoom e centralizar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {currentFrame && (
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Etapa {frameIndex + 1}/{balanceSteps.length}
              </span>
              <strong className="text-xs text-amber-300 truncate">{currentFrame.title}</strong>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setIsPlaying(false); setFrameIndex((index) => Math.max(0, index - 1)); }}
                disabled={frameIndex === 0}
                className="p-1 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                aria-label="Etapa anterior"
              ><StepBack className="w-3.5 h-3.5" /></button>
              <button
                onClick={() => {
                  if (isPlaying) setIsPlaying(false);
                  else {
                    if (frameIndex === balanceSteps.length - 1) setFrameIndex(0);
                    setIsPlaying(true);
                  }
                }}
                className="p-1 rounded text-slate-200 hover:bg-slate-800"
                aria-label={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
              >{isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
              <button
                onClick={() => { setIsPlaying(false); setFrameIndex((index) => Math.min(balanceSteps.length - 1, index + 1)); }}
                disabled={frameIndex === balanceSteps.length - 1}
                className="p-1 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30"
                aria-label="Próxima etapa"
              ><StepForward className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <p className="text-xs text-slate-300">{currentFrame.description}</p>
          <div
            className="flex gap-1"
            role="progressbar"
            aria-label="Progresso do balanceamento"
            aria-valuemin={1}
            aria-valuemax={balanceSteps.length}
            aria-valuenow={frameIndex + 1}
          >
            {balanceSteps.map((frame, index) => (
              <button
                key={`${frame.kind}-${index}`}
                onClick={() => { setIsPlaying(false); setFrameIndex(index); }}
                title={`${index + 1}. ${frame.title}`}
                className={`h-1.5 flex-1 rounded transition-colors ${index <= frameIndex ? 'bg-amber-400' : 'bg-slate-700 hover:bg-slate-600'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Área Gráfica SVG: arraste para mover, scroll para dar zoom */}
      <div
        ref={viewportRef}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        style={{ backgroundPosition: `${viewX}px ${viewY}px` }}
        className={`relative overflow-hidden h-[440px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] touch-none select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {!activeRoot && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 text-slate-500">
              <GitCommit className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              A árvore está vazia no momento
            </p>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Insira identificadores de encomendas manualmente no painel lateral ou execute um dos
              Cenários de Teste da Black Friday para visualizar a estrutura e o balanceamento em tempo real.
            </p>
          </div>
        )}

        <svg width="100%" height="100%" className="block">
          <defs>
            <linearGradient id={`avlNodeGrad-${treeType}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
            <linearGradient id={`rbRedGrad-${treeType}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id={`rbBlackGrad-${treeType}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id={`glow-${treeType}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${viewX}, ${viewY}) scale(${zoom})`}>
            {/* 1. Arestas: ligam as posições animadas de pai e filho, então acompanham a rotação */}
            {nodes.map((item) => {
              if (item.parentKey === undefined) return null;
              const parent = positionOf(item.parentKey);
              const child = positionOf(item.node.key);
              const isEdgeHighlighted =
                !showBefore &&
                highlightedSet.has(item.node.key) &&
                highlightedPath.indexOf(item.node.key) > 0;
              const isRotationEdge =
                !showBefore &&
                frameKind === 'rotation' &&
                focusSet.has(item.node.key) &&
                focusSet.has(item.parentKey);

              return (
                <g key={`edge-${item.node.key}`} opacity={opacityOf(item.node.key)}>
                  <line
                    x1={parent.x}
                    y1={parent.y}
                    x2={child.x}
                    y2={child.y}
                    stroke={isRotationEdge ? '#22d3ee' : isEdgeHighlighted ? '#FF9900' : '#475569'}
                    strokeWidth={isRotationEdge || isEdgeHighlighted ? 3.5 : 2}
                  />
                  <text
                    x={(parent.x + child.x) / 2 + (item.isLeft ? -8 : 8)}
                    y={(parent.y + child.y) / 2 - 4}
                    textAnchor="middle"
                    className="fill-slate-400 text-[9px] font-mono"
                  >
                    {item.isLeft ? 'E' : 'D'}
                  </text>
                </g>
              );
            })}

            {/* 2. Folhas sentinelas NIL (Rubro-Negra) */}
            {treeType === 'RB' &&
              showNilLeaves &&
              nodes.map((item) => {
                const nilOffsets: { side: 'L' | 'R'; dx: number }[] = [];
                if (!item.node.left) nilOffsets.push({ side: 'L', dx: -20 });
                if (!item.node.right) nilOffsets.push({ side: 'R', dx: 20 });
                const p = positionOf(item.node.key);

                return nilOffsets.map((nil) => {
                  const nx = p.x + nil.dx;
                  const ny = p.y + 52;
                  return (
                    <g key={`nil-${item.node.key}-${nil.side}`} opacity={opacityOf(item.node.key)}>
                      <line
                        x1={p.x}
                        y1={p.y}
                        x2={nx}
                        y2={ny}
                        stroke="#334155"
                        strokeWidth={1.2}
                        strokeDasharray="3 2"
                      />
                      <rect
                        x={nx - 12}
                        y={ny - 8}
                        width={24}
                        height={16}
                        rx={3}
                        fill="#020617"
                        stroke="#475569"
                        strokeWidth={1}
                      />
                      <text
                        x={nx}
                        y={ny + 3}
                        textAnchor="middle"
                        className="fill-slate-400 text-[8px] font-mono font-bold"
                      >
                        NIL
                      </text>
                    </g>
                  );
                });
              })}

            {/* 3. Nós */}
            {nodes.map((item) => {
              const { node } = item;
              const { x, y } = positionOf(node.key);
              const isVisited = !showBefore && highlightedSet.has(node.key);
              const isFocused = !showBefore && focusSet.has(node.key);
              const isRotationFocus = isFocused && frameKind === 'rotation';
              const isTarget = !showBefore && (targetKey === node.key || isFocused);

              let fillUrl = `url(#avlNodeGrad-${treeType})`;
              let strokeColor = '#34d399';

              if (treeType === 'RB') {
                if (node.color === 'RED') {
                  fillUrl = '#b91c1c';
                  strokeColor = '#fca5a5';
                } else {
                  fillUrl = '#0f172a';
                  strokeColor = '#94a3b8';
                }
              }

              if (isRotationFocus) {
                strokeColor = '#22d3ee';
              } else if (isTarget) {
                strokeColor = '#FF9900';
              } else if (isVisited) {
                strokeColor = '#fde047';
              }

              return (
                <g
                  key={`node-${node.key}`}
                  transform={`translate(${x}, ${y})`}
                  opacity={opacityOf(node.key)}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer"
                >
                  {(isVisited || isTarget) && (
                    <circle
                      r={radius + 6}
                      fill="none"
                      stroke={isRotationFocus ? '#22d3ee' : isTarget ? '#FF9900' : '#facc15'}
                      strokeWidth={2.5}
                      strokeDasharray={isTarget ? undefined : '4 2'}
                      filter={`url(#glow-${treeType})`}
                      className={
                        isRotationFocus
                          ? 'animate-pulse'
                          : frameKind === 'recolor' && isFocused
                          ? 'animate-recolor-fade'
                          : undefined
                      }
                    />
                  )}

                  <circle
                    r={radius}
                    fill={fillUrl}
                    stroke={strokeColor}
                    strokeWidth={isTarget ? 3.5 : 2}
                      style={{ transition: 'fill 850ms ease, stroke 300ms ease' }}
                  />

                  <text
                    y={3}
                    textAnchor="middle"
                    className="fill-white font-bold text-xs font-mono pointer-events-none"
                  >
                    #{node.key}
                  </text>

                  <text
                    y={14}
                    textAnchor="middle"
                    className="fill-slate-200/90 text-[8px] font-mono pointer-events-none"
                  >
                    {treeType === 'AVL'
                      ? `h:${node.height}`
                      : node.color === 'RED'
                      ? 'RUBRO'
                      : 'NEGRO'}
                  </text>

                  {treeType === 'AVL' && node.balanceFactor !== undefined && (
                    <g transform={`translate(${radius - 2}, ${-radius + 2})`} className="pointer-events-none">
                      <rect
                        x={-14}
                        y={-9}
                        width={28}
                        height={15}
                        rx={5}
                        fill={
                          Math.abs(node.balanceFactor) > 1
                            ? '#dc2626'
                            : node.balanceFactor === 0
                            ? '#0f172a'
                            : '#1e3a8a'
                        }
                        stroke={
                          Math.abs(node.balanceFactor) > 1
                            ? '#fca5a5'
                            : node.balanceFactor === 0
                            ? '#475569'
                            : '#60a5fa'
                        }
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={1.5}
                        textAnchor="middle"
                        className="fill-white text-[8.5px] font-mono font-bold"
                      >
                        FB:{node.balanceFactor > 0 ? `+${node.balanceFactor}` : node.balanceFactor}
                      </text>
                    </g>
                  )}

                  {treeType === 'RB' && node.blackHeight !== undefined && (
                    <g transform={`translate(${radius - 2}, ${-radius + 2})`} className="pointer-events-none">
                      <rect
                        x={-14}
                        y={-9}
                        width={28}
                        height={15}
                        rx={5}
                        fill="#0f172a"
                        stroke="#64748b"
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={1.5}
                        textAnchor="middle"
                        className="fill-slate-200 text-[8.5px] font-mono font-semibold"
                      >
                        BH:{node.blackHeight}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legenda curta e detalhes do nó selecionado */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-xs">
        <span className="text-slate-400">
          Arraste para mover · Scroll para zoom · Clique em um nó para ver os dados ·{' '}
          {treeType === 'AVL' ? 'FB = altura esquerda − altura direita' : 'Rubro/negro = cor · BH = altura negra'}
        </span>

        {selectedNode ? (
          <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-slate-200">
            <span className="font-mono font-bold text-amber-400">
              Pacote #{selectedNode.key}
            </span>
            {selectedNode.metadata && (
              <>
                <span className="text-slate-400">|</span>
                <span className="font-mono text-xs">{selectedNode.metadata.trackingCode}</span>
                <span className="text-slate-400">|</span>
                <span>{selectedNode.metadata.destination}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                  {selectedNode.metadata.priority}
                </span>
              </>
            )}
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white ml-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-slate-500">E = esquerda · D = direita</span>
        )}
      </div>
    </div>
  );
};
