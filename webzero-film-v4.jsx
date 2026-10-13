const PAPER = '#ebe7dd', INK = '#161513', SOFT = '#6d6a62', ACC = '#3ddc84';
const CLAY = '#c4613d', OCHRE = '#d4a03e';
const SERIF = "'Instrument Serif', Georgia, serif", SANS = "'Geist', Helvetica, sans-serif", MONO = "'Geist Mono', monospace";

const MOTION = {
  enter: (T, s, d = 0.8) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeOutCubic })(T),
  leave: (T, s, d = 0.6) => animate({ from: 1, to: 0, start: s, end: s + d, ease: Easing.easeInCubic })(T),
  draw: (T, s, d = 1) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeInOutCubic })(T),
};
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };

// Webzero mark in its own units (from the 1024 app icon): 453 x 480, bars 56 tall.
const LOGO_W = 453, LOGO_H = 480, BAR_H = 56;
const ROWS = [[[71, 383]], [[0, 170], [284, 453]], [[0, 170], [213, 453]], [[0, 241], [284, 453]], [[0, 170], [284, 453]], [[0, 170], [284, 453]], [[71, 383]]];
const ROW_Y = [0, 70, 141, 212, 282, 353, 424];
const BARS = ROWS.flatMap((row, r) => row.map(([a, b]) => ({ r, a, b, y: ROW_Y[r] })));
const LAYOUTS = {
  land: { W: 1920, H: 1080, M: 140, k1: [960, 540], k2: [1310, 540, 1.9], wm: { size: 250, top: 330 }, h1: { top: 420, size: 130, width: 1300 }, h2: { top: 400, size: 112, width: 720 }, h3: { top: 320, size: 88, width: 600 }, mission: { top: 608, size: 54, gap: 64 }, bar: 70 },
  port: { W: 1080, H: 1920, M: 80, k1: [540, 960], k2: [540, 1280, 1.6], wm: { size: 200, top: 740 }, h1: { top: 560, size: 120, width: 920 }, h2: { top: 300, size: 112, width: 920 }, h3: { top: 240, size: 88, width: 920 }, mission: { top: 975, size: 56, gap: 64 }, bar: 90 },
};
let L = LAYOUTS.land;
const markH = () => Math.round(L.wm.size * 0.56);

// Camera: screen = anchor + (world - focus) * zoom
function camera(T, CUES, slot) {
  const k1 = { fx: lerp(110, 150, clamp(T / CUES.Agents, 0, 1)), fy: 240, ax: L.k1[0], ay: L.k1[1], z: 8 };
  const k2 = { fx: 226, fy: 240, ax: L.k2[0], ay: L.k2[1], z: L.k2[2] };
  const k3 = { fx: 0, fy: 0, ax: slot.x, ay: slot.y, z: slot.h / LOGO_H };
  const a = MOTION.draw(T, CUES.Agents, 1.7), b = MOTION.draw(T, CUES.Zero, 1.6);
  const mixK = (p, q, t) => ({ fx: lerp(p.fx, q.fx, t), fy: lerp(p.fy, q.fy, t), ax: lerp(p.ax, q.ax, t), ay: lerp(p.ay, q.ay, t), z: Math.exp(lerp(Math.log(p.z), Math.log(q.z), t)) });
  const c = mixK(mixK(k1, k2, a), k3, b);
  return { tx: c.ax - c.fx * c.z, ty: c.ay - c.fy * c.z, z: c.z };
}

function People({ T, CUES }) {
  const vis = MOTION.enter(T, 0.8, 0.8) * MOTION.leave(T, CUES.Agents + 0.2, 0.6);
  if (vis <= 0) return null;
  return [0, 1, 2].map((i) => {
    const x = 30 + ((T * 4.2 + i * 23) % 200), bob = Math.abs(Math.sin(T * 5 + i * 2)) * 1.2;
    return <div key={i} style={{ position: 'absolute', left: x, top: 212 - 7 - bob, width: 6, height: 6, borderRadius: 3, background: PAPER, opacity: vis }} />;
  });
}

