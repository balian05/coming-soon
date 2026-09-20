/* Collettivo Studios — web / mobile logo animation.
   Geometry taken 1:1 from the client's Desktop.svg and Mobile.svg artboards. */
const { useComposition, animate, interpolate, clamp, Easing, CompositionStage,
        useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakColor } = window;

const WEB = window.LOGO_WEB;
const CREDIT = WEB.credit;
const INK = '#1c1c1c', ACCENT = '#d32f2f';

const MOTION = {
  flip:  (o) => animate({ ease: Easing.easeOutBack, ...o }),
  enter: (o) => animate({ ease: Easing.easeOutCubic, ...o }),
  glide: (o) => animate({ ease: Easing.easeInOutCubic, ...o }),
};

function CreditBlock({ part, top, scale, frameW, opacity, dy, ink }) {
  const w = (part.x1 - part.x0) * scale, h = (part.y1 - part.y0) * scale;
  return (
    <div style={{ position: 'absolute', left: (frameW - w) / 2, top: top * 1, width: w, height: h,
                  opacity, transform: `translateY(${dy}px)` }}>
      <svg width={w} height={h} viewBox={`${part.x0} ${part.y0} ${part.x1 - part.x0} ${part.y1 - part.y0}`}
           shapeRendering="geometricPrecision" style={{ display: 'block' }}>
        {part.ds.map((d, i) => <path key={i} d={d} fill={ink} />)}
      </svg>
    </div>
  );
}

function makePiece(F) {
  const LOCK_W = F.lock.x1 - F.lock.x0, LOCK_H = F.lock.y1 - F.lock.y0;
  const WORD_W = F.wordEnd - F.lock.x0;
  const WORD_DX0 = (LOCK_W - WORD_W) / 2;
  const VB = `${F.lock.x0} ${F.lock.y0} ${LOCK_W} ${LOCK_H}`;
  const K = F.credit.scale;
  const comingTop = F.credit.comingTop * (F.credit.scale === 1 ? 1 : 1);

  return function Piece({ tw }) {
    const { T, CUES, authoredTotal } = useComposition();
    const { ink, accent, bg } = tw;

    const STAGGER = 0.3, SPAN = 1.1;
    const letters = F.letters.map((gl, i) => {
      const start = 0.25 + i * STAGGER;
      return {
        ...gl,
        rot: MOTION.flip({ from: 88, to: 0, start, end: start + SPAN })(T),
        op: clamp(MOTION.enter({ from: 0, to: 1, start, end: start + 0.35 })(T), 0, 1),
        lift: MOTION.enter({ from: 10, to: 0, start, end: start + SPAN })(T),
      };
    });

    const slideP = MOTION.glide({ from: 0, to: 1, start: CUES.Shift + 0.15, end: CUES.Shift + 1.7 })(T);
    const wordDx = WORD_DX0 * (1 - slideP);
    const wordEdge = F.wordEnd + wordDx;
    const studiosDx = -(F.lock.x1 - F.wordEnd) * (1 - slideP);

    const creditOp = MOTION.enter({ from: 0, to: 1, start: CUES.Credit + 0.25, end: CUES.Credit + 1.1 })(T);
    const creditDy = MOTION.enter({ from: 8, to: 0, start: CUES.Credit + 0.25, end: CUES.Credit + 1.2 })(T);
    const cam = interpolate([0, authoredTotal], [0.99, 1.012], Easing.easeInOutSine)(T);

    return (
      <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: F.lock.x0, top: F.lock.y0, width: LOCK_W, height: LOCK_H,
                      transformOrigin: '50% 50%', transform: `scale(${cam})` }}>
          <div style={{ position: 'absolute', inset: 0, transform: `translateX(${wordDx}px)` }}>
            {letters.map((gl) => {
              const w = gl.x1 - gl.x0;
              return (
                <div key={gl.id} style={{
                  position: 'absolute', top: 0, left: gl.x0 - F.lock.x0, width: w, height: LOCK_H,
                  opacity: gl.op, transformOrigin: '50% 50%',
                  transform: `perspective(${LOCK_H * 18}px) translateY(${gl.lift}px) rotateX(${gl.rot}deg)` }}>
                  <svg width={w} height={LOCK_H} viewBox={`${gl.x0} ${F.lock.y0} ${w} ${LOCK_H}`}
                       shapeRendering="geometricPrecision" style={{ display: 'block', overflow: 'visible' }}>
                    {gl.ds.map((d, k) => <path key={k} d={d} fill={ink} />)}
                  </svg>
                </div>
              );
            })}
          </div>
          <svg width={LOCK_W} height={LOCK_H} viewBox={VB} shapeRendering="geometricPrecision"
               style={{ position: 'absolute', inset: 0, display: 'block', overflow: 'visible' }}>
            <clipPath id={`reveal-${F.W}`}>
              <rect x={wordEdge} y={F.lock.y0 - 40} width={Math.max(0, F.lock.x1 + 6 - wordEdge)} height={LOCK_H + 80} />
            </clipPath>
            <g clipPath={`url(#reveal-${F.W})`}>
              <g transform={`translate(${studiosDx} 0)`}>
                {F.studios.map((d, i) => <path key={'s' + i} d={d} fill={accent} />)}
                {F.tm.map((d, i) => <path key={'t' + i} d={d} fill={ink} />)}
              </g>
            </g>
          </svg>
        </div>
        <CreditBlock part={CREDIT.coming} top={comingTop} scale={K} frameW={F.W}
                     opacity={creditOp} dy={creditDy} ink={ink} />
        <CreditBlock part={CREDIT.copy} top={F.credit.copyTop} scale={K} frameW={F.W}
                     opacity={creditOp} dy={creditDy} ink={ink} />
      </div>
    );
  };
}

const DesktopPiece = makePiece(WEB.desktop);
const MobilePiece = makePiece(WEB.mobile);

function build(key, Piece) {
  return function Animation() {
    const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
    const F = WEB[key];
    const tw = { bg: t.bg || '#ffffff', ink: INK, accent: t.accent || ACCENT };
    return (
      <React.Fragment>
        <CompositionStage width={F.W} height={F.H} bg={tw.bg}
                          scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
          <Piece tw={tw} />
        </CompositionStage>
        <TweaksPanel>
          <TweakSection label="Lockup" />
          <TweakColor label="Background" value={tw.bg} options={['#ffffff', '#faf8f5', '#1c1c1c']}
                      onChange={(v) => setTweak('bg', v)} />
          <TweakColor label="Accent" value={tw.accent} options={['#d32f2f', '#1c1c1c', '#c0392b']}
                      onChange={(v) => setTweak('accent', v)} />
          <TweakSection label="Editing" />
          <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
        </TweaksPanel>
      </React.Fragment>
    );
  };
}

window.DesktopLogoAnimation = build('desktop', DesktopPiece);
window.MobileLogoAnimation = build('mobile', MobilePiece);
