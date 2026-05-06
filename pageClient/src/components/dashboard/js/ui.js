window.DashboardUI = (() => {
  const typingTimers = new WeakMap();
  const pointer = {
    targetX: 0,
    targetY: 0
  };

  function getTranslation(key, locale) {
    return key.split(".").reduce((value, part) => {
      if (value && Object.prototype.hasOwnProperty.call(value, part)) {
        return value[part];
      }

      return undefined;
    }, locale);
  }

  function typeElement(target, text, delay = 0) {
    const previousTimer = typingTimers.get(target);
    const speed = target.classList.contains("typing-small") ? 28 : 42;

    if (previousTimer) {
      window.clearInterval(previousTimer);
    }

    target.classList.remove("done");
    target.textContent = "";
    target.dataset.text = text;
    target.dataset.glitch = text;

    gsap.delayedCall(delay, () => {
      let character = 0;
      const timer = window.setInterval(() => {
        target.textContent += text.charAt(character);
        character += 1;

        if (character >= text.length) {
          window.clearInterval(timer);
          typingTimers.delete(target);
          target.classList.add("done");
        }
      }, speed);

      typingTimers.set(target, timer);
    });
  }

  function initTypingAnimations() {
    document.querySelectorAll(".typing").forEach((target, index) => {
      typeElement(target, target.dataset.text || "", 0.25 + index * 0.16);
    });
  }

  function applyLanguage(language, shouldAnimateTyping = true) {
    const dictionaries = window.DASHBOARD_LANG || {};
    const locale = dictionaries[language] || dictionaries.en;

    if (!locale) {
      return;
    }

    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach((element, index) => {
      const translated = getTranslation(element.dataset.i18n, locale);

      if (typeof translated !== "string") {
        return;
      }

      if (element.classList.contains("typing")) {
        if (shouldAnimateTyping) {
          typeElement(element, translated, index * 0.015);
        } else {
          element.textContent = translated;
          element.dataset.text = translated;
          element.dataset.glitch = translated;
          element.classList.add("done");
        }

        return;
      }

      element.textContent = translated;
    });

    window.localStorage.setItem("dashboard-language", language);
  }

  function initLanguageSwitcher() {
    const select = document.querySelector("#language-select");
    const savedLanguage = window.localStorage.getItem("dashboard-language");
    const browserLanguage = navigator.language && navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
    const initialLanguage = savedLanguage || browserLanguage;

    if (!select) {
      applyLanguage(initialLanguage, false);
      return;
    }

    select.value = initialLanguage;
    applyLanguage(initialLanguage, false);

    select.addEventListener("change", (event) => {
      applyLanguage(event.target.value, true);
    });
  }

  function initTimelineAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".timeline-card").forEach((item, index) => {
      item.classList.add("is-visible");

      ScrollTrigger.create({
        trigger: item,
        start: "top 86%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            item,
            { y: 18, scale: 0.985 },
            { y: 0, scale: 1, duration: 0.55, delay: index * 0.06, ease: "power2.out" }
          );
        }
      });
    });

    gsap.from(".glass-panel:not(.timeline-card)", {
      y: 18,
      opacity: 0,
      duration: 0.8,
      stagger: 0.055,
      ease: "power2.out"
    });

    gsap.from(".timeline-rail span", {
      scaleX: 0,
      transformOrigin: "left center",
      duration: 0.85,
      stagger: 0.14,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".timeline-shell",
        start: "top 82%",
        once: true
      }
    });
  }

  function initHudTelemetry() {
    const feed = document.querySelector(".terminal-feed");

    if (!feed) {
      return;
    }

    window.setInterval(() => {
      const firstLine = feed.firstElementChild;

      if (firstLine) {
        feed.appendChild(firstLine);
      }
    }, 1450);
  }

  function initMouseInteractions() {
    const layers = document.querySelectorAll(".parallax-layer");

    window.addEventListener("pointermove", (event) => {
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2;

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        const x = pointer.targetX * depth * 120;
        const y = pointer.targetY * depth * 90;
        layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    });

    window.addEventListener("pointerleave", () => {
      pointer.targetX = 0;
      pointer.targetY = 0;

      layers.forEach((layer) => {
        layer.style.transform = "translate3d(0, 0, 0)";
      });
    });
  }

  return {
    initTypingAnimations,
    initLanguageSwitcher,
    initTimelineAnimations,
    initHudTelemetry,
    initMouseInteractions
  };
})();
