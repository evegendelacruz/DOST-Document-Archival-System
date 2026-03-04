'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

const CELL = 34;
const COLS = 13;
const ROWS = 13;
const SPEED = 140;

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Pt = { x: number; y: number };
type Tab = 'game' | 'leaderboard';
interface GUser { id: string; fullName: string; profileImageUrl: string | null; }
interface LeaderboardEntry { userId: string; fullName: string; profileImageUrl: string | null; score: number; }

const OPPOSITE: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const COLORS = ['#0891b2','#0e7490','#155e75','#164e63','#06b6d4'];
const RANK_COLORS = ['#facc15', '#94a3b8', '#cd7c2f'];

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image(); i.crossOrigin = 'anonymous';
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
}

function clipCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  cx: number, cy: number, r: number,
  fallbackColor: string, letter: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${r}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((letter[0] || '?').toUpperCase(), cx, cy + 1);
  }
  ctx.restore();
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/snake-scores');
    if (res.ok) return res.json();
  } catch { /* ignore */ }
  return [];
}

async function postScore(userId: string, score: number): Promise<void> {
  try {
    await fetch('/api/snake-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ score }),
    });
  } catch { /* ignore */ }
}

export default function SnakeGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gs, setGs] = useState<'idle' | 'playing' | 'over'>('idle');
  const [tab, setTab] = useState<Tab>('game');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [meUser, setMeUser] = useState<GUser | null>(null);
  const [others, setOthers] = useState<GUser[]>([]);
  const [eatenList, setEatenList] = useState<GUser[]>([]);
  const [nextFood, setNextFood] = useState<GUser | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [newRecord, setNewRecord] = useState(false);

  const gsRef = useRef<'idle' | 'playing' | 'over'>('idle');
  const snakeRef = useRef<Pt[]>([{ x: 6, y: 6 }]);
  const dirRef = useRef<Dir>('RIGHT');
  const nextDirRef = useRef<Dir>('RIGHT');
  const foodRef = useRef<Pt>({ x: 3, y: 3 });
  const foodIdxRef = useRef(0);
  const tailUsersRef = useRef<GUser[]>([]);
  const scoreRef = useRef(0);
  const imgCache = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef(0);
  const othersRef = useRef<GUser[]>([]);
  const meRef = useRef<GUser | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { othersRef.current = others; }, [others]);
  useEffect(() => { meRef.current = meUser; }, [meUser]);

  // fetch users + preload images
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      const me: GUser = { id: u.id, fullName: u.fullName || 'Me', profileImageUrl: u.profileImageUrl || null };
      setMeUser(me);
      if (me.profileImageUrl) loadImg(me.profileImageUrl).then(i => imgCache.current.set(me.profileImageUrl!, i)).catch(() => imgCache.current.set(me.profileImageUrl!, null));
    }
    fetch('/api/users').then(r => r.json()).then((users: GUser[]) => {
      const stored2 = localStorage.getItem('user');
      const myId = stored2 ? JSON.parse(stored2).id : null;
      const rest = users.filter(u => u.id !== myId);
      setOthers(rest);
      rest.forEach(u => {
        if (u.profileImageUrl && !imgCache.current.has(u.profileImageUrl)) {
          loadImg(u.profileImageUrl).then(i => imgCache.current.set(u.profileImageUrl!, i)).catch(() => imgCache.current.set(u.profileImageUrl!, null));
        }
      });
    }).catch(() => {});

    const hs = parseInt(localStorage.getItem('snakeHighScore') || '0');
    setHighScore(hs);
    fetchLeaderboard().then(setLeaderboard);
  }, []);

  const randFood = useCallback((snake: Pt[]): Pt => {
    let p: Pt;
    do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (snake.some(s => s.x === p.x && s.y === p.y));
    return p;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snake = snakeRef.current;
    const food = foodRef.current;
    const allOthers = othersRef.current;
    const me = meRef.current;
    const tailUsers = tailUsersRef.current;
    const foodUser = allOthers.length > 0 ? allOthers[foodIdxRef.current % allOthers.length] : null;
    const R = CELL / 2 - 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
      ctx.beginPath();
      ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = snake.length - 1; i >= 1; i--) {
      const s = snake[i];
      const cx = s.x * CELL + CELL / 2;
      const cy = s.y * CELL + CELL / 2;
      const u = tailUsers[i - 1];
      const img = u?.profileImageUrl ? imgCache.current.get(u.profileImageUrl) : undefined;
      const segR = Math.max(R - Math.floor(i * 0.3), R - 4);

      ctx.save();
      ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(cx, cy, segR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.restore();

      if (u) clipCircle(ctx, img, cx, cy, segR - 1, COLORS[i % COLORS.length], u.fullName);

      ctx.beginPath(); ctx.arc(cx, cy, segR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6,182,212,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    if (snake.length > 0) {
      const h = snake[0];
      const cx = h.x * CELL + CELL / 2;
      const cy = h.y * CELL + CELL / 2;
      const meImg = me?.profileImageUrl ? imgCache.current.get(me.profileImageUrl) : undefined;
      ctx.save();
      ctx.shadowColor = '#00AEEF'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = '#00AEEF'; ctx.fill();
      ctx.restore();
      clipCircle(ctx, meImg, cx, cy, R - 1, '#00AEEF', me?.fullName || 'ME');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }

    if (foodUser) {
      const cx = food.x * CELL + CELL / 2;
      const cy = food.y * CELL + CELL / 2;
      const fImg = foodUser.profileImageUrl ? imgCache.current.get(foodUser.profileImageUrl) : undefined;
      const pulse = (Math.sin(Date.now() / 200) + 1) / 2;

      ctx.save();
      ctx.shadowColor = '#f43f5e'; ctx.shadowBlur = 12 + pulse * 10;
      ctx.beginPath(); ctx.arc(cx, cy, R + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      clipCircle(ctx, fImg, cx, cy, R - 1, '#f43f5e', foodUser.fullName);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2; ctx.stroke();

      ctx.save();
      ctx.font = '9px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(foodUser.fullName.split(' ')[0], cx, cy + R + 9);
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const gameOver = useCallback(() => {
    gsRef.current = 'over';
    setGs('over');
    if (loopRef.current) clearInterval(loopRef.current);

    const me = meRef.current;
    const finalScore = scoreRef.current;

    // update personal high score
    const hs = parseInt(localStorage.getItem('snakeHighScore') || '0');
    const isNew = finalScore > hs;
    if (isNew) {
      localStorage.setItem('snakeHighScore', String(finalScore));
      setHighScore(finalScore);
    }
    setNewRecord(isNew);

    // always post score to shared leaderboard (API keeps only the best per user)
    // always refresh so the leaderboard stays current
    if (me && finalScore > 0) {
      postScore(me.id, finalScore).then(() => fetchLeaderboard().then(setLeaderboard));
    } else {
      fetchLeaderboard().then(setLeaderboard);
    }
  }, []);

  const startGame = useCallback(() => {
    const startSnake = [{ x: 6, y: 6 }];
    snakeRef.current = startSnake;
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = randFood(startSnake);
    foodIdxRef.current = Math.floor(Math.random() * Math.max(othersRef.current.length, 1));
    tailUsersRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setEatenList([]);
    setNewRecord(false);
    const fUser = othersRef.current.length > 0 ? othersRef.current[foodIdxRef.current % othersRef.current.length] : null;
    setNextFood(fUser);
    gsRef.current = 'playing';
    setGs('playing');
    setTab('game');

    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(() => {
      if (gsRef.current !== 'playing') return;
      dirRef.current = nextDirRef.current;
      const head = snakeRef.current[0];
      const d = dirRef.current;
      const nh: Pt = {
        x: d === 'LEFT' ? head.x - 1 : d === 'RIGHT' ? head.x + 1 : head.x,
        y: d === 'UP' ? head.y - 1 : d === 'DOWN' ? head.y + 1 : head.y,
      };
      if (nh.x < 0 || nh.x >= COLS || nh.y < 0 || nh.y >= ROWS) { gameOver(); return; }
      if (snakeRef.current.slice(1).some(s => s.x === nh.x && s.y === nh.y)) { gameOver(); return; }

      const food = foodRef.current;
      const ate = nh.x === food.x && nh.y === food.y;
      const all = othersRef.current;
      const eatenUser = all.length > 0 ? all[foodIdxRef.current % all.length] : null;

      if (ate) {
        snakeRef.current = [nh, ...snakeRef.current];
        tailUsersRef.current = eatenUser ? [eatenUser, ...tailUsersRef.current] : tailUsersRef.current;
        foodRef.current = randFood(snakeRef.current);
        foodIdxRef.current = (foodIdxRef.current + 1) % Math.max(all.length, 1);
        scoreRef.current += 10;
        setScore(s => s + 10);
        if (eatenUser) setEatenList(prev => [eatenUser, ...prev.filter(u => u.id !== eatenUser.id)]);
        const nextUser = all.length > 0 ? all[foodIdxRef.current % all.length] : null;
        setNextFood(nextUser);
      } else {
        snakeRef.current = [nh, ...snakeRef.current.slice(0, -1)];
      }
    }, SPEED);
  }, [randFood, gameOver]);

  useEffect(() => () => { if (loopRef.current) clearInterval(loopRef.current); }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (tab === 'leaderboard') return;
      const map: Record<string, Dir> = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT', w:'UP', s:'DOWN', a:'LEFT', d:'RIGHT', W:'UP', S:'DOWN', A:'LEFT', D:'RIGHT' };
      const nd = map[e.key];
      if (!nd) return;
      e.preventDefault();
      if (nd !== OPPOSITE[dirRef.current]) nextDirRef.current = nd;
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [tab]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    let nd: Dir;
    if (Math.abs(dx) > Math.abs(dy)) nd = dx > 0 ? 'RIGHT' : 'LEFT';
    else nd = dy > 0 ? 'DOWN' : 'UP';
    if (nd !== OPPOSITE[dirRef.current]) nextDirRef.current = nd;
  };

  const myId = meUser?.id;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-cyan-900/40 p-4 flex flex-col items-center gap-3 select-none" style={{ width: COLS * CELL + 32 }}>

        {/* header bar */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐍</span>
            <span className="text-white font-bold">Snake</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-cyan-400 font-medium">Score: <b>{score}</b></span>
            <span className="text-yellow-400 font-medium">Best: <b>{highScore}</b></span>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-0.5">
              <Icon icon="mdi:close" width={18} />
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="flex w-full rounded-lg overflow-hidden border border-cyan-900/40 text-xs font-semibold">
          <button
            onClick={() => setTab('game')}
            className={`flex-1 py-1.5 transition-colors ${tab === 'game' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            🎮 Game
          </button>
          <button
            onClick={() => { setTab('leaderboard'); fetchLeaderboard().then(setLeaderboard); }}
            className={`flex-1 py-1.5 transition-colors ${tab === 'leaderboard' ? 'bg-yellow-500 text-[#0f172a]' : 'text-gray-400 hover:text-gray-200'}`}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* game view */}
        {tab === 'game' && (
          <>
            <div className="relative rounded-xl overflow-hidden border border-cyan-900/30"
              onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} />

              {gs === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 gap-3">
                  <p className="text-white text-base font-bold">Eat other users to grow!</p>
                  <p className="text-gray-400 text-xs text-center px-6">Arrow keys / WASD to move<br/>Swipe on mobile</p>
                  <button onClick={startGame} className="mt-1 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors">
                    Start Game
                  </button>
                </div>
              )}

              {gs === 'over' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
                  <p className="text-red-400 text-xl font-bold">Game Over!</p>
                  <p className="text-white text-sm">Score: <b className="text-cyan-400">{score}</b></p>
                  {newRecord && <p className="text-yellow-400 text-xs">🏆 New High Score!</p>}
                  {eatenList.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap justify-center max-w-[200px]">
                      <span className="text-gray-400 text-xs w-full text-center mb-0.5">Eaten:</span>
                      {eatenList.slice(0, 8).map(u => (
                        <div key={u.id} title={u.fullName} className="w-7 h-7 rounded-full overflow-hidden border-2 border-pink-400 shrink-0">
                          {u.profileImageUrl
                            ? <img src={u.profileImageUrl} className="w-full h-full object-cover" alt={u.fullName} />
                            : <div className="w-full h-full bg-pink-500 flex items-center justify-center text-[10px] text-white font-bold">{u.fullName[0]}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button onClick={startGame} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors">
                      Play Again
                    </button>
                    <button onClick={() => { setTab('leaderboard'); fetchLeaderboard().then(setLeaderboard); }} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#0f172a] font-bold rounded-lg text-sm transition-colors">
                      🏆 Scores
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full px-1">
              <p className="text-[11px] text-gray-600">Arrow keys / WASD</p>
              {gs === 'playing' && nextFood && (
                <div className="flex items-center gap-1.5 text-[11px] text-pink-400">
                  <span>Next:</span>
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-pink-400 shrink-0">
                    {nextFood.profileImageUrl
                      ? <img src={nextFood.profileImageUrl} className="w-full h-full object-cover" alt={nextFood.fullName} />
                      : <div className="w-full h-full bg-pink-500 flex items-center justify-center text-[8px] text-white font-bold">{nextFood.fullName[0]}</div>}
                  </div>
                  <span className="font-medium">{nextFood.fullName.split(' ')[0]}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* leaderboard view */}
        {tab === 'leaderboard' && (
          <div className="w-full flex flex-col gap-2" style={{ height: ROWS * CELL + 28 }}>
            <div className="text-[11px] text-gray-500 text-center -mb-1">Top 10 · All Staff</div>
            <div className="overflow-y-auto flex-1 flex flex-col gap-1 pr-1">
              {leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                  <Icon icon="mdi:trophy-outline" width={40} />
                  <p className="text-sm">Loading scores...</p>
                </div>
              ) : leaderboard.map((entry, i) => {
                const isMe = entry.userId === myId;
                const rankColor = i < 3 ? RANK_COLORS[i] : '#64748b';
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                const hasPlayed = entry.score > 0;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isMe ? 'bg-cyan-900/50 border border-cyan-500/40' : 'bg-white/5 border border-transparent'}`}
                  >
                    {/* rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {medal && hasPlayed
                        ? <span className="text-base leading-none">{medal}</span>
                        : <span className="text-xs font-bold" style={{ color: rankColor }}>#{i + 1}</span>}
                    </div>

                    {/* avatar */}
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2"
                      style={{ borderColor: isMe ? '#06b6d4' : hasPlayed ? rankColor : '#334155' }}
                    >
                      {entry.profileImageUrl ? (
                        <img
                          src={entry.profileImageUrl}
                          className="w-full h-full object-cover"
                          alt={entry.fullName}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: hasPlayed ? rankColor : '#334155' }}
                        >
                          {entry.fullName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-cyan-300' : hasPlayed ? 'text-white' : 'text-gray-500'}`}>
                        {entry.fullName}
                        {isMe && <span className="text-[10px] text-cyan-500 ml-1">(you)</span>}
                      </p>
                      {!hasPlayed && (
                        <p className="text-[10px] text-gray-600">Not played yet</p>
                      )}
                    </div>

                    {/* score */}
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-base font-bold"
                        style={{ color: hasPlayed ? rankColor : '#475569' }}
                      >
                        {entry.score}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-0.5">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={startGame} className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors flex-shrink-0">
              🎮 Play Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