function Lane({ bar, T, CUES, bi }) {
  const vis = MOTION.enter(T, CUES.Agents + 0.9 + bar.r * 0.08, 0.6) * MOTION.leave(T, CUES.Zero + 0.2, 0.5);
  if (vis <= 0) return null;
  const len = bar.b - bar.a, n = Math.max(2, Math.round(len / 46));
  const speed = 70 + ((bi * 37) % 50), dir = bar.r % 2 ? -1 : 1;
  return Array.from({ length: n }, (_, k) => {
    const span = len + 20, x = ((((T - CUES.Agents) * speed * dir + k * (span / n) + bi * 13) % span) + span) % span - 20;
    return <div key={k} style={{ position: 'absolute', left: x, top: BAR_H / 2 - 5, width: 18, height: 10, borderRadius: 5, background: PAPER, opacity: vis }} />;
  });
}

function Mark({ T, CUES, slot }) {
  const cam = camera(T, CUES, slot);
  const shadow = lerp(2, 0, MOTION.draw(T, CUES.Zero, 1.6));
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: LOGO_W, height: LOGO_H, transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.z})`, transformOrigin: '0 0' }}>
      {BARS.map((bar, i) => (
        <div key={i} style={{ position: 'absolute', left: bar.a, top: bar.y, width: bar.b - bar.a, height: BAR_H, borderRadius: BAR_H / 2, background: INK, overflow: 'hidden', boxShadow: `0 ${shadow}px 0 rgba(0,0,0,0.2)` }}>
          <Lane bar={bar} T={T} CUES={CUES} bi={i} />
        </div>
      ))}
      <People T={T} CUES={CUES} />
    </div>
  );
}

function Headline({ T, inAt, outAt, top, color, label, labelColor, children, sub, size = 120, width = 1300, center }) {
  const e = MOTION.enter(T, inAt, 0.9), a = e * MOTION.leave(T, outAt, 0.45);
  if (a <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: center ? (L.W - width) / 2 : L.M, top, width, textAlign: center ? 'center' : 'left', textWrap: 'balance', opacity: a, transform: `translateY(${(1 - e) * 28}px)` }}>
      {label && <div style={{ fontFamily: MONO, fontSize: 22, color: labelColor, marginBottom: 26 }}>{label}</div>}
      <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1, letterSpacing: '-0.015em', color }}>{children}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 24, color, opacity: 0.75 * MOTION.enter(T, inAt + 1.1, 0.8), marginTop: 34 }}>{sub}</div>}
    </div>
  );
}

function Wordmark({ T, CUES, slotRef }) {
  const s = CUES.Zero;
  const label = MOTION.enter(T, s + 1.6, 0.7), strike = MOTION.draw(T, s + 2.1, 0.6);
  const mh = markH(), mw = mh * LOGO_W / LOGO_H;
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: 0, right: 0, top: L.wm.top - 92, display: 'flex', justifyContent: 'center', gap: 20, fontFamily: SANS, fontWeight: 500, fontSize: 44, letterSpacing: '-0.02em', color: INK, opacity: label, transform: `translateY(${(1 - label) * 10}px)` }}>
        <span style={{ position: 'relative', color: SOFT }}>Bridge AI<span style={{ position: 'absolute', left: -6, right: -6, top: '54%', height: 4, background: INK, transform: `scaleX(${strike})`, transformOrigin: 'left' }} /></span>
        <span>is now</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: L.wm.top, display: 'flex', justifyContent: 'center', alignItems: 'baseline', fontFamily: SANS, fontWeight: 500, fontSize: L.wm.size, lineHeight: 1, letterSpacing: '-0.055em', color: INK }}>
        {'Webzer'.split('').map((c, i) => {
          const a = MOTION.enter(T, s + 0.9 + i * 0.07, 0.8);
          return <span key={i} style={{ display: 'inline-block', opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>{c}</span>;
        })}
        <span ref={slotRef} style={{ display: 'inline-block', width: mw, height: mh, marginLeft: Math.round(L.wm.size * 0.06), marginBottom: -Math.round(L.wm.size * 0.016) }} />
      </div>
    </React.Fragment>
  );
}

function Mission({ T, CUES }) {
  const tl = useTimeline();
  const s = CUES.Mission;
  if (T < s) return null;
  const ended = !tl.playing && tl.time >= tl.duration - 0.01;
  const a = MOTION.enter(T, s + 0.3, 0.9), cta = MOTION.enter(T, s + 1.2, 0.8);
  const ph = (((T - s - 2) % 1.6) + 1.6) % 1.6 / 1.6, on = T > s + 2 ? 1 : 0;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: L.mission.top, padding: `0 ${L.M}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: L.mission.gap }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: L.mission.size, lineHeight: 1.05, color: INK, textAlign: 'center', textWrap: 'balance', opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>Infrastructure for the agentic web.</div>
      <div style={{ position: 'relative', opacity: cta, transform: `translateY(${(1 - cta) * 20}px)` }}>
        <div style={{ position: 'absolute', inset: -(4 + ph * 22), borderRadius: 999, border: `1.5px solid ${INK}`, opacity: on * (1 - ph) * 0.35 }} />
        <a href="https://webzero.ai" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 22px 20px 36px', borderRadius: 999, background: INK, color: PAPER, fontFamily: SANS, fontWeight: 500, fontSize: 30, whiteSpace: 'nowrap', textDecoration: 'none', cursor: 'pointer', pointerEvents: 'auto' }}>
          Visit webzero.ai
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: PAPER, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, transform: `translateX(${4 * Math.sin((T - s) * 4) * on}px)` }}>→</span>
        </a>
      </div>
      <button type="button" onClick={(e) => { e.stopPropagation(); tl.setTime(0); tl.setPlaying(true); }} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: -20, padding: '14px 28px', borderRadius: 999, background: 'transparent', color: INK, border: `1.5px solid ${INK}`, fontFamily: SANS, fontWeight: 500, fontSize: 26, cursor: 'pointer', pointerEvents: 'auto', opacity: ended ? 1 : 0, visibility: ended ? 'visible' : 'hidden', transition: ended ? 'opacity 0.6s ease' : 'none' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        Repeat
      </button>
    </div>
  );
}

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

