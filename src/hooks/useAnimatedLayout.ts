import { useEffect, useRef, useState } from 'react';

export interface LayoutTarget {
  x: number;
  y: number;
  parentKey?: number;
}

export interface AnimatedLayout {
  /** Posição interpolada de cada nó neste quadro de animação. */
  pos: Map<number, { x: number; y: number }>;
  /** Progresso (0..1, já com easing) da transição atual. */
  t: number;
  /** Nós que acabaram de surgir (nascem na posição do pai e aparecem com fade-in). */
  entering: Set<number>;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Interpola suavemente a posição dos nós quando o layout muda (por exemplo, durante uma rotação).
 * Se a animação for interrompida por uma nova etapa, ela continua da posição atual, sem saltos.
 */
export function useAnimatedLayout(
  targets: Map<number, LayoutTarget>,
  duration = 800
): AnimatedLayout {
  const current = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [frame, setFrame] = useState<AnimatedLayout>({
    pos: new Map(),
    t: 0,
    entering: new Set()
  });

  useEffect(() => {
    const from = new Map(current.current);
    const entering = new Set<number>();

    targets.forEach((target, key) => {
      if (from.has(key)) return;
      const parent =
        target.parentKey !== undefined
          ? from.get(target.parentKey) ?? targets.get(target.parentKey)
          : undefined;
      from.set(key, parent ? { x: parent.x, y: parent.y } : { x: target.x, y: target.y });
      entering.add(key);
    });

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const apply = (progress: number) => {
      const eased = easeInOutCubic(progress);
      const pos = new Map<number, { x: number; y: number }>();
      targets.forEach((target, key) => {
        const start = from.get(key)!;
        pos.set(key, {
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased
        });
      });
      current.current = pos;
      setFrame({ pos, t: eased, entering });
    };

    if (reduceMotion || duration <= 0) {
      apply(1);
      return;
    }

    const startTime = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      apply(progress);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targets, duration]);

  return frame;
}
