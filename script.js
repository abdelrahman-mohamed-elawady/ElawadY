/* ════════════════════════════════════════════════════════════
   TABLE OF CONTENTS
   1.  Element References
   2.  Header Scroll Controller
   3.  Nav Dropdown Controller
   4.  Search Toggle Controller
   5.  Search Overlay Controller
   6.  Stage — Scroll-to-Work (CTA button)
   7.  Stage — Video Switcher + Card Slider + Auto-Advance
   8.  Trust — Scroll-Reveal / Animated Stat Counters
   9.  Work Section — Slider (progress bar, arrows, counter)
   10. Wizard — "New Project" Request Modal
   ════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   1. ELEMENT REFERENCES
   ────────────────────────────────────────────────────────── */
// Header
const header = document.querySelector(".header");

// Wizard
const wizardOverlay = document.getElementById("wizard-overlay");
const wizardCloseBtn = document.getElementById("wizard-close");
const ctaCard = document.querySelector(".work__card--cta");
const wizardTypeButtons = document.querySelectorAll(".wizard__type");
const next1 = document.getElementById("next-1");
const next2 = document.getElementById("next-2");
const inputName = document.getElementById("input-name");
const inputProject = document.getElementById("input-project");
const inputContact = document.getElementById("input-contact");
const wizardSteps = document.querySelectorAll(".wizard__step");

const wizardDots = [
  document.getElementById("dot-1"),
  document.getElementById("dot-2"),
  document.getElementById("dot-3")
];

/* ════════════════════════════════════════════════════════════
   2. HEADER SCROLL CONTROLLER
   ----------------------------------------------------------
   Watches the scroll position and, as soon as the user starts
   scrolling (even by a single pixel), adds a modifier class that
   switches the header from transparent to solid white.

   Uses the scroll event combined with requestAnimationFrame
   throttling to keep things smooth and avoid unnecessary
   recalculations on every scroll tick.
   ════════════════════════════════════════════════════════════ */
const HeaderScrollController = (() => {
  const SELECTORS = {
    header: ".header"
  };

  const MODIFIER_CLASS = "header--scrolled";

  // Minimum scroll distance (in px) before the header switches to white.
  // Kept at a low value so the effect triggers as soon as scrolling starts.
  const SCROLL_THRESHOLD = 50;

  let headerEl = null;
  let ticking = false; // prevents redundant updates within the same frame

  /**
   * Updates the header's visual state based on the current scroll position.
   */
  function updateHeaderState() {
    const hasScrolled = window.scrollY > SCROLL_THRESHOLD;
    headerEl.classList.toggle(MODIFIER_CLASS, hasScrolled);
    ticking = false;
  }

  /**
   * Fires on every scroll event, but defers the actual DOM update until
   * the browser is ready to paint the next frame (requestAnimationFrame),
   * so we don't overload the main thread during fast scrolling.
   */
  function handleScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  }

  /**
   * Confirms the header element exists before we start observing it.
   * @returns {boolean}
   */
  function validateDependencies() {
    if (!headerEl) {
      console.warn(`HeaderScrollController: element "${SELECTORS.header}" not found on the page.`);
      return false;
    }
    return true;
  }

  /**
   * Entry point.
   */
  function init() {
    headerEl = document.querySelector(SELECTORS.header);

    if (!validateDependencies()) return;

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Set the correct initial state in case the page was reloaded
    // while already scrolled down.
    updateHeaderState();
  }

  /**
   * Removes the event listener. Useful when running inside an SPA.
   */
  function destroy() {
    window.removeEventListener("scroll", handleScroll);
  }

  return { init, destroy };
})();

document.addEventListener("DOMContentLoaded", () => {
  HeaderScrollController.init();
});

/* ════════════════════════════════════════════════════════════
   3. NAV DROPDOWN CONTROLLER
   ----------------------------------------------------------
   Handles opening/closing the hamburger navigation dropdown:
   toggle button, optional close button, Escape key, clicking a
   link/card inside it, and clicking outside of it.
   ════════════════════════════════════════════════════════════ */
