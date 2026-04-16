'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Crack {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  lines: { angle: number; length: number; branches: { angle: number; length: number }[] }[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
}

const WEAPONS = [
  { id: 'bullet',  label: 'Pistol',    icon: 'game-icons:pistol',        damage: 8,  color: '#ef4444', sound: '💥' },
  { id: 'shotgun', label: 'Shotgun',   icon: 'game-icons:shotgun',       damage: 20, color: '#f97316', sound: '💢' },
  { id: 'rocket',  label: 'Rocket',    icon: 'game-icons:rocket',        damage: 35, color: '#eab308', sound: '🔥' },
  { id: 'laser',   label: 'Laser',     icon: 'game-icons:laser-blast',   damage: 50, color: '#a855f7', sound: '⚡' },
  { id: 'nuke',    label: 'Nuke',      icon: 'game-icons:nuclear-bomb',  damage: 100, color: '#ec4899', sound: '☢️' },
];

const CRACK_COLORS = ['#1a1a1a', '#2d2d2d', '#111'];

function generateCrackLines(count: number, minLen: number, maxLen: number) {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * 360;
    const length = minLen + Math.random() * (maxLen - minLen);
    const branches = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
      angle: angle + (Math.random() - 0.5) * 60,
      length: length * (0.3 + Math.random() * 0.5),
    }));
    return { angle, length, branches };
  });
}

