/* HyperFrames drives the same integer-frame function used by the native encoder. */
(() => {
  const stage = window.PilotStudio;
  const ep = stage.episode;
  const length = ep.durationFrames / ep.fps;
  const viewport = document.getElementById('screen');
  let currentTime = 0;
  let currentFrame = -1;
  function seek(seconds) {
    if (!Number.isFinite(seconds)) return;
    currentTime = Math.max(0,Math.min(length,seconds));
    const f = Math.min(ep.durationFrames - 1, Math.round(currentTime * ep.fps));
    if (f !== currentFrame) {
      viewport.innerHTML = stage.frame(f);
      viewport.setAttribute('data-native-frame',String(f));
      currentFrame = f;
    }
  }
  const timeline = {
    duration: () => length,
    totalDuration: () => length,
    time(seconds) {
      if (seconds === undefined) return currentTime;
      seek(seconds);
      return this;
    },
    seek(seconds) { return this.time(seconds); },
    pause() { return this; },
    play() { return this; },
  };
  window.__timelines = window.__timelines || {};
  window.__timelines[ep.id] = timeline;
  window.addEventListener('hf-seek', event => seek(event.detail.time));
  seek(0);
  // The media engine later takes ownership of this player. During initialization,
  // snapshots can seek our deterministic stage as soon as its local fonts are available.
  Promise.all(stage.fontRequests.map(spec => document.fonts.load(spec))).then(() => {
    const player = window.__hf = window.__hf || {};
    if (typeof player.seek !== 'function') {
      Object.defineProperty(player,'duration',{get:timeline.duration,configurable:true});
      player.seek = seek;
    }
  });
})();