(() => {
  const navMenuButton = document.getElementById("navbarMenuBtn");
  const navDropdown = document.getElementById("dropdownMenu");
  const navDropdownCloseButton = document.getElementById("dropdownClose");

  if (!navMenuButton || !navDropdown) return;

  const isNavDropdownOpen = () => navDropdown.classList.contains("nav-dropdown--active");

  const openNavDropdown = () => {
    navDropdown.classList.add("nav-dropdown--active");
    navMenuButton.classList.add("active");
    navMenuButton.setAttribute("aria-expanded", "true");
  };

  const closeNavDropdown = () => {
    navDropdown.classList.remove("nav-dropdown--active");
    navMenuButton.classList.remove("active");
    navMenuButton.setAttribute("aria-expanded", "false");
  };

  const toggleNavDropdown = () => {
    if (isNavDropdownOpen()) {
      closeNavDropdown();
    } else {
      openNavDropdown();
    }
  };

  // Open/close via the hamburger button
  navMenuButton.addEventListener("click", toggleNavDropdown);

  // Optional dedicated close button
  if (navDropdownCloseButton) {
    navDropdownCloseButton.addEventListener("click", closeNavDropdown);
  }

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isNavDropdownOpen()) {
      closeNavDropdown();
    }
  });

  // Close when clicking any in-page link inside the dropdown
  navDropdown.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", closeNavDropdown);
  });

  // Close when clicking any featured project card
  navDropdown.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", closeNavDropdown);
  });

  // Close when clicking outside the button/dropdown
  document.addEventListener("click", (e) => {
    if (!isNavDropdownOpen()) return;

    const clickedOutside = !navMenuButton.contains(e.target) && !navDropdown.contains(e.target);

    if (clickedOutside) {
      closeNavDropdown();
    }
  });
})();
/* =========================================================
   Stage: 2 videos, dots, auto-advance when a video ends
   ========================================================= */

const stageSection = document.getElementById("stage");
const stageCta = document.getElementById("stage-cta");
const workSection = document.getElementById("work");
const stageVideos = document.querySelectorAll(".stage__video");
const stageDotsWrap = document.getElementById("stage-dots");

let stageCurrent = 0;
let stageVisible = false;
let stageSwitching = false;

/* ---------- CTA ---------- */

stageCta?.addEventListener("click", (e) => {
  if (!workSection) return;
  e.preventDefault();

  const headerOffset = document.querySelector("header")?.offsetHeight || 0;
  const top = workSection.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({ top, behavior: "smooth" });
});

/* ---------- Dots: one per video ---------- */

stageVideos.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "stage__dot" + (i === 0 ? " is-active" : "");
  dot.setAttribute("aria-label", `Go to video ${i + 1}`);
  dot.addEventListener("click", () => goToStage(i));
  stageDotsWrap?.appendChild(dot);
});

const stageDots = document.querySelectorAll(".stage__dot");

/* ---------- Lazy load (once) ---------- */

function loadStageVideo(video) {
  const source = video.querySelector("source[data-src]");
  if (!source) return;

  source.src = source.dataset.src;
  source.removeAttribute("data-src");
  video.load();
}

function playStageVideo(video) {
  const promise = video.play();
  if (promise !== undefined) promise.catch(() => {});
}

/* ---------- Switch ---------- */