// ── CrackSVG ──────────────────────────────────────────────────────────────────
function CrackSVG({ crack }: { crack: Crack }) {
  const size = crack.size * 2;
  const cx = size / 2;
  const cy = size / 2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <svg
      width={size}
      height={size}
      style={{
        position: 'absolute',
        left: crack.x - size / 2,
        top: crack.y - size / 2,
        pointerEvents: 'none',
        opacity: crack.opacity,
        transform: `rotate(${crack.rotation}deg)`,
        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
      }}
    >
      {/* Bullet hole */}
      <circle cx={cx} cy={cy} r={8} fill="#0a0a0a" stroke="#333" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={5} fill="#000" />
      <radialGradient id={`shine-${crack.id}`}>
        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <circle cx={cx - 2} cy={cy - 2} r={4} fill={`url(#shine-${crack.id})`} />

      {/* Crack lines */}
      {crack.lines.map((line, i) => {
        const ex = cx + Math.cos(toRad(line.angle)) * line.length;
        const ey = cy + Math.sin(toRad(line.angle)) * line.length;
        return (
          <g key={i}>
            <path
              d={`M ${cx} ${cy} L ${ex} ${ey}`}
              stroke={CRACK_COLORS[i % CRACK_COLORS.length]}
              strokeWidth={1.5 - i * 0.1}
              strokeLinecap="round"
              opacity={0.9 - i * 0.05}
            />
            {line.branches.map((branch, j) => {
              const mid = 0.4 + Math.random() * 0.3;
              const bx = cx + Math.cos(toRad(line.angle)) * line.length * mid;
              const by = cy + Math.sin(toRad(line.angle)) * line.length * mid;
              const bex = bx + Math.cos(toRad(branch.angle)) * branch.length;
              const bey = by + Math.sin(toRad(branch.angle)) * branch.length;
              return (
                <path
                  key={j}
                  d={`M ${bx} ${by} L ${bex} ${bey}`}
                  stroke={CRACK_COLORS[(i + j + 1) % CRACK_COLORS.length]}
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Game ──────────────────────────────────────────────────────────────────
export default function DesktopDestroyer({ onClose }: { onClose: () => void }) {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [gameOver, setGameOver] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [combo, setCombo] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const nextId = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getId = () => ++nextId.current;

  // Particle animation loop on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();
      particlesRef.current = particlesRef.current.filter(p => {
        const age = (now - p.life) / 800;
        if (age >= 1) return false;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.vx *= 0.98;
        ctx.save();
        ctx.globalAlpha = 1 - age;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - age * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const spawnParticles = useCallback((x: number, y: number, weapon: typeof WEAPONS[0], count: number) => {
    const newParticles: Particle[] = Array.from({ length: count }, () => ({
      id: getId(),
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 3,
      size: 2 + Math.random() * 4,
      color: weapon.color,
      life: Date.now(),
    }));
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (gameOver) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX;
    const y = e.clientY;
    const weapon = selectedWeapon;

    // Combo tracking
    const now = Date.now();
    const newCombo = now - lastHitTime < 1000 ? combo + 1 : 1;
    setCombo(newCombo);
    setLastHitTime(now);

    const comboMultiplier = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : 1;
    const dmg = Math.min(weapon.damage * comboMultiplier, health);
    const pts = Math.floor(dmg * 10 * comboMultiplier);

    // Cracks
    const crackCount = weapon.id === 'nuke' ? 16 : weapon.id === 'rocket' ? 10 : weapon.id === 'shotgun' ? 6 : weapon.id === 'laser' ? 4 : 5;
    const crackSize = weapon.id === 'nuke' ? 250 : weapon.id === 'rocket' ? 160 : weapon.id === 'shotgun' ? 120 : weapon.id === 'laser' ? 100 : 80;

    const shootCount = weapon.id === 'shotgun' ? 5 : 1;
    const newCracks: Crack[] = Array.from({ length: shootCount }, (_, si) => ({
      id: getId(),
      x: x + (weapon.id === 'shotgun' ? (Math.random() - 0.5) * 120 : 0),
      y: y + (weapon.id === 'shotgun' ? (Math.random() - 0.5) * 80 : 0),
      size: crackSize * (0.7 + Math.random() * 0.6),
      rotation: Math.random() * 360,
      opacity: 0.85 + Math.random() * 0.15,
      lines: generateCrackLines(crackCount, crackSize * 0.3, crackSize * 0.9),
    }));

    setCracks(prev => [...prev, ...newCracks]);

    // Particles
    const particleCount = weapon.id === 'nuke' ? 60 : weapon.id === 'rocket' ? 40 : weapon.id === 'shotgun' ? 25 : weapon.id === 'laser' ? 20 : 15;
    spawnParticles(x, y, weapon, particleCount);

    // Explosion flash
    const newExplosion: Explosion = { id: getId(), x, y };
    setExplosions(prev => [...prev, newExplosion]);
    setTimeout(() => setExplosions(prev => prev.filter(ex => ex.id !== newExplosion.id)), 400);

    // Floating text
    const textId = getId();
    const comboText = newCombo >= 10 ? ` x${newCombo} ULTRA!!` : newCombo >= 5 ? ` x${newCombo} COMBO!` : '';
    setFloatingTexts(prev => [...prev, { id: textId, x, y: y - 20, text: `-${dmg}${comboText}`, color: weapon.color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== textId)), 900);

    // Screen shake
    setShaking(true);
    setTimeout(() => setShaking(false), 300);

    // Health & score
    const newHealth = Math.max(0, health - dmg);
    setHealth(newHealth);
    setScore(prev => prev + pts);
    setHits(prev => prev + 1);

    if (newHealth === 0) {
      setTimeout(() => setGameOver(true), 600);
    }
  }, [gameOver, selectedWeapon, health, combo, lastHitTime, spawnParticles]);

  const handleReset = () => {
    setHealth(100);
    setScore(0);
    setHits(0);
    setCracks([]);
    setExplosions([]);
    setFloatingTexts([]);
    setCombo(0);
    setGameOver(false);
    particlesRef.current = [];
  };

  const healthColor = health > 60 ? '#22c55e' : health > 30 ? '#f59e0b' : '#ef4444';
  const vignette = `rgba(239,68,68,${Math.max(0, (60 - health) / 60 * 0.4)})`;

  return (
    <div
      ref={overlayRef}
      onClick={handleClick}
      className={`fixed inset-0 z-[9999] select-none ${shaking ? 'animate-shake' : ''}`}
      style={{
        cursor: gameOver ? 'default' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='6' fill='none' stroke='%23ef4444' stroke-width='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='10' stroke='%23ef4444' stroke-width='2'/%3E%3Cline x1='16' y1='22' x2='16' y2='30' stroke='%23ef4444' stroke-width='2'/%3E%3Cline x1='2' y1='16' x2='10' y2='16' stroke='%23ef4444' stroke-width='2'/%3E%3Cline x1='22' y1='16' x2='30' y2='16' stroke='%23ef4444' stroke-width='2'/%3E%3C/svg%3E") 16 16, crosshair`,
      }}
    >
      {/* Glass/screen tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${vignette} 100%)`,
          transition: 'background 0.3s',
        }}
      />

      {/* Screen break overlay when health < 20 */}
      {health < 20 && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          mixBlendMode: 'multiply',
        }} />
      )}

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
      />

      {/* Cracks */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {cracks.map(crack => <CrackSVG key={crack.id} crack={crack} />)}
      </div>

      {/* Explosions */}
      {explosions.map(ex => (
        <div
          key={ex.id}
          className="absolute pointer-events-none"
          style={{
            left: ex.x - 60,
            top: ex.y - 60,
            width: 120,
            height: 120,
            zIndex: 3,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${selectedWeapon.color}cc 0%, ${selectedWeapon.color}44 50%, transparent 80%)`,
            animation: 'explode 0.4s ease-out forwards',
          }}
        />
      ))}

      {/* Floating damage texts */}
      {floatingTexts.map(t => (
        <div
          key={t.id}
          className="absolute pointer-events-none font-black text-lg"
          style={{
            left: t.x,
            top: t.y,
            color: t.color,
            zIndex: 10,
            textShadow: '0 0 8px rgba(0,0,0,0.8), 1px 1px 0 #000',
            animation: 'floatUp 0.9s ease-out forwards',
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)',
          }}
        >
          {t.text}
        </div>
      ))}

      {/* HUD */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        {/* Health bar */}
        <div className="bg-black/60 rounded-full px-4 py-1.5 flex items-center gap-3 backdrop-blur-sm">
          <span className="text-white text-xs font-bold">HP</span>
          <div className="w-48 h-3 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${health}%`, background: healthColor, boxShadow: `0 0 8px ${healthColor}` }}
            />
          </div>
          <span className="text-white text-xs font-bold w-8 text-right">{health}</span>
        </div>

        {/* Score & hits */}
        <div className="flex gap-3">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
            <div className="text-yellow-400 font-black text-lg leading-none">{score.toLocaleString()}</div>
            <div className="text-gray-400 text-[10px]">SCORE</div>
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
            <div className="text-white font-black text-lg leading-none">{hits}</div>
            <div className="text-gray-400 text-[10px]">HITS</div>
          </div>
          {combo >= 3 && (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 text-center animate-pulse">
              <div className="text-orange-400 font-black text-lg leading-none">x{combo}</div>
              <div className="text-gray-400 text-[10px]">COMBO</div>
            </div>
          )}
        </div>
      </div>

      {/* Weapon selector */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto"
        style={{ zIndex: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {WEAPONS.map(w => (
          <button
            key={w.id}
            onClick={() => setSelectedWeapon(w)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all duration-150 cursor-pointer ${selectedWeapon.id === w.id ? 'border-white bg-white/20 scale-110' : 'border-white/30 bg-black/50 hover:border-white/60 hover:bg-white/10'}`}
            style={{ backdropFilter: 'blur(8px)' }}
            title={w.label}
          >
            <Icon icon={w.icon} width={22} height={22} color={w.color} />
            <span className="text-[10px] font-bold text-white">{w.label}</span>
            <span className="text-[9px] font-bold" style={{ color: w.color }}>-{w.damage} HP</span>
          </button>
        ))}
      </div>

      {/* Close button */}
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 hover:bg-red-600/80 transition-colors z-[21] cursor-pointer pointer-events-auto"
        onClick={e => { e.stopPropagation(); onClose(); }}
        title="Exit Game (Esc)"
      >
        <Icon icon="mdi:close" width={18} height={18} />
      </button>

      {/* Game label */}
      <div
        className="absolute top-4 left-4 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Icon icon="game-icons:dynamite" width={16} height={16} color="#ef4444" />
          <span className="text-white text-xs font-bold tracking-wider">DESKTOP DESTROYER</span>
        </div>
        <div className="text-gray-400 text-[10px] mt-1 ml-1">Click anywhere to destroy • ESC to exit</div>
      </div>

      {/* Game Over screen */}
      {gameOver && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 30, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="text-7xl mb-2 animate-bounce">💥</div>
            <h2 className="text-5xl font-black text-red-500 mb-1 tracking-wider" style={{ textShadow: '0 0 30px rgba(239,68,68,0.8)' }}>
              DESTROYED!
            </h2>
            <p className="text-gray-300 text-lg mb-6">Screen has been obliterated!</p>
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-black text-yellow-400">{score.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white">{hits}</div>
                <div className="text-gray-400 text-sm">Total Hits</div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-lg transition-colors cursor-pointer border-none"
              >
                Play Again
              </button>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-lg transition-colors cursor-pointer border border-white/20"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes explode {
          0%   { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes floatUp {
          0%   { transform: translateX(-50%) translateY(0);    opacity: 1; }
          100% { transform: translateX(-50%) translateY(-60px); opacity: 0; }
        }
        @keyframes shake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          15%     { transform: translate(-4px, 3px) rotate(-0.5deg); }
          30%     { transform: translate(4px, -3px) rotate(0.5deg); }
          45%     { transform: translate(-3px, 2px) rotate(-0.3deg); }
          60%     { transform: translate(3px, -2px) rotate(0.3deg); }
          75%     { transform: translate(-2px, 1px) rotate(0deg); }
          90%     { transform: translate(2px, -1px) rotate(0deg); }
        }
        .animate-shake { animation: shake 0.3s ease-out; }
      `}</style>
    </div>
  );
}
