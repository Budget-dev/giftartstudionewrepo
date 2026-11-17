'use client';

/**
 * GrandOpeningOverlay
 * White + gold ribbon-cutting inauguration with interactive user click-to-cut,
 * countdown, fireworks, and "जय शंकर" (JAI SHANKAR).
 * DESKTOP ONLY: renders nothing on phones/tablets.
 */
import { useEffect, useRef, useState } from 'react';

interface GrandOpeningOverlayProps {
  minWidth?: number;
  once?: boolean;
  until?: string;
  storageKey?: string;
  onFinish?: () => void;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Noto+Serif+Devanagari:wght@700&family=Cormorant+Garamond:ital,wght@1,500&display=swap');
#gas-open{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:radial-gradient(ellipse at 50% 45%,rgba(255,255,255,.98),rgba(251,245,230,.98) 80%);backdrop-filter:blur(8px);
  opacity:1;transition:opacity .8s ease}
@media (max-width:1023px),(hover:none),(pointer:coarse){#gas-open{display:none !important}}
#gas-open.out{opacity:0;pointer-events:none}
#gas-open *{box-sizing:border-box}
#gas-fx{position:absolute;inset:0;width:100%;height:100%}
.gas-frame{position:absolute;inset:14px;border:1px solid rgba(184,134,11,.55);pointer-events:none}
.gas-frame::before{content:"";position:absolute;inset:5px;border:1px solid rgba(184,134,11,.25)}
.gas-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 62%,rgba(255,214,110,.85),rgba(255,226,150,.35) 40%,transparent 70%);opacity:0;pointer-events:none}
.gas-flash.go{animation:gflash 1.2s ease-out}
@keyframes gflash{0%{opacity:1}100%{opacity:0}}
.gas-top{position:absolute;top:6%;left:0;right:0;text-align:center;transition:opacity 1s;font-family:'Cinzel',Georgia,serif}
.gas-top small{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:clamp(16px,2.4vw,22px);color:#8a6410;letter-spacing:.08em}
.gas-top b{display:block;margin-top:4px;font-weight:700;font-size:clamp(26px,4.5vw,50px);letter-spacing:.14em;color:#9a6d08;text-shadow:0 1px 0 #fff,0 6px 16px rgba(184,134,11,.25)}
.gas-top .gas-subtitle{display:block;margin-top:4px;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:clamp(15px,1.8vw,20px);color:#b8860b;letter-spacing:.1em}

.gas-cd{position:absolute;left:50%;top:34%;width:clamp(150px,22vw,230px);aspect-ratio:1;transform:translate(-50%,-50%);opacity:0;transition:opacity .6s}
.gas-cd.vis{opacity:1}
.gas-cd svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.gas-cd .bg{fill:rgba(255,255,255,.65);stroke:rgba(184,134,11,.25);stroke-width:1}
.gas-cd .rg{fill:none;stroke:#c8941a;stroke-width:2.4;stroke-linecap:round;stroke-dasharray:301.6;stroke-dashoffset:0;filter:drop-shadow(0 0 4px rgba(212,160,23,.7))}
.gas-cd.t .rg{animation:ringp 1s linear forwards}
@keyframes ringp{to{stroke-dashoffset:301.6}}
.gas-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(84px,14vw,150px);line-height:1;
  background:linear-gradient(180deg,#8a5a05 0%,#d4a017 30%,#f7d774 48%,#b8860b 68%,#7a4f04 100%);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0}
.gas-cd.t .gas-num{animation:cdn 1s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes cdn{0%{opacity:0;transform:scale(1.4);filter:blur(12px)}18%{opacity:1;transform:scale(1);filter:blur(0)}78%{opacity:1}100%{opacity:0;transform:scale(.9)}}
.gas-cap{position:absolute;left:0;right:0;top:100%;margin-top:10px;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:clamp(16px,2.2vw,22px);color:#8a6410}

.gas-ribbon{position:absolute;left:0;right:0;top:60%;height:68px;transform:translateY(-50%);opacity:1;transition:opacity .6s}
.gas-half{position:absolute;top:0;height:100%;width:50.3%;filter:drop-shadow(0 14px 10px rgba(60,20,10,.45));
  background:
   linear-gradient(180deg,rgba(0,0,0,.5) 0,rgba(255,255,255,0) 16%,rgba(255,205,210,.55) 36%,rgba(255,255,255,0) 54%,rgba(0,0,0,.45) 100%),
   linear-gradient(90deg,rgba(0,0,0,.22),rgba(255,255,255,.10) 28%,rgba(0,0,0,.24) 58%,rgba(255,255,255,.07) 82%,rgba(0,0,0,.2)) 0 0/460px 100%,
   repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 1px,transparent 1px 3px),#a8112c}
.gas-half::before{content:"";position:absolute;left:0;right:0;top:6px;bottom:6px;border-top:1px dashed rgba(255,225,170,.6);border-bottom:1px dashed rgba(255,225,170,.6)}
.gas-half.l{left:0;transform-origin:0 50%}
.gas-half.r{right:0;transform-origin:100% 50%}
.gas-ribbon .gas-half{animation:sway 3.6s ease-in-out infinite alternate}
.gas-ribbon .gas-half.r{animation-delay:-1.8s}
@keyframes sway{from{transform:translateY(-1.5px) rotate(-.12deg)}to{transform:translateY(1.5px) rotate(.12deg)}}
.gas-ribbon.cut .l{clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%);animation:dropL 2.6s cubic-bezier(.45,0,.9,.5) forwards}
.gas-ribbon.cut .r{clip-path:polygon(9px 0,100% 0,100% 100%,0 100%);animation:dropR 2.6s cubic-bezier(.45,0,.9,.5) forwards}
@keyframes dropL{0%{transform:rotate(0)}7%{transform:rotate(-6deg)}45%{transform:rotate(66deg)}70%{transform:rotate(88deg)}85%{transform:rotate(80deg)}100%{transform:rotate(84deg);opacity:0}}
@keyframes dropR{0%{transform:rotate(0)}7%{transform:rotate(6deg)}45%{transform:rotate(-66deg)}70%{transform:rotate(-88deg)}85%{transform:rotate(-80deg)}100%{transform:rotate(-84deg);opacity:0}}
.gas-bow{position:absolute;left:50%;top:50%;width:230px;margin:-86px 0 0 -115px;filter:drop-shadow(0 14px 10px rgba(60,20,10,.5))}
.gas-ribbon.cut .gas-bow{animation:dropB 1.9s cubic-bezier(.5,0,.9,.6) forwards}
@keyframes dropB{15%{transform:translateY(-14px) rotate(-3deg)}to{transform:translateY(105vh) rotate(16deg)}}

.gas-sc{position:absolute;left:50%;top:50%;width:230px;margin:-46px 0 0 -4px;transform:translateX(0);
  transition:transform 1.4s cubic-bezier(.25,.7,.2,1);filter:drop-shadow(0 12px 8px rgba(40,30,10,.5))}
.gas-sc.gone{transform:translateX(75vw);transition-duration:1s;transition-timing-function:ease-in}
.gas-sc .a,.gas-sc .b{transform-origin:122px 40px}
.gas-sc .a{transform:rotate(17deg)} .gas-sc .b{transform:rotate(-17deg)}
.gas-sc.snap .a{animation:sa .42s 3 ease-in-out} .gas-sc.snap .b{animation:sb .42s 3 ease-in-out}
@keyframes sa{50%{transform:rotate(-.5deg)}} @keyframes sb{50%{transform:rotate(.5deg)}}

.gas-cut-btn{
  position:absolute;top:76%;left:50%;transform:translate(-50%,0);cursor:pointer;z-index:20;
  font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(13px,2vw,17px);letter-spacing:.22em;color:#3b2602;
  background:linear-gradient(135deg,#fff2be 0%,#f7d774 35%,#d4a017 65%,#a8760c 100%);
  border:1.5px solid #8a5c08;padding:16px 42px;border-radius:9999px;
  box-shadow:0 12px 32px rgba(184,134,11,.45),0 0 24px rgba(247,215,116,.6),inset 0 1px 0 rgba(255,255,255,.9);
  transition:all .4s cubic-bezier(.2,.8,.2,1);animation:pulseCut 2.2s infinite ease-in-out;
}
.gas-cut-btn:hover{
  transform:translate(-50%,-2px) scale(1.04);
  box-shadow:0 16px 40px rgba(184,134,11,.6),0 0 32px rgba(247,215,116,.85);
}
@keyframes pulseCut{
  0%,100%{box-shadow:0 10px 24px rgba(184,134,11,.35),0 0 0 rgba(247,215,116,0)}
  50%{box-shadow:0 16px 36px rgba(184,134,11,.55),0 0 28px rgba(247,215,116,.75)}
}
.gas-cut-btn.hide{opacity:0;pointer-events:none;transform:translate(-50%,15px) scale(0.95);transition:all .4s}

.gas-name{position:absolute;left:0;right:0;top:46%;transform:translateY(-50%);text-align:center;pointer-events:none}
.gas-om{display:block;font-family:'Noto Serif Devanagari',serif;font-size:clamp(28px,4vw,44px);color:#b8860b;opacity:0;transition:opacity 2s;text-shadow:0 0 18px rgba(255,200,80,.7)}
.gas-hi{display:block;line-height:1.25;font-family:'Noto Serif Devanagari','Nirmala UI',serif;font-weight:700;font-size:clamp(54px,13vw,150px)}
.gas-hi span{display:inline-block;margin:0 .13em;opacity:0;filter:blur(16px);transform:scale(1.14);transition:opacity 2.4s ease-out,filter 2.4s ease-out,transform 2.8s ease-out;
  background:linear-gradient(180deg,#8a5a05 0%,#d4a017 30%,#f7d774 46%,#b8860b 66%,#7a4f04 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.gas-hi span+span{transition-delay:.5s}
.gas-hiw{display:block;filter:drop-shadow(0 2px 1px rgba(255,255,255,.95)) drop-shadow(0 8px 14px rgba(150,100,10,.35))}
.gas-en{display:flex;align-items:center;justify-content:center;gap:clamp(12px,2vw,26px);margin-top:4px;font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(18px,3.8vw,40px);letter-spacing:.38em;color:#8a6410}
.gas-en::before,.gas-en::after{content:"";height:1px;width:clamp(30px,9vw,120px);background:linear-gradient(90deg,transparent,#b8860b)}
.gas-en::after{transform:scaleX(-1)}
.gas-en i{display:inline-block;font-style:normal;opacity:0;filter:blur(8px);transition:opacity 1.2s,filter 1.2s}
.gas-sub{display:block;margin-top:18px;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:clamp(17px,2.8vw,26px);color:#8a6410;opacity:0;transition:opacity 2s 2.2s}
.gas-name.go .gas-om,.gas-name.go .gas-sub{opacity:1}
.gas-name.go .gas-hi span,.gas-name.go .gas-en i{opacity:1;filter:none;transform:none}

.gas-btn{position:absolute;bottom:7%;left:50%;transform:translate(-50%,12px);opacity:0;pointer-events:none;cursor:pointer;
  font-family:'Cinzel',Georgia,serif;font-weight:700;font-size:clamp(13px,2vw,16px);letter-spacing:.2em;color:#3b2602;
  background:linear-gradient(#f6d985,#d4a017 55%,#a8760c);border:1px solid #8a5c08;padding:15px 36px;border-radius:2px;
  box-shadow:0 10px 24px rgba(150,100,10,.35),inset 0 1px 0 rgba(255,255,255,.7);transition:all 1s}
.gas-btn.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.gas-btn:hover{filter:brightness(1.08)}
.gas-btn:focus-visible,.gas-skip:focus-visible{outline:2px solid #8a5c08;outline-offset:3px}
.gas-skip{position:absolute;top:28px;right:30px;background:transparent;color:#8a6410;border:1px solid rgba(138,100,16,.5);border-radius:2px;padding:7px 16px;cursor:pointer;font:500 13px 'Cinzel',serif;letter-spacing:.15em;z-index:25}
.gas-skip:hover{background:rgba(184,134,11,.12)}
.gas-sound-btn{position:absolute;top:28px;right:110px;background:transparent;color:#8a6410;border:1px solid rgba(138,100,16,.5);border-radius:2px;padding:7px 14px;cursor:pointer;font:600 12px 'Cinzel',serif;letter-spacing:.12em;z-index:25;transition:all .2s;display:flex;align-items:center;gap:6px}
.gas-sound-btn:hover{background:rgba(184,134,11,.12)}
@media (prefers-reduced-motion:reduce){.gas-sc,.gas-hi span,.gas-en i{transition-duration:.01s}.gas-ribbon .gas-half{animation:none}}
`;

/**
 * Web Audio Sound Synthesizer for Festive Cracker, Fireworks, Countdown, and Ceremony Sounds
 */
class CeremonySoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // 1. Scissor Cut Click
  public playSnip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const hp = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.08);

    hp.type = 'highpass';
    hp.frequency.setValueAtTime(950, t);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(hp);
    hp.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 2. Countdown Chime (3, 2, 1)
  public playChime(pitch: number = 440) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    [1, 2, 3, 4.2].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * ratio, t);

      const decay = 0.9 / (i + 1);
      const amp = 0.28 / (i + 1);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + decay);
    });
  }

  // 3. Rocket Launch Whoosh
  public playRocketWhoosh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const len = Math.floor(ctx.sampleRate * 0.45);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
    filter.Q.setValueAtTime(3.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  // 4. Single Cracker Pop / Pataka
  public playCrackerPop(delaySec: number = 0, pitchMod: number = 1, volume: number = 0.45) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delaySec;

    // Sharp noise snap
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 * pitchMod, t);
    filter.Q.setValueAtTime(2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.12);

    // Bass punch
    const osc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.09);

    thudGain.gain.setValueAtTime(volume * 1.1, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(thudGain);
    thudGain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // 5. Firecracker String (Ladi / Rapid Fire Patakas)
  public playCrackerString(count: number = 18, intervalMs: number = 70) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const jitter = (Math.random() * 26 - 13);
      const delay = Math.max(0, (i * intervalMs + jitter) / 1000);
      const pitch = 0.75 + Math.random() * 0.85;
      const vol = 0.35 + Math.random() * 0.25;
      this.playCrackerPop(delay, pitch, vol);
    }
  }

  // 6. Grand Aerial Fireworks Blast (Boom + Crackle sparks)
  public playGrandFirework() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Heavy Sub-Bass Boom
    const osc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(24, t + 0.55);

    boomGain.gain.setValueAtTime(0.75, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(boomGain);
    boomGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.7);

    // Sizzling burst
    const len = Math.floor(ctx.sampleRate * 0.45);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.4);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2100, t);
    bp.Q.setValueAtTime(1.5, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.5);

    // Trailing sparks crackle
    for (let i = 0; i < 6; i++) {
      const sparkDelay = 0.08 + i * 0.06 + Math.random() * 0.03;
      this.playCrackerPop(sparkDelay, 1.3 + Math.random() * 0.7, 0.25);
    }
  }

  // 7. Divine Celebratory Golden Chords (Jai Shankar reveal)
  public playCelebrationFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      const noteStart = t + idx * 0.07;
      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.16 / (idx + 1), noteStart + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 2.6);
    });
  }

  public destroy() {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch (e) {}
    }
    this.ctx = null;
  }
}

const LETTERS = 'JAI SHANKAR'.split('');

export default function GrandOpeningOverlay({
  minWidth = 1024,
  once = true,
  until,
  storageKey = 'gasOpened',
  onFinish,
}: GrandOpeningOverlayProps) {
  const [active, setActive] = useState(true);
  const [hasCut, setHasCut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<CeremonySoundEngine | null>(null);
  const closeRef = useRef<(() => void) | null>(null);
  const triggerCutRef = useRef<(() => void) | null>(null);

  const r = {
    root: useRef<HTMLDivElement>(null),
    cv: useRef<HTMLCanvasElement>(null),
    ribbon: useRef<HTMLDivElement>(null),
    sc: useRef<SVGSVGElement>(null),
    name: useRef<HTMLDivElement>(null),
    btn: useRef<HTMLButtonElement>(null),
    cutBtn: useRef<HTMLButtonElement>(null),
    top: useRef<HTMLDivElement>(null),
    flash: useRef<HTMLDivElement>(null),
    cd: useRef<HTMLDivElement>(null),
    num: useRef<HTMLDivElement>(null),
  };

  /* 1) Session / device gate */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desktop = window.matchMedia(`(min-width: ${minWidth}px) and (hover: hover) and (pointer: fine)`).matches;
    if (!desktop) {
      setActive(false);
      return;
    }
    if (until && Date.now() > new Date(until).getTime() + 86400000) {
      setActive(false);
      return;
    }
    const forced = window.location.hash === '#opening';
    let seen = false;
    try {
      seen = sessionStorage.getItem(storageKey) === '1';
    } catch (e) {}

    if (once && seen && !forced) {
      setActive(false);
    }
  }, [minWidth, once, until, storageKey]);

  /* 2) Setup Canvas & Interactive Cut Trigger */
  useEffect(() => {
    if (!active) return;
    const root = r.root.current, cv = r.cv.current;
    if (!root || !cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const ribbon = r.ribbon.current, sc = r.sc.current, nm = r.name.current, btn = r.btn.current,
          top = r.top.current, flash = r.flash.current, cd = r.cd.current, num = r.num.current,
          cutBtn = r.cutBtn.current;
    if (!ribbon || !sc || !nm || !btn || !top || !flash || !cd || !num) return;

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const K = reduce ? 0.3 : 1;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const R = Math.random;
    let W = 0, H = 0, raf = 0, auto = false, done = false;
    const P: any[] = [];
    const RK: any[] = [];
    const GL: any[] = [];
    const timers: any[] = [];
    const prevOverflow = document.documentElement.style.overflow;

    if (!soundRef.current) {
      soundRef.current = new CeremonySoundEngine();
    }
    const sound = soundRef.current;

    const size = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const HUES = [42, 42, 38, 350, 215, 150, 310, 24];
    const add = (x: number, y: number, vx: number, vy: number, o?: any) => {
      P.push(Object.assign({ x, y, px: x, py: y, vx, vy, l: 1, d: .012, g: .04, f: .985, h: 40, s: 92, w: 1.8, tw: 0, k: 0 }, o));
    };
    let lastBurstSound = 0;
    const burst = (x: number, y: number, type?: string) => {
      const hue = HUES[(R() * HUES.length) | 0];
      const n = type === 'willow' ? 120 : type === 'ring' ? 80 : 150;
      const sp = type === 'willow' ? 5.2 : 6.4;
      GL.push({ x, y, l: 1, h: hue });
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 2 * i / n + R() * .05;
        const s = type === 'ring' ? sp * .8 * (1 + R() * .03) : sp * (.3 + R() * .7);
        if (type === 'willow') add(x, y, Math.cos(a) * s, Math.sin(a) * s, { h: 40, d: .0055, g: .055, f: .972, w: 2, tw: 1 });
        else add(x, y, Math.cos(a) * s, Math.sin(a) * s, { h: hue + R() * 14, d: .010 + R() * .008, g: .045, f: .972, tw: R() < .45 ? 1 : 0 });
      }
      for (let i = 0; i < 3; i++) add(x + (R() - .5) * 30, y + (R() - .5) * 30, (R() - .5) * .6, -.15, { k: 3, d: .004, w: 26 + R() * 20, g: -.002, f: .995 });

      if (auto && sound && Date.now() - lastBurstSound > 220) {
        lastBurstSound = Date.now();
        if (type === 'willow' || R() < 0.4) {
          sound.playGrandFirework();
        } else {
          sound.playCrackerPop(0, 0.85 + R() * 0.7, 0.35);
        }
      }
    };
    const launch = (x?: number) => {
      if (sound && auto && R() < 0.3) {
        sound.playRocketWhoosh();
      }
      RK.push({ x: x || W * (.12 + R() * .76), y: H + 10, vy: -(10 + R() * 4.5), ty: H * (.1 + R() * .3), t: ['peony', 'peony', 'ring', 'willow'][(R() * 4) | 0] });
    };
    const fountain = (x: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (R() - .5) * .7, s = 8 + R() * 9;
        add(x, H + 4, Math.cos(a) * s, Math.sin(a) * s, { h: 38 + R() * 10, s: 100, d: .012 + R() * .012, g: .2, f: .99, w: 1.6, tw: 1 });
      }
      for (let i = 0; i < 12; i++) {
        const b = -Math.PI / 2 + (R() - .5) * 1.2, q = 9 + R() * 8;
        add(x, H + 4, Math.cos(b) * q, Math.sin(b) * q, { h: R() < .5 ? 350 : 42, s: 85, d: .006, g: .18, f: .99, w: 5, k: 1, rot: R() * 6, vr: R() * .3 - .15 });
      }
    };

    const frame = () => {
      cx.globalCompositeOperation = 'destination-out'; cx.fillStyle = 'rgba(0,0,0,.14)'; cx.fillRect(0, 0, W, H);
      cx.globalCompositeOperation = 'source-over';
      for (let i = GL.length - 1; i >= 0; i--) {
        const g = GL[i];
        const gr = cx.createRadialGradient(g.x, g.y, 0, g.x, g.y, Math.min(W, H) * .5);
        gr.addColorStop(0, `hsla(${g.h},100%,60%,${g.l * .3})`); gr.addColorStop(1, `hsla(${g.h},100%,60%,0)`);
        cx.fillStyle = gr; cx.fillRect(g.x - W, g.y - H, W * 2, H * 2); g.l -= .06; if (g.l <= 0) GL.splice(i, 1);
      }
      for (let i = RK.length - 1; i >= 0; i--) {
        const k = RK[i]; k.y += k.vy; k.vy *= .987;
        add(k.x + (R() - .5) * 2, k.y, (R() - .5) * .6, R() * 1.2, { h: 34, d: .07, g: .02, w: 1.4 });
        cx.fillStyle = '#9a6a0a'; cx.fillRect(k.x - 1, k.y, 2, 7);
        if (k.y <= k.ty || k.vy > -2.2) { burst(k.x, k.y, k.t); RK.splice(i, 1); }
      }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.px = p.x; p.py = p.y; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.f; p.l -= p.d; if (p.f < .98) p.vy *= p.f;
        if (p.l <= 0 || p.y > H + 40) { P.splice(i, 1); continue; }
        if (p.k === 3) {
          p.w += .28; const sg = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w);
          sg.addColorStop(0, `rgba(120,108,90,${p.l * .035})`); sg.addColorStop(1, 'rgba(120,108,90,0)');
          cx.fillStyle = sg; cx.fillRect(p.x - p.w, p.y - p.w, p.w * 2, p.w * 2); continue;
        }
        let al = p.l; if (p.tw && p.l < .45) al *= (R() < .5 ? 1 : .2);
        if (p.k === 1) {
          cx.save(); p.rot += p.vr; cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(1, Math.cos(p.rot * 3));
          cx.fillStyle = `hsla(${p.h},${p.s}%,48%,${Math.min(1, al * 1.6)})`; cx.fillRect(-p.w, -p.w / 2, p.w * 2, p.w); cx.restore(); continue;
        }
        const light = Math.round(58 - (1 - p.l) * 14);
        cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(p.px - p.vx * .8, p.py - p.vy * .8); cx.lineTo(p.x, p.y);
        cx.strokeStyle = `hsla(${p.h},${p.s}%,${light}%,${al * .2})`; cx.lineWidth = p.w * 3.2; cx.stroke();
        cx.strokeStyle = `hsla(${p.h},${p.s}%,${light - 4}%,${al})`; cx.lineWidth = p.w; cx.stroke();
      }
      if (auto && R() < .045) launch();
      raf = requestAnimationFrame(frame);
    };

    const at = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms * K));
    };

    const tick = (n: number) => {
      num.textContent = n.toString();
      cd.classList.remove('t');
      void cd.offsetWidth;
      cd.classList.add('t');
      launch(W * (n === 3 ? .25 : n === 2 ? .75 : .5));
    };

    const close = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      timers.length = 0;
      root.classList.add('out');
      try {
        sessionStorage.setItem(storageKey, '1');
      } catch (e) {}
      timers.push(setTimeout(() => {
        setActive(false);
        if (onFinish) onFinish();
      }, 900));
    };
    closeRef.current = close;

    /* Interactive Cut Ceremony triggered on user click */
    let ceremonyStarted = false;
    const performCut = () => {
      if (ceremonyStarted || done) return;
      ceremonyStarted = true;
      setHasCut(true);

      if (cutBtn) cutBtn.classList.add('hide');

      // 1. Scissors snip with sound effect
      if (sound) {
        sound.init();
        sound.playSnip();
      }
      sc.classList.add('snap');

      // 2. The Cut (Ribbon falls, flash, cracker string + rocket fireworks)
      at(450, () => {
        ribbon.classList.add('cut');
        top.style.opacity = '0';
        flash.classList.add('go');
        if (sound) {
          sound.playRocketWhoosh();
          sound.playGrandFirework();
          sound.playCrackerString(16, 60);
        }
        fountain(W * .08, 120);
        fountain(W * .92, 120);
        fountain(W * .5, 80);
        launch(W * .5);
      });

      // 3. Scissors exit
      at(1200, () => {
        sc.classList.add('gone');
      });

      // 4. Countdown 3... 2... 1... with resonant golden chimes and whooshes
      at(1600, () => {
        cd.classList.add('vis');
        if (sound) {
          sound.playChime(440);
          sound.playRocketWhoosh();
        }
        tick(3);
      });
      at(2700, () => {
        if (sound) {
          sound.playChime(554.37);
          sound.playRocketWhoosh();
        }
        tick(2);
      });
      at(3800, () => {
        if (sound) {
          sound.playChime(659.25);
          sound.playRocketWhoosh();
        }
        tick(1);
      });

      // 5. Celebration & जय शंकर (Divine fanfare + grand fireworks + continuous cracker ladi)
      at(4900, () => {
        cd.classList.remove('vis');
        nm.classList.add('go');
        auto = true;
        if (sound) {
          sound.playCelebrationFanfare();
          sound.playGrandFirework();
          sound.playCrackerString(28, 55);
        }
        fountain(W * .08, 100);
        fountain(W * .92, 100);
        launch(W * .3);
        launch(W * .7);
        launch(W * .5);
      });

      // 6. Enter Store Button
      at(7500, () => {
        btn.classList.add('show');
      });
    };
    triggerCutRef.current = performCut;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onMq = (e: MediaQueryListEvent) => {
      if (!e.matches) close();
    };
    if (mq.addEventListener) mq.addEventListener('change', onMq);

    document.documentElement.style.overflow = 'hidden';
    frame();

    return () => {
      done = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      window.removeEventListener('keydown', onKey);
      if (mq.removeEventListener) mq.removeEventListener('change', onMq);
      document.documentElement.style.overflow = prevOverflow;
      sound?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, minWidth, storageKey]);

  if (!active) return null;

  const closeNow = () => closeRef.current && closeRef.current();
  const startCut = () => triggerCutRef.current && triggerCutRef.current();

  const toggleSound = () => {
    if (soundRef.current) {
      soundRef.current.init();
      const next = !soundRef.current.enabled;
      soundRef.current.enabled = next;
      setIsMuted(!next);
      if (next) {
        soundRef.current.playCrackerPop(0, 1.2, 0.35);
      }
    }
  };

  return (
    <div id="gas-open" ref={r.root} role="dialog" aria-label="GiftArtStudio grand opening">
      <style>{CSS}</style>
      <canvas id="gas-fx" ref={r.cv} />
      <div className="gas-frame" />
      <div className="gas-flash" ref={r.flash} />
      <button 
        className="gas-sound-btn" 
        type="button" 
        onClick={toggleSound}
        title={isMuted ? "Unmute Sound" : "Mute Sound"}
      >
        {isMuted ? "🔇 SOUND: OFF" : "🔊 SOUND: ON"}
      </button>
      <button className="gas-skip" type="button" onClick={closeNow}>SKIP</button>

      <div className="gas-top" ref={r.top}>
        <small>Welcome to</small>
        <b>GIFTARTSTUDIO</b>
        <span className="gas-subtitle">✦ Grand Inauguration Ceremony ✦</span>
      </div>

      <div className="gas-cd" ref={r.cd} aria-live="polite">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="bg" cx="50" cy="50" r="48" />
          <circle className="rg" cx="50" cy="50" r="48" />
        </svg>
        <div className="gas-num" ref={r.num}>3</div>
        <div className="gas-cap">Opening our doors in</div>
      </div>

      <div className="gas-ribbon" ref={r.ribbon} onClick={!hasCut ? startCut : undefined} style={{ cursor: !hasCut ? 'pointer' : 'default' }}>
        <div className="gas-half l" /><div className="gas-half r" />
        <svg className="gas-bow" viewBox="0 0 230 180" aria-hidden="true">
          <defs>
            <linearGradient id="gSat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6a0a1e" /><stop offset=".38" stopColor="#d51f3e" /><stop offset=".52" stopColor="#ff8497" /><stop offset=".7" stopColor="#bd1631" /><stop offset="1" stopColor="#5e081a" /></linearGradient>
            <linearGradient id="gSat2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a0f27" /><stop offset=".5" stopColor="#e5324f" /><stop offset="1" stopColor="#6a0a1e" /></linearGradient>
          </defs>
          <path d="M112 88 L84 172 L102 160 L112 178 L120 100Z" fill="url(#gSat2)" />
          <path d="M118 88 L146 172 L128 160 L118 178 L110 100Z" fill="url(#gSat2)" opacity=".92" />
          <path d="M115 84 C80 8 6 14 10 78 C14 130 78 126 115 92Z" fill="url(#gSat)" />
          <path d="M115 84 C124 8 224 14 220 78 C216 130 152 126 115 92Z" fill="url(#gSat)" />
          <path d="M108 86 C80 40 40 38 34 74 C40 100 80 104 108 90Z" fill="#000" opacity=".22" />
          <path d="M122 86 C150 40 190 38 196 74 C190 100 150 104 122 90Z" fill="#000" opacity=".22" />
          <rect x="98" y="62" width="34" height="46" rx="10" fill="url(#gSat)" />
          <rect x="98" y="62" width="34" height="46" rx="10" fill="none" stroke="rgba(255,200,205,.45)" strokeWidth="1.5" />
        </svg>
        <svg className="gas-sc" ref={r.sc} viewBox="0 0 200 80" aria-hidden="true">
          <defs>
            <linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fafcff" /><stop offset=".45" stopColor="#aeb8c4" /><stop offset=".55" stopColor="#6c7784" /><stop offset="1" stopColor="#e2e8ef" /></linearGradient>
            <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff1b0" /><stop offset=".4" stopColor="#d9a520" /><stop offset=".7" stopColor="#8a6208" /><stop offset="1" stopColor="#f3cf5d" /></linearGradient>
            <radialGradient id="gPiv" cx=".35" cy=".3"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#6a5410" /></radialGradient>
          </defs>
          <g className="b">
            <polygon points="3,40 124,51 130,38 98,37" fill="url(#gSteel)" stroke="#59636f" strokeWidth=".6" />
            <line x1="6" y1="41" x2="120" y2="49" stroke="#fff" strokeOpacity=".8" strokeWidth=".8" />
            <path d="M124 45 L150 58" stroke="url(#gGold)" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="166" cy="62" rx="18" ry="11" fill="none" stroke="url(#gGold)" strokeWidth="7" transform="rotate(18 166 62)" />
          </g>
          <g className="a">
            <polygon points="3,40 124,29 130,42 98,43" fill="url(#gSteel)" stroke="#59636f" strokeWidth=".6" />
            <line x1="6" y1="39" x2="120" y2="31" stroke="#fff" strokeOpacity=".8" strokeWidth=".8" />
            <path d="M124 35 L150 22" stroke="url(#gGold)" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="166" cy="18" rx="18" ry="11" fill="none" stroke="url(#gGold)" strokeWidth="7" transform="rotate(-18 166 18)" />
          </g>
          <circle cx="122" cy="40" r="5.5" fill="url(#gPiv)" stroke="#4a3a08" strokeWidth=".8" />
        </svg>
      </div>

      {!hasCut && (
        <button
          className="gas-cut-btn"
          ref={r.cutBtn}
          type="button"
          onClick={startCut}
        >
          ✂️ CLICK TO CUT THE RIBBON
        </button>
      )}

      <div className="gas-name" ref={r.name}>
        <span className="gas-om">ॐ</span>
        <span className="gas-hiw"><span className="gas-hi"><span>जय</span><span>शंकर</span></span></span>
        <span className="gas-en">
          {LETTERS.map((c, i) => (
            <i key={i} style={{ transitionDelay: `${1 + i * 0.13}s` }}>{c === ' ' ? '\u00A0' : c}</i>
          ))}
        </span>
        <span className="gas-sub">Our store is now officially open. Welcome.</span>
      </div>

      <button className="gas-btn" ref={r.btn} type="button" onClick={closeNow}>ENTER THE STORE →</button>
    </div>
  );
}