function goToStage(index) {
  if (index === stageCurrent || stageSwitching) return;

  const prev = stageVideos[stageCurrent];
  const next = stageVideos[index];
  if (!next) return;

  stageSwitching = true;
  loadStageVideo(next);
  loadStageVideo(stageVideos[(index + 1) % stageVideos.length]); // preload the one after

  const run = () => {
    next.currentTime = 0;
    next.classList.add("is-active");
    prev.classList.remove("is-active");

    stageDots[stageCurrent]?.classList.remove("is-active");
    stageDots[index]?.classList.add("is-active");

    stageCurrent = index;
    stageSwitching = false;

    if (stageVisible) playStageVideo(next);

    // Pause the old video after the fade-out finishes
    setTimeout(() => {
      if (prev !== stageVideos[stageCurrent]) {
        prev.pause();
        prev.currentTime = 0;
      }
    }, 800);
  };

  if (next.readyState >= 3) run();
  else next.addEventListener("canplay", run, { once: true });
}

/* ---------- Events ---------- */

// When a video ends, go to the next one (loops back to the first)
stageVideos.forEach((video, i) => {
  video.addEventListener("ended", () => {
    if (i !== stageCurrent) return;
    goToStage((i + 1) % stageVideos.length);
  });
});

/* ---------- Play only while visible ---------- */

if (stageSection) {
  new IntersectionObserver(
    ([entry]) => {
      stageVisible = entry.isIntersecting;
      const active = stageVideos[stageCurrent];

      if (stageVisible) playStageVideo(active);
      else active.pause();
    },
    { threshold: 0.15 }
  ).observe(stageSection);
}

/* ---------- Preload the second video ---------- */

window.addEventListener("load", () => {
  if (stageVideos[1]) loadStageVideo(stageVideos[1]);
});
/* ════════════════════════════════════════════════════════════
   8.TRUST
   ════════════════════════════════════════════════════════════ */

const el = document.querySelector(".trust__text");

if (el && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("is-visible");
        observer.disconnect();
      }
    },
    { threshold: 0.2 }
  );
  observer.observe(el);
} else if (el) {
  el.classList.add("is-visible");
}
/* ════════════════════════════════════════════════════════════
   9. WORK SECTION — SLIDER
   ════════════════════════════════════════════════════════════ */

const workSlider = document.getElementById("slider__track");
const workProgress = document.getElementById("work-progress");
const workFilters = document.querySelectorAll(".work__filter");
const workCards = document.querySelectorAll(".slider__card:not(.slider__card--cta)");

const newWebsiteBtn = document.getElementById("startProjectBtn");

const workCurrentEl = document.getElementById("slider-current");
const workTotalEl = document.getElementById("slider-total");

let sliderProgressRaf = null;
let workCardsObserver = null;

/* ── Update progress ── */

function updateProgress() {
  if (!workSlider || !workProgress) return;

  const maxScroll = workSlider.scrollWidth - workSlider.clientWidth;

  if (maxScroll <= 0) {
    workProgress.style.transform = "scaleX(0)";
    return;
  }

  const progress = workSlider.scrollLeft / maxScroll;

  workProgress.style.transform = `scaleX(${progress})`;
}

/* ── Schedule progress update ── */

function requestProgressUpdate() {
  if (sliderProgressRaf !== null) return;

  sliderProgressRaf = requestAnimationFrame(() => {
    updateProgress();
    sliderProgressRaf = null;
  });
}

/* ── Slider scroll ── */

function scrollSlider(direction) {
  if (!workSlider) return;

  workSlider.scrollBy({
    left: direction * 220,
    behavior: "smooth"
  });
}

window.scrollSlider = scrollSlider;

workSlider?.addEventListener("scroll", requestProgressUpdate, { passive: true });

/* ── Counter ── */

function initWorkCounter() {
  if (!workSlider || !workCards.length) return;

  const cards = Array.from(workCards).filter((card) => !card.classList.contains("hidden"));

  workCardsObserver?.disconnect();

  /* Total */
  if (workTotalEl) {
    workTotalEl.textContent = String(cards.length).padStart(2, "0");
  }

  /* Observer */
  workCardsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const index = cards.indexOf(entry.target);

        if (index === -1) return;

        if (workCurrentEl) {
          workCurrentEl.textContent = String(index + 1).padStart(2, "0");
        }
      });
    },
    {
      root: workSlider,
      threshold: 0.6
    }
  );

  /* Observe cards */
  cards.forEach((card) => {
    workCardsObserver.observe(card);
  });

  /* Initial number */
  if (cards.length && workCurrentEl) {
    workCurrentEl.textContent = "01";
  }
}

