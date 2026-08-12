/*
 * two-way-scroll.js — makes the experience navigable in BOTH directions.
 *
 * The original build is one-way at the phase level: `moveToNextPhase()` exists,
 * there is no `moveToPrevPhase()`. Inside a phase you can step backwards
 * (explore phases) or scroll back up (scroll/horizontal phases), but once you
 * reach the top of a phase, scrolling up does nothing — you can only ever go
 * forward. Explore phases also have zero native scroll range
 * (document.scrollHeight === innerHeight), so the browser gives no feedback.
 *
 * This layer watches for sustained upward scrolling at the top of a phase and
 * sends you back to the previous phase (or the start screen from phase 1).
 *
 * Going back retraces the forward sequence exactly. We record the step you were
 * on when you left each phase, and re-enter that phase on that same step — so
 * reversing walks back through the identical screens, in reverse order, rather
 * than dropping you at the phase's beginning.
 *
 * It reuses the app's own public entry points — experience.skipToPhase(n) and
 * experience.goToStart(), the same calls the nav menu and logo make — so no
 * app internals are re-implemented here.
 */
(function () {
  'use strict';

  // Kept as tight as they can be while still giving one screen per gesture.
  // blocked() already covers the transition itself via experience.inSkip, so
  // these only need to outlast a single flick, not the animation.
  var UP_THRESHOLD = 900;   // accumulated upward delta needed to cross a phase boundary
  var IDLE_RESET   = 500;   // ms of no upward scroll before the accumulator decays
  var COOLDOWN     = 900;   // ms after a phase change before back-nav can fire again
  var STEP_COOLDOWN = 350;  // ms after stepping back off an exit screen
  var TOP_DWELL    = 450;   // min ms the top of a phase must be held before leaving
  var TOP_SETTLE_MAX = 1600; // cap on waiting for the app's own settle signal
  var FWD_THRESHOLD = 600;  // forward swipe intent to leave an explore EXIT screen (touch)

  var accum = 0;
  var lastUp = 0;
  var lockedUntil = 0;
  var atTopSince = 0;       // when the current phase's first screen was reached
  var accumFwd = 0;         // forward (downward-content) swipe accumulator
  var lastFwd = 0;

  function exp() {
    return window.experience || null;
  }

  /* ---------- state queries ---------- */

  // Which phase are we in? 0 = start screen, 1..n = content phases.
  function phaseIndex() {
    var e = exp();
    if (!e || !e.state) return -1;
    if (e.start && e.start.isShowing) return 0;
    return e.state.phaseIndex | 0;
  }

  function phaseData(i) {
    return (window.content && window.content.phases && window.content.phases[i - 1]) || null;
  }

  function phaseType(i) {
    var p = phaseData(i);
    return p ? p.type : null;
  }

  /* ---------- exit-step history ---------- */

  // The step each phase was on the moment we left it. Reversing restores these,
  // so the backward walk is the exact mirror of the forward one.
  var exitStep = {};

  (function trackExitStep() {
    var lastPhase = -1, lastStep = 0;
    setInterval(function () {
      var e = exp();
      if (!e || !e.state || e.inSkip) return;
      var i = phaseIndex();
      if (i < 0) return;
      if (i !== lastPhase) {
        // We just left lastPhase — remember where we were standing in it.
        if (lastPhase > 0 && phaseType(lastPhase) === 'explore') exitStep[lastPhase] = lastStep;
        lastPhase = i;
        lastStep = 0;
      }
      if (phaseType(i) === 'explore' && e.explore && e.explore.currentPhase === phaseData(i)) {
        lastStep = e.explore.stepIndex | 0;
      }

      // Publish the current phase to CSS. Phases differ in how light their
      // artwork is, and the copy over it is always light, so stylesheets need a
      // way to scope per-phase treatments (e.g. a scrim over light imagery).
      if (document.documentElement.getAttribute('data-phase') !== String(i)) {
        document.documentElement.setAttribute('data-phase', String(i));
      }

      // How long we have been sitting on the phase's first screen. Leaving a
      // phase requires holding there — otherwise the same flick that lands on
      // the first screen carries straight through it into the phase before.
      if (atTopOfPhase()) {
        if (!atTopSince) atTopSince = Date.now();
      } else {
        atTopSince = 0;
      }
    }, 120);
  })();

  // Where should we land when re-entering phase `i` from below? The step we left
  // it on; failing that (never visited — e.g. jumped in from the nav menu), its
  // final screen, which is what a forward pass would have ended on.
  function landingStep(i) {
    var p = phaseData(i);
    if (!p || !p.screens || !p.screens.length) return -1;
    var recorded = exitStep[i];
    if (typeof recorded === 'number' && recorded >= 0 && recorded < p.screens.length) return recorded;
    return p.screens.length - 1;
  }

  // Back-nav must never fight a modal/overlay that owns the wheel itself.
  function blocked() {
    var e = exp();
    if (!e || !e.state) return true;
    if (e.state.inDeepDive) return true;                                  // deep-dive panel scrolls itself
    if (e.inSkip) return true;                                            // a phase transition is running
    if (e.explore && e.explore.inTour) return true;                       // virtual tour owns navigation
    if (document.documentElement.classList.contains('menu-open')) return true;
    if (document.documentElement.classList.contains('in-tour')) return true;
    return false;
  }

  // The live explore component, but only when it is genuinely driving phase `i`
  // (it is reused across phases, so its stepIndex goes stale between them).
  function liveExplore(i) {
    var e = exp();
    if (!e || !e.explore) return null;
    if (phaseType(i) !== 'explore') return null;
    if (e.explore.currentPhase !== phaseData(i)) return null;
    return e.explore;
  }

  // Exit screens ("scroll to the next phase") are built without a wheel listener
  // or swipe handler, so the app cannot step backwards off them. We do it here.
  function onExitScreen(ex) {
    var s = ex.currentPhase && ex.currentPhase.screens && ex.currentPhase.screens[ex.stepIndex | 0];
    return !!s && s.type === 'exit';
  }

  // True when the current phase has nothing left above it — i.e. the app just
  // swallowed the upward scroll and did nothing with it.
  function atTopOfPhase() {
    var i = phaseIndex();
    if (i <= 0) return false;                     // already at/behind the start screen

    if (phaseType(i) === 'explore') {
      // Explore phases are step-driven; step 0 is the top.
      // Deliberately not gated on ex.allowScroll — that flag is the app's
      // forward-step debounce and never opens on the final phase, and our own
      // COOLDOWN already keeps back-nav from double-firing.
      var ex = liveExplore(i);
      if (!ex) return false;
      return (ex.stepIndex | 0) <= 0;
    }

    // scroll / horizontal phases use the document scroller (via Lenis).
    var y = window.lenis ? window.lenis.scroll : window.scrollY;
    return y <= 2;
  }

  /* ---------- landing at the end of the previous phase ---------- */

  // Returns false if the phase's scroll range hasn't been built yet, so the
  // caller can retry — phase DOM is assembled asynchronously on entry.
  function scrollDocToBottom() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 2) return false;
    if (window.lenis) {
      if (window.lenis.resize) window.lenis.resize();
      window.lenis.scrollTo(max, { immediate: true, force: true });
    } else {
      window.scrollTo(0, max);
    }
    return true;
  }

  // Set while a backward move is in flight. The hooks below read it so the
  // previous phase is ENTERED at its end rather than entered at the top and
  // then jumped — a jump would show the phase's first screen for a beat, which
  // is not what the forward sequence looked like in reverse.
  var pendingLand = null;

  // Seek the phase's media straight to the target screen's frame, then run `done`.
  //
  // Without this, re-entering a phase from below is agonising: goTo() calls
  // media.playToFrame(), which PLAYS the video from wherever it is to the target
  // frame — from 0 to ~20s when landing on a phase's last screen. The app only
  // re-enables scrolling in that playback's completion callback, so the whole
  // 20s reads as a freeze. Seeking first leaves playToFrame nothing to traverse
  // and its callback fires on the next tick.
  //
  // The seek has to WAIT for the element to be seekable. Entering a phase runs
  // resetMedia() (currentTime = 0) and assetLoader.load(), so readyState is
  // briefly 0 — and per spec, assigning currentTime at readyState 0 only sets a
  // default start position and reads back as 0. Setting it then looks like it
  // worked and silently doesn't.
  var SEEK_TIMEOUT = 2000;

  function seekMediaTo(ex, step, done) {
    var e = exp();
    var screen = ex.currentPhase && ex.currentPhase.screens && ex.currentPhase.screens[step];
    var mediaId = screen && (screen.media || ex.currentPhase.media);
    if (!e || !e.media || !screen || !screen.frame || !mediaId) return done();

    var md = e.media.getMedia(mediaId);
    if (!md || md.type !== 'video' || !md.video) {
      e.media.jumpToFrame(mediaId, screen.frame);   // image sequences seek instantly
      return done();
    }

    var video = md.video, target = screen.frame[0], waited = 0;
    (function attempt() {
      if (video.readyState >= 1) {                  // HAVE_METADATA — seeks stick
        e.media.jumpToFrame(mediaId, screen.frame);
        if (Math.abs(video.currentTime - target) < 0.5) return done();
      }
      waited += 50;
      if (waited >= SEEK_TIMEOUT) return done();    // give up and enter anyway
      setTimeout(attempt, 50);
    })();
  }

  function markDotsUpTo(ex, step) {
    var screens = ex.currentPhase && ex.currentPhase.screens;
    if (!screens) return;
    for (var k = 0; k <= step && k < screens.length; k++) {
      if (screens[k].progressMarker) screens[k].progressMarker.classList.add('active');
    }
  }

  // Wrap the app's phase-entry methods once, so a pending backward move can
  // redirect where the phase opens.
  function installHooks() {
    var e = exp();
    if (!e || e.__twsHooked) return;

    var ex = e.explore, sc = e.scroll;
    if (!ex || !sc) return;
    e.__twsHooked = true;

    var origGoTo = ex.goTo.bind(ex);
    ex.goTo = function (i) {
      if (pendingLand !== null && i === 0 && ex.currentPhase === phaseData(pendingLand)) {
        var target = pendingLand, want = landingStep(target);
        pendingLand = null;
        if (want > 0) {
          // Seeking is async (see seekMediaTo), so the phase opens a frame or
          // two later than usual — far better than the 20s freeze that entering
          // first and letting playToFrame catch up would cost.
          seekMediaTo(ex, want, function () {
            if (ex.currentPhase !== phaseData(target)) return;   // moved on meanwhile
            origGoTo(want);
            markDotsUpTo(ex, want);
          });
          return;
        }
      }
      return origGoTo(i);
    };

    ['runScroll', 'runHorizontal'].forEach(function (name) {
      var orig = sc[name].bind(sc);
      sc[name] = function (phase, skip) {
        var out = orig(phase, skip);
        if (pendingLand !== null && phase === phaseData(pendingLand)) {
          pendingLand = null;
          // The rail is in the DOM by now; park at its far end before paint.
          if (!scrollDocToBottom()) requestAnimationFrame(scrollDocToBottom);
        }
        return out;
      };
    });
  }

  // The start screen is not routed through those methods; land it separately.
  function landOnStart(attempt) {
    attempt = attempt || 0;
    setTimeout(function () {
      if (phaseIndex() !== 0) return;
      if (!scrollDocToBottom() && attempt < 5) landOnStart(attempt + 1);
    }, attempt === 0 ? 60 : 200);
  }

  /* ---------- the move itself ---------- */

  function goBack() {
    var e = exp(), i = phaseIndex();
    if (!e || i <= 0) return false;

    accum = 0;
    lockedUntil = Date.now() + COOLDOWN;

    if (i === 1) {
      e.goToStart();                    // same call the nav logo makes
      landOnStart();                    // re-enter the start screen at its foot
    } else {
      installHooks();
      pendingLand = i - 1;              // hooks land us at that phase's end
      e.skipToPhase(i - 1);             // same call the nav menu links make
      // Never leave the flag set if the phase never entered.
      setTimeout(function () { pendingLand = null; }, 4000);
    }
    return true;
  }

  /* ---------- input ---------- */

  // Step backwards off an exit screen, mirroring what the app's own screen-level
  // wheel handler does on the screens that have one.
  function stepBackOffExit(ex) {
    if (!ex.allowScroll) return false;          // app's own one-step-per-gesture debounce
    if (ex.goToPrevStep()) { ex.endScrollWait(); return true; }
    return false;
  }

  // FORWARD through an explore phase on touch. On desktop the app's wheel handling
  // steps through the screens and runs moveToNextPhase() at the end; on mobile the
  // touch equivalent is unreliable, so explore phases stall part-way (or at the
  // "Scroll to Phase X" exit) until the button is tapped. This drives the app's own
  // goToNextStep() — which advances one screen and, past the last screen, calls
  // moveToNextPhase() itself — one step per gesture, gated by the app's allowScroll
  // debounce so it can never double-advance with the app's own handling.
  // Touch-only (see the touchmove handler) so it never fights the desktop wheel path.
  function onForward(amount) {
    var now = Date.now();
    if (now < lockedUntil || blocked()) { accumFwd = 0; return; }
    var ex = liveExplore(phaseIndex());
    if (!ex) { accumFwd = 0; return; }               // only explore phases need the rescue
    if (now - lastFwd > IDLE_RESET) accumFwd = 0;
    lastFwd = now;
    accumFwd += amount;
    if (accumFwd < FWD_THRESHOLD) return;
    accumFwd = 0;
    // Only the EXIT screen is rescued. The app steps through the intro/node
    // screens itself as you scroll; the one place mobile touch never crosses is
    // the exit ("Scroll to Phase X"), where the app disables scroll and waits for
    // the button. Firing the button's own moveToNextPhase() there — and NOT
    // touching the node screens — means we can't double-advance or skip content
    // on devices where the app's own stepping works.
    if (!onExitScreen(ex)) return;
    var e = exp();
    if (e && typeof e.moveToNextPhase === 'function') {
      lockedUntil = now + COOLDOWN;
      e.moveToNextPhase();
    }
  }

  // Has the phase's first screen actually been ARRIVED at, not just touched in
  // passing? Prefer the app's own settle signal (explore.allowScroll, set ~1s
  // after a step lands) so the screen gets its full beat before we leave the
  // phase. Tour screens never set it — goTo() skips waitForScroll when
  // screen.isTour, which is phase 7 — so fall back to a plain dwell there.
  function settledAtTop(now) {
    if (!atTopSince) return false;
    var held = now - atTopSince;
    if (held < TOP_DWELL) return false;
    var ex = liveExplore(phaseIndex());
    if (ex && !ex.allowScroll && held < TOP_SETTLE_MAX) return false;
    return true;
  }

  function onUp(amount) {
    var now = Date.now();
    if (now < lockedUntil) return;
    if (blocked()) { accum = 0; return; }

    // Exit screens have no backward handler of their own — cover them here so
    // reversing walks through them exactly as the forward pass did.
    var ex = liveExplore(phaseIndex());
    if (ex && onExitScreen(ex)) {
      if (stepBackOffExit(ex)) lockedUntil = now + STEP_COOLDOWN;
      accum = 0;
      return;
    }

    if (!atTopOfPhase()) { accum = 0; return; }

    if (now - lastUp > IDLE_RESET) accum = 0;   // decay between separate gestures
    lastUp = now;
    accum += amount;

    // Accumulate during the dwell but do not fire, so the flick that arrived at
    // this screen dies out before the next gesture can leave the phase.
    if (accum >= UP_THRESHOLD && settledAtTop(now)) goBack();
  }

  window.addEventListener('wheel', function (ev) {
    if (ev.deltaY < 0) onUp(-ev.deltaY);
    else if (ev.deltaY > 0) accum = 0;          // any forward intent cancels the gesture
  }, { passive: true });

  // Touch: a downward drag means "go back".
  var touchY = null;
  window.addEventListener('touchstart', function (ev) {
    touchY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : null;
  }, { passive: true });

  window.addEventListener('touchmove', function (ev) {
    if (touchY === null || !ev.touches || !ev.touches[0]) return;
    var y = ev.touches[0].clientY, d = y - touchY;
    touchY = y;
    // Drag down == go back. Weighted heavily (~5x) so one natural downward
    // flick (~180px) crosses UP_THRESHOLD — otherwise forward advances on a
    // small swipe while going back needs a huge deliberate drag, which reads as
    // "back doesn't work". A forward drag still zeroes the accumulator, so this
    // can't be triggered by scrolling forward.
    if (d > 0) { accumFwd = 0; onUp(d * 5); }
    else if (d < 0) { accum = 0; onForward(-d * 5); }   // drag up == forward (rescues explore exit)
  }, { passive: true });

  window.addEventListener('touchend', function () { touchY = null; }, { passive: true });

  // Keyboard: at the top of a phase, Up/PageUp/Home steps back a phase.
  window.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var t = ev.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (ev.key !== 'ArrowUp' && ev.key !== 'PageUp' && ev.key !== 'Home') return;
    if (Date.now() < lockedUntil || blocked()) return;
    var ex = liveExplore(phaseIndex());
    if (ex && onExitScreen(ex)) { if (stepBackOffExit(ex)) ev.preventDefault(); return; }
    if (!atTopOfPhase()) return;
    ev.preventDefault();
    goBack();
  });

  // Manual escape hatches, handy for testing.
  window.twoWayScroll = {
    back: goBack,
    atTopOfPhase: atTopOfPhase,
    phaseIndex: phaseIndex,
    // Gate state, so a probe can tell which brake is holding.
    debug: function () {
      var now = Date.now();
      return {
        accum: Math.round(accum),
        locked: Math.max(0, lockedUntil - now),
        dwell: atTopSince ? now - atTopSince : -1,
      };
    },
  };

  // Visible back control — the reliable alternative to the back-swipe. Steps back
  // one phase. Gated the same as the swipe (not mid-transition, respects the
  // cooldown) so a double-tap can't fire two moves into one animation.
  (function wireBackButton() {
    var btn = document.getElementById('back-phase');
    if (!btn) return;
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (blocked() || Date.now() < lockedUntil) return;
      goBack();
    });
  })();
})();
