"use client";

import { useEffect, useState } from "react";

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ec4899", "#a855f7", "#f97316"];

interface Particle {
  id: number;
  color: string;
  size: number;
  dx: number;
  dy: number;
  delay: number;
}

export function ConfettiBurst({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const p: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.6;
      const speed = Math.random() * 50 + 40;
      p.push({
        id: i,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 6 + 4,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        delay: Math.random() * 80,
      });
    }
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), 900);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden" style={{ perspective: 200 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-pop 500ms ease-out ${p.delay}ms forwards`,
            "--dx": p.dx,
            "--dy": p.dy,
          } as React.CSSProperties}
        />
      ))}
      <style>{`@keyframes confetti-pop{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(calc(-50% + var(--dx) * 1px),calc(-50% + var(--dy) * 1px)) scale(0);opacity:0}}`}</style>
    </div>
  );
}
