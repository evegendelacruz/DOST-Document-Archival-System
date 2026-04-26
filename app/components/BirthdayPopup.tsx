'use client';

import { useState, useEffect, useRef } from 'react';

interface BirthdayUser {
  id: string;
  fullName: string;
  birthday: string;
  profileImageUrl?: string | null;
}

const CONFETTI_COLORS = ['#00AEEF', '#146184', '#ffd93d', '#6bcb77', '#ffffff', '#00d4ff', '#a29bfe', '#74d7f7'];
const EMOJIS = ['🎂', '🎉', '🎁', '🥳', '🎈', '✨', '🎊', '🌟'];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle' | 'emoji';
  emoji?: string;
  opacity: number;
}

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Particle[] = Array.from({ length: 130 }, () => ({
      x: randomBetween(0.05, 0.95) * canvas.width,
      y: canvas.height + randomBetween(0, 80),
      vx: randomBetween(-2.5, 2.5),
      vy: randomBetween(-9, -3),
      rotation: randomBetween(0, 360),
      rotationSpeed: randomBetween(-6, 6),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: randomBetween(7, 15),
      shape: Math.random() < 0.15 ? 'emoji' : Math.random() < 0.5 ? 'rect' : 'circle',
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      opacity: 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.vy += 0.18;
        p.x += p.vx;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height * 0.72) p.opacity = Math.max(0, p.opacity - 0.013);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.shape === 'emoji') {
          ctx.font = `${p.size * 1.9}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji!, 0, 0);
        } else if (p.shape === 'rect') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.y < -20 && p.opacity > 0) {
          p.y = canvas.height + randomBetween(0, 30);
          p.x = randomBetween(0.05, 0.95) * canvas.width;
          p.vy = randomBetween(-9, -3);
          p.opacity = 1;
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function Avatar({ user, size = 72, ring = false }: { user: BirthdayUser; size?: number; ring?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: ring ? 'linear-gradient(135deg, #00AEEF, #146184, #74d7f7)' : 'rgba(255,255,255,0.15)',
      padding: ring ? '3px' : '2px',
      flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        overflow: 'hidden', background: '#012a3d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt={user.fullName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: size * 0.42 }}>🎂</span>
        )}
      </div>
    </div>
  );
}

function isTodayBirthday(birthday: string): boolean {
  const today = new Date();
  const datePart = birthday.slice(0, 10);
  const parts = datePart.split('-');
  if (parts.length !== 3) return false;
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return month === today.getMonth() && day === today.getDate();
}

export default function BirthdayPopup() {
  const [celebrants, setCelebrants] = useState<BirthdayUser[]>([]);
  const [loggedInId, setLoggedInId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [slide, setSlide] = useState(0); // for multiple celebrants carousel
  const [messagingId, setMessagingId] = useState<string | null>(null);

  useEffect(() => {
    // Only show once per login session
    if (sessionStorage.getItem('birthdayPopupShown')) return;

    // Get logged-in user id
    let userId: string | null = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        userId = parsed?.id || null;
      }
    } catch { /* ignore */ }
    setLoggedInId(userId);

    // Fetch all birthday users and filter for today
    fetch('/api/users/birthdays')
      .then(r => r.ok ? r.json() : [])
      .then((users: BirthdayUser[]) => {
        const todays = users.filter(u => isTodayBirthday(u.birthday));
        if (todays.length > 0) {
          // Sort: logged-in user first if they have a birthday
          todays.sort((a, b) => {
            if (a.id === userId) return -1;
            if (b.id === userId) return 1;
            return 0;
          });
          setCelebrants(todays);
          setVisible(true);
          sessionStorage.setItem('birthdayPopupShown', 'true');
        }
      })
      .catch(() => {});
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 450);
  };

  const handleLeaveMessage = async (celebrant: BirthdayUser) => {
    if (!loggedInId || messagingId === celebrant.id) return;
    setMessagingId(celebrant.id);
    try {
      // Find or create a direct conversation with the celebrant
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': loggedInId },
        body: JSON.stringify({ participantIds: [celebrant.id], isGroup: false }),
      });
      if (res.ok) {
        const conv = await res.json();
        window.dispatchEvent(new CustomEvent('messenger-open-chat', { detail: conv }));
        close();
      }
    } catch { /* ignore */ } finally {
      setMessagingId(null);
    }
  };

  if (!visible || celebrants.length === 0) return null;

  const isMyBirthday = celebrants.some(c => c.id === loggedInId);
  const me = celebrants.find(c => c.id === loggedInId);
  const others = celebrants.filter(c => c.id !== loggedInId);
  const firstName = me?.fullName?.split(' ')[0] || '';

  const sharedStyles = `
    @keyframes bdayIn {
      from { opacity: 0; transform: scale(0.55) translateY(50px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes bdayOut {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.75) translateY(30px); }
    }
    @keyframes floatCake {
      0%,100% { transform: translateY(0px) rotate(-3deg); }
      50%      { transform: translateY(-12px) rotate(3deg); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulseRing {
      0%   { box-shadow: 0 0 0 0 rgba(0,174,239,0.7); }
      70%  { box-shadow: 0 0 0 16px rgba(0,174,239,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,174,239,0); }
    }
    @keyframes spinSlow {
      from { transform: translate(-50%,-50%) rotate(0deg); }
      to   { transform: translate(-50%,-50%) rotate(360deg); }
    }
    @keyframes bounceDot {
      0%,80%,100% { transform: scale(0); }
      40%          { transform: scale(1); }
    }
    @keyframes slideInCard {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes glowPulse {
      0%,100% { opacity: 0.5; }
      50%      { opacity: 1; }
    }
  `;

  // ── Non-birthday user view ──────────────────────────────────────────────────
  if (!isMyBirthday) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-[9999]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }}
        onClick={close}
      >
        <style>{sharedStyles}</style>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(440px, 94vw)',
            borderRadius: '24px',
            background: 'linear-gradient(150deg, #011f30 0%, #063a55 50%, #146184 100%)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,174,239,0.2)',
            animation: closing ? 'bdayOut 0.45s ease forwards' : 'bdayIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
            overflow: 'hidden',
          }}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden rounded-[24px]" style={{ opacity: 0.6 }}>
            <Confetti />
          </div>

          {/* Close (X) button */}
          <button
            onClick={close}
            style={{
              position: 'absolute', top: '12px', right: '14px', zIndex: 10,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: '30px', height: '30px',
              cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
              fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            aria-label="Close"
          >
            ×
          </button>

          {/* Top banner */}
          <div style={{
            position: 'relative', zIndex: 2, width: '100%',
            background: 'linear-gradient(90deg, #00AEEF, #146184, #00d4ff, #146184, #00AEEF)',
            backgroundSize: '200% auto',
            animation: 'shimmer 3s linear infinite',
            padding: '7px 0',
            textAlign: 'center',
            fontSize: '12px', fontWeight: 800, letterSpacing: '2px',
            color: '#fff', textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}>
            🎂 Birthday Celebration Today! 🎂
          </div>

          {/* Celebrant rows */}
          <div style={{ position: 'relative', zIndex: 2, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {celebrants.map((u, idx) => (
              <div
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  animation: `slideInCard 0.4s ${idx * 0.1}s both ease-out`,
                }}
              >
                <Avatar user={u} size={52} ring />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 700, color: '#fff',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {u.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                    🎂 Birthday today!
                  </div>
                </div>
                <button
                  onClick={() => handleLeaveMessage(u)}
                  disabled={messagingId === u.id}
                  style={{
                    flexShrink: 0,
                    padding: '7px 14px',
                    borderRadius: '20px',
                    border: '1px solid rgba(0,174,239,0.5)',
                    cursor: messagingId === u.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '12px',
                    color: '#fff',
                    background: messagingId === u.id
                      ? 'rgba(0,174,239,0.2)'
                      : 'linear-gradient(135deg, rgba(0,174,239,0.35), rgba(20,97,132,0.5))',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    opacity: messagingId === u.id ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (messagingId !== u.id) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #00AEEF, #146184)';
                  }}
                  onMouseLeave={e => {
                    if (messagingId !== u.id) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(0,174,239,0.35), rgba(20,97,132,0.5))';
                  }}
                >
                  {messagingId === u.id ? '...' : '💬 Leave a message'}
                </button>
              </div>
            ))}
          </div>

          {/* Close button */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 20px 20px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={close}
              style={{
                padding: '9px 36px',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                fontWeight: 600, fontSize: '13px',
                color: 'rgba(255,255,255,0.75)',
                background: 'rgba(255,255,255,0.07)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Birthday user's own popup ───────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={close}
    >
      <style>{sharedStyles}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(500px, 94vw)',
          borderRadius: '28px',
          background: 'linear-gradient(150deg, #011f30 0%, #063a55 35%, #0d5f8a 70%, #146184 100%)',
          boxShadow: '0 32px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,174,239,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          animation: closing ? 'bdayOut 0.45s ease forwards' : 'bdayIn 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: '28px',
        }}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px]">
          <Confetti />
        </div>

        {/* Spinning ring decorations */}
        <div style={{
          position: 'absolute', zIndex: 0,
          width: '340px', height: '340px', borderRadius: '50%',
          border: '1px dashed rgba(255,255,255,0.05)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: 'spinSlow 22s linear infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', zIndex: 0,
          width: '460px', height: '460px', borderRadius: '50%',
          border: '1px dashed rgba(255,255,255,0.03)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: 'spinSlow 35s linear infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Top banner */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%',
          background: 'linear-gradient(90deg, #00AEEF, #146184, #00d4ff, #146184, #00AEEF)',
          backgroundSize: '200% auto',
          animation: 'shimmer 3s linear infinite',
          padding: '7px 0',
          textAlign: 'center',
          fontSize: '13px', fontWeight: 800, letterSpacing: '2.5px',
          color: '#ffffff', textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          🎉 Happy Birthday, {firstName}! 🎉
        </div>

        {/* My birthday section */}
        {me && (
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: '22px', padding: '0 24px' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <div style={{ animation: 'pulseRing 2s infinite', borderRadius: '50%' }}>
                <Avatar user={me} size={96} ring />
              </div>
            </div>
            {/* Star badge */}
            <div style={{
              display: 'inline-flex', marginTop: '-16px', marginLeft: '60px',
              position: 'relative', zIndex: 3,
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00AEEF, #146184)',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              border: '2px solid #011f30',
            }}>🌟</div>

            {/* Floating cake */}
            <div style={{ fontSize: '52px', lineHeight: 1, animation: 'floatCake 3s ease-in-out infinite', marginTop: '6px' }}>
              🎂
            </div>

            {/* Shimmer name */}
            <h1 style={{
              margin: '8px 0 0',
              fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 900,
              background: 'linear-gradient(90deg, #ffffff, #74d7f7, #00AEEF, #74d7f7, #ffffff)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 2.5s linear infinite',
            }}>
              Happy Birthday, {firstName}! 🥳
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              Wishing you a wonderful day full of joy and laughter. May this year be your best yet! 🎊
            </p>
          </div>
        )}

        {/* Others also celebrating today */}
        {others.length > 0 && (
          <div style={{
            position: 'relative', zIndex: 2,
            width: 'calc(100% - 40px)',
            marginTop: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '18px',
            padding: '14px 16px',
          }}>
            <p style={{
              margin: '0 0 12px',
              fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
              color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              🎈 Also celebrating today
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {others.map((u, idx) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    animation: `slideInCard 0.4s ${idx * 0.1}s both ease-out`,
                  }}
                >
                  <Avatar user={u} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: 700, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {u.fullName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      🎉 Birthday today!
                    </div>
                  </div>
                  <div style={{ fontSize: '22px', animation: `glowPulse 2s ${idx * 0.3}s infinite` }}>🎈</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bounce dots */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', gap: '6px', marginTop: '16px', alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: ['#00AEEF', '#ffffff', '#146184'][i],
              animation: `bounceDot 1.4s ${i * 0.16}s infinite ease-in-out`,
            }} />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={close}
          style={{
            position: 'relative', zIndex: 2,
            marginTop: '18px',
            padding: '11px 38px',
            borderRadius: '50px',
            border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '14px',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #00AEEF, #146184)',
            boxShadow: '0 6px 22px rgba(0,174,239,0.45)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 30px rgba(0,174,239,0.65)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 22px rgba(0,174,239,0.45)';
          }}
        >
          🎁 Thank you!
        </button>

        <p style={{
          position: 'relative', zIndex: 2,
          margin: '8px 0 0', fontSize: '11px',
          color: 'rgba(255,255,255,0.25)',
        }}>
          Click anywhere to close
        </p>
      </div>
    </div>
  );
}
