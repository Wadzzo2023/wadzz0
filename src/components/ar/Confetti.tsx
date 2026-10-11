import { useEffect, useRef } from "react";

type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

/**
 * ── Confetti ───────────────────────────────────────────────────────────────
 *
 * A hand-rolled canvas burst rather than a dependency, for three reasons:
 * the palette has to follow the card's rarity, the burst has to originate
 * from a point the caller chooses (the Capture button, not the viewport
 * centre), and it has to run inside the device frame rather than over the
 * whole document.
 *
 * Particles are flat rectangles spun about their own axis — scaling width by
 * |cos(spin)| fakes a card tumbling edge-on without any 3D maths, which is
 * what reads as confetti rather than as falling dots.
 *
 * Incrementing `trigger` fires a burst. The canvas tears its own rAF loop
 * down once every particle has left the frame, so an idle screen costs
 * nothing.
 */

const PALETTES: Record<Rarity, string[]> = {
  common: ["#8FA39A", "#B8C9C0", "#5E6E66", "#E6EFE9"],
  rare: ["#35D7F2", "#7BE9FF", "#1B9CB8", "#E8FCFF"],
  epic: ["#A855F7", "#C99BFF", "#6D28D9", "#F3E8FF"],
  legendary: ["#F5B70A", "#FFD75E", "#B87503", "#FFF4D1"],
  mythic: ["#F472B6", "#F5B70A", "#4BE03A", "#35D7F2", "#A855F7", "#FFFFFF"],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  spin: number;
  spinRate: number;
  color: string;
  life: number;
  shape: "rect" | "dot";
}

export function Confetti({
  trigger,
  rarity = "legendary",
  /** Burst origin as a fraction of the canvas. Default: slightly above centre. */
  origin = { x: 0.5, y: 0.42 },
  count = 90,
}: {
  trigger: number;
  rarity?: Rarity;
  origin?: { x: number; y: number };
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (trigger <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Size the backing store to the device pixel ratio once per burst; the
    // canvas is display:none-adjacent the rest of the time.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = PALETTES[rarity];
    const ox = rect.width * origin.x;
    const oy = rect.height * origin.y;

    const fresh: Particle[] = Array.from({ length: count }, () => {
      // Biased upward and outward: a cone, not a sphere. A full sphere sends
      // half the particles straight into the ground and looks like a leak.
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
      const speed = 5 + Math.random() * 11;
      return {
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed * (0.75 + Math.random() * 0.7),
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 7,
        h: 7 + Math.random() * 9,
        spin: Math.random() * Math.PI * 2,
        spinRate: (Math.random() - 0.5) * 0.4,
        color: palette[Math.floor(Math.random() * palette.length)]!,
        life: 1,
        shape: Math.random() > 0.78 ? "dot" : "rect",
      };
    });

    particles.current = [...particles.current, ...fresh];

    if (raf.current !== null) return; // a loop is already running

    const tick = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.current = particles.current.filter((p) => {
        p.vy += 0.34; // gravity
        p.vx *= 0.987; // air drag
        p.vy *= 0.987;
        p.x += p.vx;
        p.y += p.vy;
        p.spin += p.spinRate;
        p.life -= 0.006;

        if (p.life <= 0 || p.y > rect.height + 40) return false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;

        if (p.shape === "dot") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // |cos(spin)| squashes the width as it turns edge-on.
          const w = p.w * Math.abs(Math.cos(p.spin * 1.7));
          ctx.fillRect(-w / 2, -p.h / 2, Math.max(w, 1), p.h);
        }
        ctx.restore();
        return true;
      });

      if (particles.current.length > 0) {
        raf.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        raf.current = null;
      }
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      particles.current = [];
    };
  }, [trigger, rarity, origin.x, origin.y, count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[70] h-full w-full"
    />
  );
}
