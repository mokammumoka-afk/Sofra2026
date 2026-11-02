/**
 * Web Audio API synthesizer for clean, pleasant notification chimes without external assets
 */
export function playOrderAlertChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Clean warm sine / triangle chime
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // Note D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // Note A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.08); // Note A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // Note D6

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.06);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {
    // Autoplay restrictions are ignored gracefully
  }
}
