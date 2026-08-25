/* CSA — Shared interactions */
(() => {
  /* ---------- LOADER ---------- */
  /* Dismiss the loader only when the logo video finishes playing.
     If the video doesn't load/play (slow connection, autoplay blocked, etc.)
     fall back to a generous timeout so users never get stuck.
     Playback rate 2x cuts the ~8s clip down to ~4s. */
  const loader = document.getElementById('loader');
  if (loader) {
    const dismiss = () => loader.classList.add('is-done');
    const video = loader.querySelector('video');
    if (video) {
      video.playbackRate = 2;
      video.addEventListener('ended', dismiss, { once: true });
      video.addEventListener('error', dismiss, { once: true });
      // Safety net: if neither ended nor error fires within 6s
      // (clip is ~4s at 2x), dismiss anyway so the page is never blocked.
      setTimeout(dismiss, 6000);
    } else {
      setTimeout(dismiss, 1500);
    }
  }

  /* ---------- NAV: scrolled state + hide-on-scroll-down ---------- */
  /* Solid black at all times; slides up out of view when user scrolls down,
     returns when they scroll up. Only kicks in past a small threshold so
     micro-scrolls at the top don't cause a flicker. */
  const nav = document.getElementById('nav');
  if (nav) {
    let lastY = window.scrollY;
    let ticking = false;
    const HIDE_THRESHOLD = 120;   // start hiding only after scrolling this far
    const DELTA = 6;              // ignore micro-scrolls smaller than this

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 60);

      if (Math.abs(y - lastY) < DELTA) { ticking = false; return; }
      if (y > lastY && y > HIDE_THRESHOLD) {
        // scrolling DOWN past threshold — hide
        nav.classList.add('is-hidden');
      } else if (y < lastY) {
        // scrolling UP — show
        nav.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();
  }

  /* ---------- MOBILE NAV ---------- */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('is-open');
      document.body.style.overflow = mobileNav.classList.contains('is-open') ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- CUSTOM CURSOR ---------- */
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');
  if (cursor && window.matchMedia('(min-width: 901px)').matches) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    const animate = () => {
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      cursorDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    animate();
    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    /* Drop the cursor's mix-blend-mode while it's over the nav.
       Prevents the difference-blend flicker against the animated logo. */
    if (nav) {
      nav.addEventListener('mouseenter', () => {
        cursor.classList.add('is-on-nav');
        cursorDot && cursorDot.classList.add('is-on-nav');
      });
      nav.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-on-nav');
        cursorDot && cursorDot.classList.remove('is-on-nav');
      });
    }
  }

  /* ---------- REVEAL ON SCROLL ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- TIMELINE — animates line + items as section enters viewport.
     Supports multiple timelines per page (about + index both use this). ---------- */
  const timelines = document.querySelectorAll('.js-timeline, #timeline');
  if (timelines.length) {
    const tlObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          tlObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    timelines.forEach(t => tlObserver.observe(t));
  }

  /* ---------- TEXT-ROLL ON HOVER ----------
     Each letter becomes its own .text-loop with two stacked copies.
     On :hover the wrappers roll up 100%; a per-letter --d custom
     prop staggers transition-delay so the roll cascades across the
     word like a wave. */
  const wrapTextNodeByChar = (el, stepMs) => {
    const step = (stepMs || 25) / 1000;
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      /* Trim leading/trailing whitespace from the text node — the
         original whole-word wrapper did this; without it, source-code
         line breaks inside flex hosts (.btn / .contact__email) leak
         in as visible spaces and push the text away from its sibling
         icon. Internal spaces are preserved below. */
      const raw = node.textContent;
      const text = raw.trim();
      if (!text) return;
      /* Wrap the whole run in a single inline container so the host
         element still sees ONE child. Critical when the host is a
         flex container with `gap` — without this every letter would
         become its own flex item and the gap would spread between
         every letter. */
      const line = document.createElement('span');
      line.className = 'text-loop-line';
      let i = 0;
      // group letters into nowrap word spans so lines break between whole words
      let word = null;
      const flushWord = () => { if (word) { line.appendChild(word); word = null; } };
      for (const ch of text) {
        if (ch === ' ') {
          flushWord();
          line.appendChild(document.createTextNode(' '));
          i++;
          continue;
        }
        if (!word) { word = document.createElement('span'); word.className = 'text-loop-word'; }
        const wrapper = document.createElement('span');
        wrapper.className = 'text-loop';
        wrapper.style.setProperty('--d', (i * step).toFixed(3) + 's');
        const a = document.createElement('span'); a.textContent = ch;
        const b = document.createElement('span'); b.setAttribute('aria-hidden', 'true'); b.textContent = ch;
        wrapper.appendChild(a); wrapper.appendChild(b);
        word.appendChild(wrapper);
        i++;
      }
      flushWord();
      node.replaceWith(line);
      /* Restore a boundary space that trim() removed, so "Our <em>tools</em>"
         keeps its gap. Harmless in flex hosts (whitespace nodes are ignored). */
      if (/\s$/.test(raw)) line.after(document.createTextNode(' '));
      if (/^\s/.test(raw)) line.before(document.createTextNode(' '));
    });
  };

  document.querySelectorAll('.btn, .nav__cta, .contact__email, .crosslink__item, .service__title, .trust__item-body strong, .globe-map__legend .network__legend-item b, .ptool__name, .adv-card__title, .wire-more__btn')
    .forEach(el => wrapTextNodeByChar(el, 28));

  /* ---------- TRUST TOGGLE ---------- */
  const toggle = document.getElementById('trustToggle');
  const trustPanels = document.querySelector('.trust__panels');

  /* Staggered 01/02/03 reveal. Runs once when the section scrolls into view,
     and again on every tab swap so the incoming panel counts itself in.
     Bump TRUST_STAGGER for a longer beat between each point. */
  const TRUST_STAGGER = 350;
  const playTrustItems = () => {
    if (!trustPanels) return;
    const items = trustPanels.querySelectorAll('.trust__panel.is-active .trust__item');
    items.forEach(it => it.classList.remove('is-in'));
    /* Flush the reset before re-adding, otherwise the browser coalesces the
       remove+add into no change and the cascade never replays on swap. */
    void trustPanels.offsetWidth;
    requestAnimationFrame(() => {
      items.forEach((it, i) => {
        it.style.setProperty('--d', (i * TRUST_STAGGER) + 'ms');
        it.classList.add('is-in');
      });
    });
  };

  if (trustPanels) {
    const trustObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        playTrustItems();
        obs.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    trustObserver.observe(trustPanels);
  }

  if (toggle) {
    toggle.addEventListener('click', e => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      const tab = btn.dataset.tab;
      toggle.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b === btn));
      toggle.classList.toggle('is-talent', tab === 'talent');
      document.querySelectorAll('[data-panel]').forEach(p => {
        p.classList.toggle('is-active', p.dataset.panel === tab);
      });
      playTrustItems();
    });
  }

  /* ---------- CHART PULSE ----------
     Each weekly card opens its Top 10 sheet. Rows stagger in; scrim, ESC
     and the close button all dismiss it, and the page is scroll-locked
     while a sheet is open. */
  /* Region toggle (SA / Nigeria) beside the Chart Pulse heading. */
  const pulseToggle = document.getElementById("pulseToggle");
  if (pulseToggle) {
    const regionBtns = Array.from(pulseToggle.querySelectorAll("button[data-region]"));
    pulseToggle.addEventListener("click", e => {
      const btn = e.target.closest("button[data-region]");
      if (!btn) return;
      const region = btn.dataset.region;
      regionBtns.forEach(b => b.classList.toggle("is-active", b === btn));
      /* Slide the pill to whichever tab was picked. */
      pulseToggle.classList.toggle("is-second", regionBtns.indexOf(btn) === 1);
      document.querySelectorAll("[data-region-panel]").forEach(p =>
        p.classList.toggle("is-active", p.dataset.regionPanel === region)
      );
    });
  }

  const pulseOpeners = document.querySelectorAll("[data-pulse-open]");
  if (pulseOpeners.length) {
    let openSheet = null;

    const closePulse = () => {
      if (!openSheet) return;
      openSheet.hidden = true;
      openSheet.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      openSheet = null;
    };

    const openPulse = (id) => {
      const sheet = document.getElementById(id);
      if (!sheet) return;
      closePulse();
      sheet.hidden = false;
      sheet.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      openSheet = sheet;
      const rows = sheet.querySelectorAll(".pchart__row");
      rows.forEach(r => { r.style.opacity = "0"; r.style.transform = "translateY(12px)"; });
      void sheet.offsetWidth;
      rows.forEach((r, i) => {
        r.style.transition = "opacity .45s var(--ease-out) " + (i * 60) + "ms, transform .45s var(--ease-out) " + (i * 60) + "ms";
        r.style.opacity = "1";
        r.style.transform = "none";
      });
      const closeBtn = sheet.querySelector(".pmodal__close");
      if (closeBtn) closeBtn.focus();
    };

    pulseOpeners.forEach(b =>
      b.addEventListener("click", e => {
        e.preventDefault();          /* the card is an <a> so it matches the archive card markup */
        openPulse(b.dataset.pulseOpen);
      })
    );
    document.querySelectorAll("[data-pulse-close]").forEach(b =>
      b.addEventListener("click", closePulse)
    );
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closePulse();
    });
  }

  /* ---------- NETWORK MAP — connection lines ---------- */
  const stage = document.getElementById('networkStage');
  const svg = document.getElementById('networkSvg');
  if (stage && svg) {
    const drawLines = () => {
      svg.innerHTML = '';
      const cities = stage.querySelectorAll('.network__city');
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0) return;
      const points = Array.from(cities).map(c => {
        const cr = c.getBoundingClientRect();
        return {
          x: ((cr.left + cr.width / 2 - rect.left) / rect.width) * 1000,
          y: ((cr.top + cr.height / 2 - rect.top) / rect.height) * 480,
          hub: c.classList.contains('is-hub')
        };
      });
      const hubs = points.filter(p => p.hub);
      // Spokes from each non-hub to all hubs
      points.forEach(p => {
        if (p.hub) return;
        hubs.forEach(h => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const d = `M ${p.x} ${p.y} Q ${(p.x + h.x) / 2} ${Math.min(p.y, h.y) - 30}, ${h.x} ${h.y}`;
          path.setAttribute('d', d);
          path.setAttribute('class', 'network__line');
          svg.appendChild(path);
        });
      });
      // Connect hubs together
      for (let i = 0; i < hubs.length; i++) {
        for (let j = i + 1; j < hubs.length; j++) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const a = hubs[i], b = hubs[j];
          const d = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 60}, ${b.x} ${b.y}`;
          path.setAttribute('d', d);
          path.setAttribute('class', 'network__line');
          path.setAttribute('stroke-width', '1.2');
          svg.appendChild(path);
        }
      }
    };
    drawLines();
    window.addEventListener('resize', drawLines);
    setTimeout(drawLines, 500);
  }

  /* ---------- DRAG-TO-SCROLL RAILS ---------- */
  document.querySelectorAll('.cards-rail--scroll').forEach(rail => {
    let isDown = false, startX = 0, scrollLeft = 0;
    rail.addEventListener('mousedown', e => {
      isDown = true; rail.style.cursor = 'grabbing';
      startX = e.pageX - rail.offsetLeft;
      scrollLeft = rail.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach(ev => rail.addEventListener(ev, () => {
      isDown = false; rail.style.cursor = '';
    }));
    rail.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - rail.offsetLeft;
      rail.scrollLeft = scrollLeft - (x - startX) * 1.6;
    });
  });

  /* ---------- HOVER-TO-PLAY CASE VIDEOS ----------
     Each [data-hover-video] sits over a static case image. While the parent
     card is hovered it plays (muted); on leave it pauses and rewinds, so the
     static image is what shows whenever the card isn't being hovered. */
  document.querySelectorAll('[data-hover-video]').forEach(video => {
    const card = video.closest('.case');
    if (!card) return;
    video.muted = true;                 // belt-and-braces for autoplay policy
    let leaveTimer = null;
    const play = () => {
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      if (!video.paused) return;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});   // ignore autoplay rejections
    };
    // Debounced stop: the work-stack spread/lift animation can briefly fire
    // mouseleave as cards shift under the cursor — wait before pausing so a
    // re-enter cancels it and playback isn't reset to frame 0 mid-hover.
    const stop = () => {
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { video.pause(); video.currentTime = 0; }, 200);
    };
    card.addEventListener('mouseenter', play);
    card.addEventListener('mousemove', play);
    card.addEventListener('mouseleave', stop);

    // Sound toggle (if present). Clicking must not follow the case link.
    const soundBtn = card.querySelector('[data-sound-toggle]');
    if (soundBtn) {
      soundBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        video.muted = !video.muted;
        soundBtn.classList.toggle('is-unmuted', !video.muted);
        soundBtn.setAttribute('aria-pressed', String(!video.muted));
        soundBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        if (!video.muted) {             // unmuting should also resume playback
          const pr = video.play();
          if (pr && pr.catch) pr.catch(() => {});
        }
      });
    }
  });

  /* ---------- ABOUT — 3D dot globe (custom, canvas 2D) ----------
     Land is sampled from the equirectangular mesh map into points on a
     unit sphere and drawn as orange dots. Three hub cities (Cape Town,
     London, Los Angeles) are glowing, pulsing beacons placed at their
     true lat/long — they rotate with the globe and hide when they pass
     to the far side. Rotation is driven by scroll through the pinned
     section, plus a gentle idle spin. No WebGL / no libraries. */
  const globeSection = document.getElementById('globeHero');
  const globeCanvas = document.getElementById('globeCanvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (globeSection && globeCanvas) {
    const ctx = globeCanvas.getContext('2d');
    const ACCENT = '255,161,12';               // brand orange (rgb) — used for the beacons
    const TILT = -20 * Math.PI / 180;          // axial tilt toward viewer
    const HUBS = [
      { name: 'Cape Town',   lat: -33.92, lon: 18.42 },
      { name: 'London',      lat: 51.51,  lon: -0.13 },
      { name: 'Los Angeles', lat: 34.05,  lon: -118.24 }
    ];
    let land = [];
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    let scrollAngle = 0, idle = 0, raf = 0;

    const toSphere = (lat, lon) => {
      const phi = lat * Math.PI / 180, th = lon * Math.PI / 180, cp = Math.cos(phi);
      return { x: cp * Math.sin(th), y: Math.sin(phi), z: cp * Math.cos(th) };
    };
    const st = Math.sin(TILT), ctil = Math.cos(TILT);
    const rotate = (p, a) => {
      const sa = Math.sin(a), ca = Math.cos(a);
      const x = p.x * ca - p.z * sa;
      const z = p.x * sa + p.z * ca;
      return { x, y: p.y * ctil - z * st, z: p.y * st + z * ctil };
    };

    const hubP = HUBS.map(h => ({ name: h.name, p: toSphere(h.lat, h.lon) }));

    /* Heat-map colour ramp for dots near a hub: white (far) -> orange -> yellow
       (at the city). HEAT_R is the angular falloff radius in radians. */
    const HEAT_R = 0.34;                       // tight hotspots
    const heatColor = (h) => {
      if (h <= 0) return '#ffffff';
      let r, g, b;
      // white -> vivid orange -> bright yellow (saturated & bright)
      if (h < 0.5) { const t = h / 0.5; r = 255; g = Math.round(255 + (150 - 255) * t); b = Math.round(255 + (0 - 255) * t); }
      else { const t = (h - 0.5) / 0.5; r = 255; g = Math.round(150 + (220 - 150) * t); b = Math.round(0 + (40 - 0) * t); }
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    };

    /* Sample a clean equirectangular land/ocean mask (brand/earth-water.png):
       land is black, ocean is white — so land = the DARK pixels. Poles are
       skipped because equirectangular rows converge there into a dense spiral. */
    function buildLand(img) {
      const sw = 520, sh = 260;
      const oc = document.createElement('canvas');
      oc.width = sw; oc.height = sh;
      const octx = oc.getContext('2d');
      octx.drawImage(img, 0, 0, sw, sh);
      const data = octx.getImageData(0, 0, sw, sh).data;
      const pts = [];
      for (let y = 0; y < sh; y += 2) {
        const lat = 90 - (y / sh) * 180;
        if (lat < -60 || lat > 83) continue;   // drop Antarctica + the polar convergence spiral
        for (let x = 0; x < sw; x += 2) {
          const i = (y * sw + x) * 4;
          const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (bright < 100) {                  // dark == land
            const s = toSphere(lat, (x / sw) * 360 - 180);
            s.w = 0.5 + Math.random() * 0.5;   // per-dot brightness -> white/gray texture
            let best = 0;                      // heat = proximity to nearest hub
            for (let h = 0; h < hubP.length; h++) {
              const hp = hubP[h].p;
              const d = Math.acos(Math.max(-1, Math.min(1, s.x * hp.x + s.y * hp.y + s.z * hp.z)));
              const heat = Math.max(0, 1 - d / HEAT_R);
              if (heat > best) best = heat;
            }
            s.heat = Math.pow(best, 1.3);
            s.col = heatColor(s.heat);
            pts.push(s);
          }
        }
      }
      land = pts;
    }

    function size() {
      const dpr = window.devicePixelRatio || 1;
      const w = globeCanvas.clientWidth, h = globeCanvas.clientHeight;
      if (!w || !h) return;
      W = globeCanvas.width = Math.round(w * dpr);
      H = globeCanvas.height = Math.round(h * dpr);
      cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.47;
    }

    function draw() {
      if (!W) return;
      const a = scrollAngle + idle;
      ctx.clearRect(0, 0, W, H);

      /* See-through dot globe with a heat-map hotspot at each hub. Dots are
         white, but near Cape Town / London / LA they warm toward orange then
         yellow (precomputed src.col), fading out with distance. Two passes keep
         the faded far side behind the bright near side. No rim glow, no halos. */
      const dot = Math.max(1, R * 0.009);
      for (let k = 0; k < land.length; k++) {          // pass 1: far side
        const src = land[k];
        const p = rotate(src, a);
        if (p.z >= 0) continue;
        const depth = (p.z + 1) / 2;                   // 0 far .. 0.5 limb
        let alpha = (0.16 + depth * 0.3) * src.w;
        if (src.heat > 0) alpha = Math.max(alpha, src.heat * 0.45);
        const s = dot * (0.5 + depth * 0.5) * (1 + src.heat * 0.6);
        ctx.fillStyle = src.col;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx + p.x * R, cy - p.y * R, s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let k = 0; k < land.length; k++) {          // pass 2: near side
        const src = land[k];
        const p = rotate(src, a);
        if (p.z < 0) continue;
        const depth = (p.z + 1) / 2;                   // 0.5 limb .. 1 near
        let alpha = (0.4 + (depth - 0.5) * 1.1) * src.w;
        if (src.heat > 0) alpha = Math.max(alpha, src.heat * 0.95);
        const s = dot * (0.75 + depth * 0.7) * (1 + src.heat * 0.6);
        ctx.fillStyle = src.col;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx + p.x * R, cy - p.y * R, s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* City markers: a small dot at each hub + the city name in yellow on a
         solid black tag so it stays legible over the globe. Tracks rotation. */
      hubP.forEach(h => {
        const p = rotate(h.p, a);
        if (p.z < 0.02) return;                // behind the globe
        const sx = cx + p.x * R, sy = cy - p.y * R;
        const depth = (p.z + 1) / 2;

        // small marker dot on the exact city (accent orange, no glow)
        const rr = R * 0.0075 * (0.9 + depth * 0.4);
        ctx.fillStyle = '#FFA10C';
        ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2); ctx.fill();

        // label: accent-orange text on a solid black tag
        const labA = Math.min(1, Math.max(0, (depth - 0.5) / 0.26));
        if (labA > 0.02) {
          ctx.globalAlpha = labA;
          const fs = Math.round(R * 0.032);
          ctx.font = '600 ' + fs + 'px "Geist Mono", monospace';
          ctx.textBaseline = 'middle';
          const tw = ctx.measureText(h.name).width;
          const padX = fs * 0.6, padY = fs * 0.42;
          const lx = sx + rr + R * 0.022;
          const bx = lx - padX, by = sy - fs / 2 - padY, bw = tw + padX * 2, bh = fs + padY * 2;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 4); else ctx.rect(bx, by, bw, bh);
          ctx.fill();
          ctx.fillStyle = '#FFA10C';
          ctx.fillText(h.name, lx, sy);
          ctx.globalAlpha = 1;
        }
      });
    }

    let running = false;
    function tick() {
      if (!running) return;
      idle += 0.0016;
      const total = globeSection.offsetHeight - window.innerHeight;
      if (total > 0) {
        const scrolled = -globeSection.getBoundingClientRect().top;
        scrollAngle = Math.min(1, Math.max(0, scrolled / total)) * Math.PI * 2;
      }
      draw();
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(tick); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    const mapImg = new Image();
    mapImg.onload = () => {
      buildLand(mapImg);
      size();
      draw();
      if (reduceMotion) return;                // static globe, no spin
      /* Only animate while the section is near the viewport. */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((ents) => {
          ents[0].isIntersecting ? start() : stop();
        }, { rootMargin: '200px' }).observe(globeSection);
      } else { start(); }
    };
    mapImg.src = './brand/earth-water.png';
    window.addEventListener('resize', () => { size(); if (!running) draw(); });
  }

  /* ---------- CURSOR TRAIL — auto-flicker on hover ----------
     Generic trail behavior: while the cursor is over `hotspot`, images
     pop at the cursor position from `imgsContainer` on a fixed
     interval, each with a random size and rotation. The cursor's
     last known position is used as the spawn anchor so the trail
     tracks the pointer if the user moves. Used on the about-page
     archive placeholder and on each home-page service row. */
  function attachTrail(hotspot, imgsContainer, opts) {
    if (!hotspot || !imgsContainer) return;
    const imgs = Array.from(imgsContainer.querySelectorAll('img'));
    if (!imgs.length) return;
    opts = opts || {};
    const SPAWN_INTERVAL = opts.spawnInterval || 250;
    const HOLD_MS        = opts.holdMs        || 450;
    const MIN_W          = opts.minW          || 180;
    const MAX_W          = opts.maxW          || 360;
    let next = 0;
    let lastX = 0, lastY = 0;
    let intervalId = null;

    function spawn() {
      const img = imgs[next];
      next = (next + 1) % imgs.length;
      const widthPx = MIN_W + Math.random() * (MAX_W - MIN_W);
      // Vary the aspect (width:height) so pops are a mix of portrait & square,
      // regardless of the source image shape. Paired with object-fit:cover.
      const ratios = [0.72, 0.75, 0.8, 1, 1, 1.2];
      const ar = ratios[(Math.random() * ratios.length) | 0];
      const rot = (Math.random() - 0.5) * 20;
      img.style.width = widthPx + 'px';
      img.style.height = (widthPx / ar) + 'px';
      img.style.left  = lastX + 'px';
      img.style.top   = lastY + 'px';
      img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(1)`;
      img.classList.add('is-visible');
      img.style.zIndex = String(Date.now() % 100000);
      clearTimeout(img._fadeTimer);
      img._fadeTimer = setTimeout(() => {
        img.classList.remove('is-visible');
        img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(0.92)`;
      }, HOLD_MS);
    }

    function start(x, y) {
      lastX = x; lastY = y;
      spawn();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(spawn, SPAWN_INTERVAL);
    }
    function stop() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      imgs.forEach(img => {
        img.classList.remove('is-visible');
        clearTimeout(img._fadeTimer);
      });
    }

    hotspot.addEventListener('mouseenter', (e) => {
      const rect = imgsContainer.getBoundingClientRect();
      start(e.clientX - rect.left, e.clientY - rect.top);
    });
    hotspot.addEventListener('mousemove', (e) => {
      const rect = imgsContainer.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    });
    hotspot.addEventListener('mouseleave', stop);
  }

  if (!reduceMotion) {
    // About page: the archive placeholder.
    const aboutTrail = document.getElementById('cursorTrail');
    if (aboutTrail) {
      attachTrail(aboutTrail, aboutTrail.querySelector('.cursor-trail__images'),
                  { minW: 180, maxW: 320 });
    }
    // Home page services: each row has its own image set; same trail
    // behaviour as the about-page archive — auto-pop at cursor every
    // 250ms while hovering, varied size, random rotation.
    document.querySelectorAll('.service[data-trail]').forEach(svc => {
      const item = svc.closest('.service-item');
      const box = item && item.querySelector('.service__images');
      // Tighter, smaller range than the about-page placeholder so the
      // pops sit within the row rather than dominating it, and so all
      // four service rows feel visually consistent.
      attachTrail(svc, box, { minW: 140, maxW: 200 });
    });
  }

  /* ---------- EXPAND-ON-CLICK GRIDS ----------
     Generic toggle: a "View more" link reveals cards marked
     [data-extra] inside its associated grid. Used by the talent
     roster (talent.html) and the brand-communications work grid. */
  const expandTargets = [
    { btn: 'rosterToggle', grid: 'talentGrid', labelClass: 'roster-toggle__label',
      open: 'View the full roster',     close: 'Show fewer' },
    { btn: 'workToggle',   grid: 'workGrid',   labelClass: 'work-toggle__label',
      open: 'View more case studies',   close: 'Show fewer' },
    { btn: 'eventsToggle', grid: 'eventsGrid', labelClass: 'events-toggle__label',
      open: 'View more activations',    close: 'Show fewer' },
    { btn: 'partnershipsToggle', grid: 'partnershipsGrid', labelClass: 'partnerships-toggle__label',
      open: 'View more partnerships',   close: 'Show fewer' },
    { btn: 'sportToggle', grid: 'sportGrid', labelClass: 'sport-toggle__label',
      open: 'View more case studies',   close: 'Show fewer' },
  ];
  expandTargets.forEach(({ btn, grid, labelClass, open, close }) => {
    const b = document.getElementById(btn);
    const g = document.getElementById(grid);
    if (!b || !g) return;
    const label = b.querySelector('.' + labelClass);
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = g.classList.toggle('is-expanded');
      b.setAttribute('aria-expanded', String(expanded));
      if (label) label.textContent = expanded ? close : open;
    });
  });

  /* ---------- WIRE FILTERS (no real filtering, visual demo) ---------- */
  document.querySelectorAll('.wire-filters').forEach(filters => {
    filters.addEventListener('click', e => {
      const btn = e.target.closest('.wire-filter');
      if (!btn) return;
      filters.querySelectorAll('.wire-filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  /* ---------- CASE STUDY — click-to-play video ----------
     Loads the YouTube iframe only on click (keeps the page light). Set the
     video's data-youtube attribute to the YouTube ID to enable playback. */
  document.querySelectorAll('.cs__video').forEach(box => {
    const open = () => {
      if (box.classList.contains('is-playing')) return;
      const id = (box.dataset.youtube || '').trim();
      if (!id) return;   // no ID yet — leave the poster/play button as-is
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.setAttribute('title', box.getAttribute('aria-label') || 'Case study film');
      box.appendChild(iframe);
      box.classList.add('is-playing');
    };
    box.addEventListener('click', open);
    box.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  /* ---------- CASE STUDY — count-up stats ----------
     Animates [data-count] numerals from 0 to their value when scrolled into
     view. Honours prefix/suffix/decimals attributes. */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduceMotion) {
    const fmt = (el, v) => {
      const dec = parseInt(el.dataset.decimals || '0', 10);
      return (el.dataset.prefix || '') + v.toFixed(dec) + (el.dataset.suffix || '');
    };
    const run = el => {
      const target = parseFloat(el.dataset.count);
      const dur = 1400, t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);   // easeOutCubic
        el.textContent = fmt(el, target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(el, target);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  } else {
    counters.forEach(el => {
      const dec = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = (el.dataset.prefix || '') + parseFloat(el.dataset.count).toFixed(dec) + (el.dataset.suffix || '');
    });
  }
})();

/* ---------- ABOUT — proprietary tools reveal + "Why CSA wins" node cycle ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const tools = document.getElementById('propTools');
  if (tools) {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { tools.classList.add('is-in'); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(tools);
  }

  const wins = document.getElementById('winsSection');
  if (wins) {
    const track = document.getElementById('winsTrack');
    const svg = track && track.querySelector('.wins__wave');
    const path = svg && svg.querySelector('path');
    const circles = track ? Array.from(track.querySelectorAll('.wins__circle')) : [];
    /* One smooth wave through the circle centres; horizontal-tangent cubics keep
       it flat around each circle so the circle's fill masks it cleanly at the
       sides (never through the number). */
    const drawWave = () => {
      if (!path || circles.length < 2) return;
      const tr = track.getBoundingClientRect();
      if (!tr.width) return;
      svg.setAttribute('viewBox', '0 0 ' + tr.width.toFixed(1) + ' ' + tr.height.toFixed(1));
      const pts = circles.map(c => {
        const r = c.getBoundingClientRect();
        return { x: r.left - tr.left + r.width / 2, y: r.top - tr.top + r.height / 2 };
      });
      let d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], k = (b.x - a.x) * 0.5;
        d += ' C ' + (a.x + k).toFixed(1) + ' ' + a.y.toFixed(1) + ', ' +
             (b.x - k).toFixed(1) + ' ' + b.y.toFixed(1) + ', ' +
             b.x.toFixed(1) + ' ' + b.y.toFixed(1);
      }
      path.setAttribute('d', d);
    };
    drawWave();
    window.addEventListener('resize', drawWave);
    setTimeout(drawWave, 300);

    const nodes = Array.from(wins.querySelectorAll('.wins__node'));
    let idx = 0, timer = null;
    const step = () => {
      nodes.forEach(n => n.classList.remove('is-active'));
      nodes[idx].classList.add('is-active');
      idx = (idx + 1) % nodes.length;
    };
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting) { drawWave(); if (!timer) { step(); timer = setInterval(step, 1100); } }
        else if (timer) { clearInterval(timer); timer = null; }
      });
    }, { threshold: 0.2 });
    io.observe(wins);
  }
});

/* ---------- ABOUT — proprietary tools coverflow carousel ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const car = document.getElementById('ptoolCarousel');
  if (!car) return;
  const cards = Array.from(car.querySelectorAll('.ptool'));
  const n = cards.length;
  if (!n) return;
  const dotsWrap = car.querySelector('#ptoolDots') || car.querySelector('.pcarousel__dots');
  let active = 0, timer = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dots = cards.map((_, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'pcarousel__dot' + (i === 0 ? ' is-active' : '');
    d.setAttribute('aria-label', 'Show tool ' + (i + 1));
    d.addEventListener('click', () => go(i));
    if (dotsWrap) dotsWrap.appendChild(d);
    return d;
  });

  const render = () => {
    cards.forEach((c, i) => {
      let off = i - active;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      const a = Math.abs(off);
      const tx = -50 + off * 62;                 // % of card width
      const scale = a === 0 ? 1 : a === 1 ? 0.8 : 0.66;
      const opacity = a === 0 ? 1 : a === 1 ? 0.5 : a === 2 ? 0.16 : 0;
      const blur = a === 0 ? 0 : a === 1 ? 3 : 5;
      c.style.transform = 'translateX(' + tx + '%) scale(' + scale + ')';
      c.style.opacity = opacity;
      c.style.filter = a === 0 ? 'none' : 'blur(' + blur + 'px)';
      c.style.zIndex = String(30 - a * 10);
      c.style.pointerEvents = a <= 1 ? 'auto' : 'none';
      c.classList.toggle('is-active', a === 0);
      c.setAttribute('aria-hidden', a === 0 ? 'false' : 'true');
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
  };
  const go = (i) => { active = ((i % n) + n) % n; render(); restart(); };
  const restart = () => {
    if (timer) clearInterval(timer);
    if (!reduce) timer = setInterval(() => go(active + 1), 4600);
  };

  car.querySelectorAll('[data-dir]').forEach(b =>
    b.addEventListener('click', () => go(active + parseInt(b.dataset.dir, 10))));
  cards.forEach((c, i) => c.addEventListener('click', () => { if (i !== active) go(i); }));
  car.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
  car.addEventListener('mouseleave', restart);

  render();
  restart();
});

/* ---------- THE WIRE: archive filter + show-10 / read more ---------- */
(function () {
  const bar = document.getElementById('wireFilter');
  if (!bar) return;
  const section = bar.closest('section');
  const rail = section.querySelector('.cards-rail');
  const moreWrap = section.querySelector('.wire-more');
  const moreBtn = moreWrap ? moreWrap.querySelector('.wire-more__btn') : null;
  const cards = Array.from(rail.querySelectorAll('.article-card'));
  const LIMIT = 10;
  let filter = 'all';
  let expanded = false;

  const matches = (card) =>
    filter === 'all' || (card.dataset.filters || '').split(/\s+/).includes(filter);

  function render() {
    let shown = 0, eligible = 0;
    cards.forEach((c) => {
      if (!matches(c)) { c.classList.add('is-hidden'); return; }
      eligible++;
      if (expanded || shown < LIMIT) { c.classList.remove('is-hidden'); shown++; }
      else { c.classList.add('is-hidden'); }
    });
    if (moreWrap) moreWrap.hidden = !(eligible > LIMIT && !expanded);
  }

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    bar.querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b === btn));
    filter = btn.dataset.filter || 'all';
    expanded = false;              // each filter view starts collapsed at 10
    render();
  });

  if (moreBtn) moreBtn.addEventListener('click', () => { expanded = true; render(); });

  render();
})();

/* ---------- CASE STUDY: media block image carousel ---------- */
document.querySelectorAll('.cs__video').forEach((box) => {
  const poster = box.querySelector('.cs__video-poster');
  const slides = poster ? poster.querySelectorAll('img.cs__slide') : [];
  if (slides.length < 2) return;
  const dots = box.querySelectorAll('.cs__media-dot');
  let i = 0, timer;
  const go = (n) => {
    slides[i].classList.remove('is-active');
    if (dots[i]) dots[i].classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    if (dots[i]) dots[i].classList.add('is-active');
  };
  const start = () => { timer = setInterval(() => go(i + 1), 4200); };
  const stop = () => clearInterval(timer);
  dots.forEach((d, idx) => d.addEventListener('click', (e) => { e.stopPropagation(); stop(); go(idx); start(); }));
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  start();
});

/* ---------- LOGO STRIP: constant scroll speed on every device ----------
   The CSS animation runs for a fixed 60s, but the strip's width scales with
   the viewport (cells are 18vw), so wider/scaled screens scrolled faster.
   Derive the duration from the measured pixel width instead, so the speed
   (pixels per second) is identical on every device and screen size. */
(() => {
  const SPEED = 25; // px/sec — single source of truth for the scroll speed (calm & identical on every device)
  const tracks = document.querySelectorAll('.brands__track');
  if (!tracks.length) return;
  const sync = () => {
    tracks.forEach((track) => {
      // The keyframe travels translateX(-50%) = one full copy of the logo set.
      const distance = track.scrollWidth / 2; // px covered per loop
      if (distance > 0) track.style.animationDuration = (distance / SPEED) + 's';
    });
  };
  sync();
  // Re-measure after images/fonts settle and on resize (debounced).
  window.addEventListener('load', sync);
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(sync, 150); });
})();

/* (Selected Work is now a fixed-overlap deck — no JS height management needed:
   the stack's height never changes on hover, so nothing pushes or overlaps.) */
