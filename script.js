/* ════════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   1. Header — solid background after scrolling
   2. Navigation dropdown
   3. Stage — video switcher, dots, scroll-to-work
   4. Work — slider (progress bar, arrows, counter)
   ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════
   1. HEADER
   ════════════════════════════════════════════════════════════ */

(() => {
  const header = document.querySelector(".header");
  if (!header) return;

  const SCROLL_THRESHOLD = 50;
  let ticking = false;

  const update = () => {
    header.classList.toggle("header--scrolled", window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
})();

/* ════════════════════════════════════════════════════════════
   2. NAVIGATION DROPDOWN
   ════════════════════════════════════════════════════════════ */

(() => {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  const isOpen = () => menu.classList.contains("is-open");

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(!isOpen()));

  // Close when any link inside the menu is clicked
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false);
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (isOpen() && !toggle.contains(e.target) && !menu.contains(e.target)) {
      setOpen(false);
    }
  });
})();

/* ════════════════════════════════════════════════════════════
   3. STAGE
   ════════════════════════════════════════════════════════════ */

(() => {
  const section = document.getElementById("stage");
  const cta = document.getElementById("stage-cta");
  const workSection = document.getElementById("work");
  const videos = document.querySelectorAll(".stage__video");
  const dotsWrap = document.getElementById("stage-dots");

  if (!section || !videos.length) return;

  let current = 0;
  let visible = false;
  let switching = false;

  /* ---------- CTA: scroll to work ---------- */

  cta?.addEventListener("click", () => {
    if (!workSection) return;

    const headerOffset = document.querySelector(".header")?.offsetHeight || 0;
    const top = workSection.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: "smooth" });
  });

  /* ---------- Dots: one per video ---------- */

  videos.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "stage__dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `Go to video ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap?.appendChild(dot);
  });

  const dots = document.querySelectorAll(".stage__dot");

  /* ---------- Video helpers ---------- */

  // Assigns the real src once (lazy loading)
  const load = (video) => {
    const source = video.querySelector("source[data-src]");
    if (!source) return;

    source.src = source.dataset.src;
    source.removeAttribute("data-src");
    video.load();
  };

  const play = (video) => video.play()?.catch(() => {});

  /* ---------- Switch ---------- */

  function goTo(index) {
    if (index === current || switching) return;

    const prev = videos[current];
    const next = videos[index];
    if (!next) return;

    switching = true;
    load(next);
    load(videos[(index + 1) % videos.length]); // preload the one after

    const run = () => {
      next.currentTime = 0;
      next.classList.add("is-active");
      prev.classList.remove("is-active");

      dots[current]?.classList.remove("is-active");
      dots[index]?.classList.add("is-active");

      current = index;
      switching = false;

      if (visible) play(next);

      // Pause the old video after the fade-out finishes
      setTimeout(() => {
        if (prev !== videos[current]) {
          prev.pause();
          prev.currentTime = 0;
        }
      }, 800);
    };

    if (next.readyState >= 3) run();
    else next.addEventListener("canplay", run, { once: true });
  }

  // When a video ends, go to the next one (loops back to the first)
  videos.forEach((video, i) => {
    video.addEventListener("ended", () => {
      if (i === current) goTo((i + 1) % videos.length);
    });
  });

  /* ---------- Play only while visible ---------- */

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      const active = videos[current];

      if (visible) play(active);
      else active.pause();
    },
    { threshold: 0.15 }
  ).observe(section);

  window.addEventListener("load", () => {
    if (videos[1]) load(videos[1]);
  });
})();

/* ════════════════════════════════════════════════════════════
   4. WORK SLIDER
   ════════════════════════════════════════════════════════════ */

(() => {
  const INITIAL_INDEX = 3; // card centered on load

  const track = document.getElementById("work-track");
  const progress = document.getElementById("work-progress");
  const currentEl = document.getElementById("work-current");
  const totalEl = document.getElementById("work-total");
  const cards = document.querySelectorAll(".work-card");
  const arrows = document.querySelectorAll("[data-work-dir]");

  if (!track || !cards.length) return;

  const pad = (n) => String(n).padStart(2, "0");
  let raf = null;

  /* ---------- Progress ---------- */

  const updateProgress = () => {
    if (!progress) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const ratio = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;

    progress.style.transform = `scaleX(${ratio})`;
  };

  track.addEventListener(
    "scroll",
    () => {
      if (raf !== null) return;

      raf = requestAnimationFrame(() => {
        updateProgress();
        raf = null;
      });
    },
    { passive: true }
  );

  /* ---------- Arrows ---------- */

  arrows.forEach((btn) => {
    btn.addEventListener("click", () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = cards[0].offsetWidth + gap;

      track.scrollBy({ left: Number(btn.dataset.workDir) * step, behavior: "smooth" });
    });
  });

  /* ---------- Counter ---------- */

  const initCounter = () => {
    if (totalEl) totalEl.textContent = pad(cards.length);

    const list = Array.from(cards);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !currentEl) return;

          const index = list.indexOf(entry.target);
          if (index !== -1) currentEl.textContent = pad(index + 1);
        });
      },
      { root: track, threshold: 0.6 }
    );

    list.forEach((card) => observer.observe(card));
  };

  /* ---------- Init ---------- */

  window.addEventListener("load", () => {
    const card = cards[Math.min(INITIAL_INDEX, cards.length - 1)];

    track.scrollLeft = card.offsetLeft - track.offsetWidth / 2 + card.offsetWidth / 2;

    updateProgress();
    initCounter();
  });
})();