/* ── Filtering ── */

function applyFilter(filterValue) {
  if (!workCards.length) return;

  workCards.forEach((card) => {
    const matches = filterValue === "all" || card.dataset.category === filterValue;

    card.classList.toggle("hidden", !matches);
  });

  if (workSlider) {
    workSlider.scrollTo({
      left: 0,
      behavior: "auto"
    });
  }

  initWorkCounter();
  updateProgress();
}

/* ── Filter buttons ── */

workFilters.forEach((btn) => {
  btn.addEventListener("click", () => {
    workFilters.forEach((b) => {
      b.classList.remove("is-active");
    });

    btn.classList.add("is-active");

    applyFilter(btn.dataset.filter);
  });
});

/* ── Initial slider position ── */

window.addEventListener("load", () => {
  if (!workSlider || !workCards.length) return;

  const card = workCards[3];

  if (card) {
    workSlider.scrollLeft = card.offsetLeft - workSlider.offsetWidth / 2 + card.offsetWidth / 2;
  }
  updateProgress();
  initWorkCounter();
});
/* ════════════════════════════════════════════════════════════
   10. WIZARD — "NEW PROJECT" REQUEST MODAL
   ════════════════════════════════════════════════════════════ */
let wizardSelectedType = "";

function openWizard() {
  wizardOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeWizard() {
  wizardOverlay.classList.remove("open");
  document.body.style.overflow = "";
  goToWizardStep(1);

  wizardTypeButtons.forEach((btn) => btn.classList.remove("selected"));
  next1.disabled = true;

  inputName.value = "";
  inputProject.value = "";
  inputContact.value = "";
  next2.disabled = true;

  wizardSelectedType = "";
}

function goToWizardStep(stepNumber) {
  const activeIndex = stepNumber - 1;

  wizardSteps.forEach((step, index) => {
    step.classList.toggle("active", index === activeIndex);
  });

  wizardDots.forEach((dot, index) => {
    dot?.classList.toggle("done", index < stepNumber);
  });
}

ctaCard?.addEventListener("click", openWizard);
newWebsiteBtn?.addEventListener("click", openWizard);
wizardCloseBtn?.addEventListener("click", closeWizard);
wizardOverlay?.addEventListener("click", (e) => {
  if (e.target === wizardOverlay) closeWizard();
});

wizardTypeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    wizardTypeButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    wizardSelectedType = btn.dataset.type;
    next1.disabled = false;
  });
});
next1?.addEventListener("click", () => goToWizardStep(2));

function checkWizardStep2() {
  next2.disabled = !(inputName.value.trim() && inputProject.value.trim() && inputContact.value.trim());
}
[inputName, inputProject, inputContact].forEach((input) => input?.addEventListener("input", checkWizardStep2));

next2?.addEventListener("click", async () => {
  const email = localStorage.getItem("email");

  if (!email) {
    alert("لازم تسجل دخول الأول");
    return;
  }

  next2.disabled = true;
  next2.textContent = "Sending...";

  try {
    const response = await fetch("http://localhost:3000/api/submit-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: inputName.value.trim(),
        projectType: wizardSelectedType,
        projectName: inputProject.value.trim(),
        contact: inputContact.value.trim()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "حصل خطأ، حاول تاني");
      next2.disabled = false;
      next2.textContent = "Send Request →";
      return;
    }

    goToWizardStep(3);
  } catch (err) {
    console.error(err);
    alert("مش قادر أوصل للسيرفر");
    next2.disabled = false;
    next2.textContent = "Send Request →";
  }
});
/* ════════════════════════════════════════════════════════════
   
   ════════════════════════════════════════════════════════════ */
lucide.createIcons();