function Film() {
  const { T, CUES, authoredTotal } = useComposition();
  const toOchre = MOTION.draw(T, CUES.Agents + 0.2, 1.2), toPaper = MOTION.draw(T, CUES.Zero + 0.2, 1.2);
  const toInk = MOTION.draw(T, CUES.Proof, 0.9);
  const field = toPaper > 0 ? mix(INK, PAPER, toPaper) : toInk > 0 ? mix(OCHRE, INK, toInk) : mix(CLAY, OCHRE, toOchre);
  const topInk = toPaper > 0.5 || toInk < 0.5 ? INK : PAPER;
  const fade = 1; // published page plays once and holds the last frame, so no end fade
  const intro = MOTION.enter(T, 0, 0.6);
  const rootRef = React.useRef(null), slotRef = React.useRef(null);
  const lastT = React.useRef(T), loops = React.useRef(0), run = React.useRef({ from0: false, ok: true });
  {
    const prev = lastT.current, dt = T - prev, r = run.current;
    const wrapped = dt < -1 && prev > authoredTotal - 0.6 && T < 0.6;
    if (wrapped) { if (r.from0 && r.ok) loops.current += 1; r.from0 = true; r.ok = true; }
    else if (dt > 0.4 || dt < -0.05) { r.ok = false; r.from0 = T < 0.3; if (r.from0) r.ok = true; }
    else if (!r.from0 && T < 0.3) { r.from0 = true; r.ok = true; }
    lastT.current = T;
  }
  const pinned = loops.current > 0, pinA = loops.current === 1 && T < 0.8 ? MOTION.enter(T, 0, 0.8) : 1;
  const [slot, setSlot] = React.useState({ x: L.W * 0.67, y: L.wm.top + 70, h: markH() });
  React.useLayoutEffect(() => {
    const m = () => {
      let el = slotRef.current, x = 0, y = 0;
      if (!el || !rootRef.current) return;
      const h = el.offsetHeight;
      while (el && el !== rootRef.current) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      if (h > 0 && x > 0) setSlot({ x, y, h });
    };
    m(); if (document.fonts) document.fonts.ready.then(m);
    const ro = window.ResizeObserver && slotRef.current ? new ResizeObserver(m) : null;
    if (ro) { ro.observe(slotRef.current); ro.observe(rootRef.current); }
    const iv = setInterval(m, 500), stop = setTimeout(() => clearInterval(iv), 6000);
    return () => { if (ro) ro.disconnect(); clearInterval(iv); clearTimeout(stop); };
  }, []);
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: field, opacity: fade * intro }} />
      <div ref={rootRef} style={{ position: 'absolute', inset: 0, opacity: fade * intro }}>
        <Mark T={T} CUES={CUES} slot={slot} />
                <Headline T={T} inAt={1.0} outAt={CUES.Agents} top={L.h1.top} width={L.h1.width} color={PAPER} size={L.h1.size} center>The web was built for humans.</Headline>
        <Headline T={T} inAt={CUES.Agents + 1.1} outAt={CUES.Proof - 0.1} top={L.h2.top} color={INK} size={L.h2.size} width={L.h2.width}>Its new users are agents.</Headline>
        <Headline T={T} inAt={CUES.Proof + 0.6} outAt={CUES.Zero} top={L.h3.top} color={PAPER} size={L.h3.size} width={L.h3.width} sub="— Cloudflare, August 2026">More than half of web requests now come from machines, not humans.</Headline>
        <Wordmark T={T} CUES={CUES} slotRef={slotRef} />
        <Mission T={T} CUES={CUES} />
      </div>
      <div style={{ position: 'absolute', left: L.M, right: L.M, top: L.bar, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 20, color: topInk, opacity: fade * MOTION.leave(T, CUES.Zero + 0.4, 0.8) }}>
        <span>Bridge AI</span>
        <img src="assets/webzero-appicon-dark.png" alt="Webzero" style={{ width: 52, height: 52, opacity: pinned ? 0 : 1 }} />
      </div>
      {pinned && (
        <a href="https://webzero.ai" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}
          style={{ position: 'absolute', right: L.M, top: L.bar - 10, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 24px', borderRadius: 999, background: INK, color: PAPER, border: '1px solid rgba(235,231,221,0.35)', fontFamily: SANS, fontWeight: 500, fontSize: 22, whiteSpace: 'nowrap', textDecoration: 'none', cursor: 'pointer', pointerEvents: 'auto', zIndex: 5, opacity: pinA, transform: `translateY(${(1 - pinA) * -10}px)` }}>
          Visit webzero.ai
          <span style={{ width: 34, height: 34, borderRadius: '50%', background: PAPER, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>→</span>
        </a>
      )}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: GRAIN, backgroundPosition: `${(Math.floor(T * 12) * 37) % 260}px ${(Math.floor(T * 12) * 91) % 260}px`, opacity: 0.6, mixBlendMode: 'multiply' }} />
    </div>
  );
}

function useOrientation() {
  const get = () => (window.innerHeight > window.innerWidth * 1.05 ? 'port' : 'land');
  const [o, setO] = React.useState(get);
  React.useEffect(() => { const f = () => setO(get()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return o;
}

function WebzeroFilmV4() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const o = useOrientation();
  L = LAYOUTS[o];
  return (
    <React.Fragment>
      <CompositionStage key={o} width={L.W} height={L.H} bg={PAPER} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
        <Film />
      </CompositionStage>
      <TweaksPanel>
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.WebzeroFilmV4 = WebzeroFilmV4;
