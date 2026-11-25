export function createLoomSoundscape() {
  let audioCtx: AudioContext | null = null;
  let isPlaying = false;
  let timer: number | null = null;

  function playShuttleStrike() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Strike 1: Wooden shuttle slide & impact
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const filter1 = audioCtx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(680, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.05);

    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(850, now);
    filter1.Q.setValueAtTime(4, now);

    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.07);

    // Strike 2: Reed beater packing the weft yarn (0.24s later)
    const t2 = now + 0.24;
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    const filter2 = audioCtx.createBiquadFilter();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1020, t2);
    osc2.frequency.exponentialRampToValueAtTime(220, t2 + 0.04);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1150, t2);
    filter2.Q.setValueAtTime(6, t2);

    gain2.gain.setValueAtTime(0.06, t2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.05);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc2.start(t2);
    osc2.stop(t2 + 0.06);
  }

  function start() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isPlaying = true;
    playShuttleStrike();
    timer = window.setInterval(playShuttleStrike, 1450);
  }

  function stop() {
    isPlaying = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function toggle() {
    if (isPlaying) {
      stop();
      return false;
    } else {
      start();
      return true;
    }
  }

  return { toggle, isRunning: () => isPlaying };
}
