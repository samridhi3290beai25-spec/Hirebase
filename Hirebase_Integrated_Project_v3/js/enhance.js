// ============================================================
// Hirebase — shared UI enhancements (loaded on every main page)
//   1. Animated counters        (.stat-number on the home page)
//   2. Scroll-reveal            (cards & sections fade/slide in)
//   3. Live notification badge  (real unread count in the navbar)
//   4. Confetti                 (window.HBConfetti.fire())
//   5. Password strength meter  (#signup-password)
//   --- added in v3 ---
//   6. Scroll-progress bar + back-to-top button
//   7. Typewriter placeholder + "/" shortcut on the hero search
//   8. Show/hide eye + Caps-Lock warning on every password field
//   9. Confirm-password live match check (signup)
//  10. Live character counter on long text boxes
//  11. Button ripple effect
//  12. Tab-count "pop" when Saved / Applied numbers change
//  13. Personal greeting on the home hero when logged in
// Pure JavaScript — no libraries, no APIs.
// ============================================================

(function () {
  "use strict";

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var hasIO = "IntersectionObserver" in window;

  // ------------------------------------------------------------
  // 1. ANIMATED COUNTERS
  // Reads the number already written in the HTML ("12.4k+", "500+", "98%"),
  // counts up from 0 when it scrolls into view and keeps the same suffix.
  // ------------------------------------------------------------
  function initCounters() {
    var els = document.querySelectorAll(".stat-number");
    if (!els.length || reduceMotion || !hasIO) return;

    function parse(text) {
      var m = String(text).trim().match(/^([\d.,]+)(.*)$/);
      if (!m) return null;
      var raw = m[1].replace(/,/g, "");
      var dot = raw.indexOf(".");
      return {
        target: parseFloat(raw),
        decimals: dot === -1 ? 0 : raw.length - dot - 1,
        suffix: m[2],
        thousands: m[1].indexOf(",") !== -1
      };
    }

    function format(val, p) {
      var s = val.toFixed(p.decimals);
      if (p.thousands) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals });
      return s + p.suffix;
    }

    function run(el, p) {
      var duration = 1600;
      var start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var t = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        el.textContent = format(p.target * eased, p);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = el.getAttribute("data-final");
      }
      requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var p = parse(entry.target.getAttribute("data-final"));
        if (p) run(entry.target, p);
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) {
      var original = el.textContent.trim();
      var p = parse(original);
      if (!p) return;
      el.setAttribute("data-final", original);
      el.setAttribute("aria-label", original);
      el.textContent = format(0, p);
      io.observe(el);
    });
  }

  // ------------------------------------------------------------
  // 2. SCROLL REVEAL
  // Elements fade + slide up once as they enter the viewport.
  // The helper classes are removed afterwards, so your own hover
  // effects and transitions are left exactly as they were.
  // ------------------------------------------------------------
  var REVEAL_SELECTOR = [
    ".categories-head",
    ".category-card",
    ".jobs-board-head",
    ".filters-card",
    ".jobs-toolbar",
    ".value-card",
    ".about-content h2",
    ".info-card",
    ".contact-card",
    ".company-card",
    ".notif-card",
    ".post-card"
  ].join(",");

  function initReveal() {
    if (reduceMotion || !hasIO) return;
    var items = document.querySelectorAll(REVEAL_SELECTOR);
    if (!items.length) return;

    document.documentElement.classList.add("hb-reveal-ready");

    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (entry, i) {
        var el = entry.target;
        io.unobserve(el);
        el.style.transitionDelay = Math.min(i * 80, 400) + "ms";
        // next frame so the browser registers the hidden state first
        requestAnimationFrame(function () {
          el.classList.add("hb-in");
          // clean up once the animation is done
          setTimeout(function () {
            el.classList.remove("hb-reveal", "hb-in");
            el.style.transitionDelay = "";
          }, 1200);
        });
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) {
      el.classList.add("hb-reveal");
      io.observe(el);
    });
  }

  // ------------------------------------------------------------
  // 3. LIVE NOTIFICATION BADGE
  // Unread = the 3 unread alerts on the notifications page
  //        + the logged-in seeker's application updates,
  //        minus everything already read (saved in localStorage).
  // ------------------------------------------------------------
  var READ_KEY = "hb_notif_read";
  var SEED_UNREAD = ["n1", "n2", "n3"];
  var lastBadgeCount = null;

  function readIds() {
    try {
      var v = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function writeIds(ids) {
    try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch (e) {}
  }

  function applicationNotifIds() {
    try {
      var store = window.HirebaseStore;
      var user = store && store.getCurrentUser ? store.getCurrentUser() : null;
      if (!user || user.role !== "seeker") return [];
      return store.getApplicationsByCandidate(user.id).map(function (a) { return "app-" + a.id; });
    } catch (e) { return []; }
  }

  function allNotifIds() {
    return SEED_UNREAD.concat(applicationNotifIds());
  }

  function unreadCount() {
    var read = readIds();
    return allNotifIds().filter(function (id) { return read.indexOf(id) === -1; }).length;
  }

  function renderBadge() {
    var badges = document.querySelectorAll(".nav-notif-badge");
    if (!badges.length) return;
    var n = unreadCount();
    badges.forEach(function (el) {
      el.textContent = n > 99 ? "99+" : String(n);
      el.style.display = n === 0 ? "none" : "";
      el.setAttribute("aria-label", n + " unread notification" + (n === 1 ? "" : "s"));
      if (lastBadgeCount !== null && n > lastBadgeCount) {
        el.classList.remove("hb-bump");
        void el.offsetWidth; // restart animation
        el.classList.add("hb-bump");
      }
    });
    lastBadgeCount = n;
  }

  function markRead(ids) {
    var read = readIds();
    ids.forEach(function (id) { if (id && read.indexOf(id) === -1) read.push(id); });
    writeIds(read);
    renderBadge();
  }

  // Extra wiring only on notifications.html
  function initNotificationsPage() {
    var feed = document.getElementById("notif-feed");
    if (!feed) return;

    function applyReadState() {
      var read = readIds();
      feed.querySelectorAll(".notif-card[data-nid]").forEach(function (card) {
        if (read.indexOf(card.getAttribute("data-nid")) !== -1) card.classList.remove("unread");
      });
    }

    // run after the page's own script has added the application cards
    setTimeout(function () { applyReadState(); renderBadge(); }, 0);

    // clicking a card marks just that one as read
    feed.addEventListener("click", function (e) {
      var card = e.target.closest(".notif-card");
      if (!card) return;
      card.classList.remove("unread");
      markRead([card.getAttribute("data-nid")]);
    });

    // keep the existing "Mark all as read" button, and make it update the badge
    var original = window.markAllRead;
    window.markAllRead = function () {
      if (typeof original === "function") original.apply(this, arguments);
      var ids = allNotifIds();
      feed.querySelectorAll(".notif-card[data-nid]").forEach(function (c) { ids.push(c.getAttribute("data-nid")); });
      markRead(ids);
    };
  }

  window.HBNotifs = { refresh: renderBadge, unreadCount: unreadCount, markRead: markRead };

  // ------------------------------------------------------------
  // 4. CONFETTI  —  window.HBConfetti.fire()
  // Lightweight canvas burst in the site's own brand colors.
  // ------------------------------------------------------------
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function fireConfetti() {
    if (reduceMotion) return;

    var canvas = document.createElement("canvas");
    canvas.className = "hb-confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var W = window.innerWidth;
    var H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    var colors = [
      cssVar("--color-accent", "#6366F1"),
      cssVar("--color-teal", "#0D9488"),
      cssVar("--color-success", "#10B981"),
      cssVar("--color-warning", "#F59E0B"),
      cssVar("--color-danger", "#EF4444"),
      "#FFFFFF"
    ];

    var particles = [];
    function burst(originX, originY, count, angleCenter, spread) {
      for (var i = 0; i < count; i++) {
        var angle = angleCenter + (Math.random() - 0.5) * spread;
        var speed = 9 + Math.random() * 10;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.35,
          round: Math.random() < 0.3,
          life: 0,
          ttl: 140 + Math.random() * 60
        });
      }
    }

    // two cannons from the bottom corners + one from the middle
    burst(W * 0.12, H * 0.95, 70, -Math.PI / 3, Math.PI / 3);
    burst(W * 0.88, H * 0.95, 70, (-2 * Math.PI) / 3, Math.PI / 3);
    burst(W * 0.5, H * 0.7, 50, -Math.PI / 2, Math.PI / 1.4);

    var rafId;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var alive = 0;
      particles.forEach(function (p) {
        p.life++;
        if (p.life > p.ttl || p.y > H + 40) return;
        alive++;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.32; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, (p.ttl - p.life) / 40));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      });
      if (alive > 0) {
        rafId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(rafId);
        canvas.remove();
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  window.HBConfetti = { fire: fireConfetti };

  // ------------------------------------------------------------
  // 5. PASSWORD STRENGTH METER  (signup page)
  // ------------------------------------------------------------
  var COMMON = ["password", "password1", "12345678", "123456789", "qwerty123", "qwertyuiop", "iloveyou", "admin123", "letmein123", "welcome123"];

  function scorePassword(pw) {
    var hasLower = /[a-z]/.test(pw);
    var hasUpper = /[A-Z]/.test(pw);
    var hasDigit = /\d/.test(pw);
    var hasSymbol = /[^A-Za-z0-9]/.test(pw);

    var points = 0;
    if (pw.length >= 8) points++;
    if (pw.length >= 12) points++;
    if (hasLower && hasUpper) points++;
    if (hasDigit) points++;
    if (hasSymbol) points++;

    var level;
    if (COMMON.indexOf(pw.toLowerCase()) !== -1 || /^(.)\1+$/.test(pw)) level = 1;
    else if (pw.length < 8) level = 1;
    else if (points <= 2) level = 1;
    else if (points === 3) level = 2;
    else if (points === 4) level = 3;
    else level = 4;

    var tips = [];
    if (pw.length < 8) tips.push("8+ characters");
    else if (pw.length < 12) tips.push("12+ characters");
    if (!(hasLower && hasUpper)) tips.push("mixed case");
    if (!hasDigit) tips.push("a number");
    if (!hasSymbol) tips.push("a symbol");

    return { level: level, tips: tips };
  }

  function initPasswordMeter() {
    var input = document.getElementById("signup-password");
    if (!input) return;

    var meter = document.createElement("div");
    meter.className = "pw-meter";
    meter.hidden = true;
    meter.innerHTML =
      '<div class="pw-bars"><span></span><span></span><span></span><span></span></div>' +
      '<div class="pw-info" aria-live="polite"><span class="pw-text"></span><span class="pw-hint"></span></div>';
    input.insertAdjacentElement("afterend", meter);

    var text = meter.querySelector(".pw-text");
    var hint = meter.querySelector(".pw-hint");
    var LABELS = ["", "Weak", "Fair", "Good", "Strong"];

    function update() {
      var pw = input.value;
      if (!pw) { meter.hidden = true; return; }
      var r = scorePassword(pw);
      meter.hidden = false;
      meter.className = "pw-meter pw-l" + r.level;
      text.textContent = LABELS[r.level];
      hint.textContent = r.level === 4 ? "Great password!" : (r.tips.length ? "Add " + r.tips.slice(0, 2).join(" & ") : "");
    }

    input.addEventListener("input", update);
    update();
  }

  // ------------------------------------------------------------
  // 6. SCROLL PROGRESS BAR + BACK-TO-TOP
  // ------------------------------------------------------------
  function initScrollUI() {
    var bar = document.createElement("div");
    bar.className = "hb-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var top = document.createElement("button");
    top.type = "button";
    top.className = "hb-top";
    top.setAttribute("aria-label", "Back to top");
    top.innerHTML = "&#8593;";
    document.body.appendChild(top);
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || doc.scrollTop;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      top.classList.toggle("hb-top-show", y > 500);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  // ------------------------------------------------------------
  // 7. TYPEWRITER PLACEHOLDER + "/" SHORTCUT  (home hero search)
  // ------------------------------------------------------------
  function initSearchExtras() {
    var input = document.getElementById("job-search");
    if (!input) return;

    // "/" jumps to the search box (like GitHub / YouTube); Esc leaves it
    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      var typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (document.activeElement && document.activeElement.isContentEditable);
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        input.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
        input.focus();
      } else if (e.key === "Escape" && document.activeElement === input) {
        input.blur();
      }
    });

    if (reduceMotion) return;
    var phrases = ["Senior React developer", "Product designer", "Node.js backend", "DevOps & cloud", "Marketing intern", "Customer support"];
    var base = "Role, skill, or company...";
    var pi = 0, ci = 0, deleting = false, timer;

    function tick() {
      // stop animating while the person is using the box
      if (document.activeElement === input || input.value) {
        input.placeholder = base;
        timer = setTimeout(tick, 800);
        return;
      }
      var word = phrases[pi];
      ci += deleting ? -1 : 1;
      input.placeholder = word.slice(0, ci) + (ci === 0 && deleting ? base : " |");
      var delay = deleting ? 35 : 75;
      if (!deleting && ci === word.length) { deleting = true; delay = 1400; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 400; }
      timer = setTimeout(tick, delay);
    }
    timer = setTimeout(tick, 1200);
  }

  // ------------------------------------------------------------
  // 8. PASSWORD EYE TOGGLE + CAPS-LOCK WARNING  (every password field)
  // ------------------------------------------------------------
  function initPasswordExtras() {
    var inputs = document.querySelectorAll('input[type="password"]');
    inputs.forEach(function (input) {
      if (input.parentElement && input.parentElement.classList.contains("hb-pw-wrap")) return;

      var wrap = document.createElement("div");
      wrap.className = "hb-pw-wrap";
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);

      var eye = document.createElement("button");
      eye.type = "button";
      eye.className = "hb-eye";
      eye.setAttribute("aria-label", "Show password");
      eye.innerHTML = "&#128065;";
      wrap.appendChild(eye);
      eye.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        eye.classList.toggle("on", show);
        eye.setAttribute("aria-label", show ? "Hide password" : "Show password");
        input.focus();
      });

      var caps = document.createElement("div");
      caps.className = "hb-caps";
      caps.hidden = true;
      caps.textContent = "⇪ Caps Lock is on";
      wrap.insertAdjacentElement("afterend", caps);

      function check(e) {
        if (!e.getModifierState) return;
        caps.hidden = !e.getModifierState("CapsLock");
      }
      input.addEventListener("keydown", check);
      input.addEventListener("keyup", check);
      input.addEventListener("blur", function () { caps.hidden = true; });
    });
  }

  // ------------------------------------------------------------
  // 9. CONFIRM-PASSWORD MATCH CHECK  (signup)
  // ------------------------------------------------------------
  function initConfirmMatch() {
    var pw = document.getElementById("signup-password");
    var cf = document.getElementById("confirm-password");
    if (!pw || !cf) return;

    var msg = document.createElement("div");
    msg.className = "hb-match";
    msg.hidden = true;
    msg.setAttribute("aria-live", "polite");
    var anchor = cf.parentElement && cf.parentElement.classList.contains("hb-pw-wrap") ? cf.parentElement : cf;
    anchor.insertAdjacentElement("afterend", msg);

    function update() {
      if (!cf.value) { msg.hidden = true; return; }
      var ok = cf.value === pw.value;
      msg.hidden = false;
      msg.className = "hb-match " + (ok ? "ok" : "bad");
      msg.textContent = ok ? "✓ Passwords match" : "✕ Passwords don’t match yet";
    }
    pw.addEventListener("input", update);
    cf.addEventListener("input", update);
  }

  // ------------------------------------------------------------
  // 10. LIVE CHARACTER COUNTER  (long text boxes)
  // ------------------------------------------------------------
  function initCharCounters() {
    document.querySelectorAll("textarea").forEach(function (ta) {
      var limit = parseInt(ta.getAttribute("maxlength"), 10) || 500;
      if (!ta.getAttribute("maxlength")) ta.setAttribute("maxlength", limit);
      var c = document.createElement("div");
      c.className = "hb-counter";
      c.setAttribute("aria-hidden", "true");
      ta.insertAdjacentElement("afterend", c);
      function upd() {
        var n = ta.value.length;
        c.textContent = n + " / " + limit;
        c.classList.toggle("warn", n > limit * 0.9);
      }
      ta.addEventListener("input", upd);
      // the page scripts clear the form after submit -> keep the counter honest
      ta.form && ta.form.addEventListener("reset", function () { setTimeout(upd, 0); });
      setInterval(upd, 800);
      upd();
    });
  }

  // ------------------------------------------------------------
  // 11. BUTTON RIPPLE
  // ------------------------------------------------------------
  function initRipple() {
    if (reduceMotion) return;
    document.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest && e.target.closest(".search-btn, button[type='submit'], .btn-signup, .tab-btn, .quick-tag");
      if (!btn || btn.disabled) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2;
      var dot = document.createElement("span");
      dot.className = "hb-ripple";
      dot.style.width = dot.style.height = size + "px";
      dot.style.left = (e.clientX - r.left - size / 2) + "px";
      dot.style.top = (e.clientY - r.top - size / 2) + "px";
      if (getComputedStyle(btn).position === "static") btn.style.position = "relative";
      btn.style.overflow = "hidden";
      btn.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 650);
    });
  }

  // ------------------------------------------------------------
  // 12. TAB-COUNT "POP"  (All / Saved / Applied numbers)
  // ------------------------------------------------------------
  function initCountPop() {
    if (reduceMotion || !window.MutationObserver) return;
    document.querySelectorAll(".tab-count").forEach(function (el) {
      new MutationObserver(function () {
        el.classList.remove("hb-pop");
        void el.offsetWidth;
        el.classList.add("hb-pop");
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  // ------------------------------------------------------------
  // 13. PERSONAL GREETING  (home hero, only when logged in)
  // ------------------------------------------------------------
  function initGreeting() {
    var hero = document.querySelector(".hero .eyebrow");
    if (!hero) return;
    var user = null;
    try { user = window.HirebaseStore && window.HirebaseStore.getCurrentUser(); } catch (e) {}
    if (!user || !user.name) return;
    var h = new Date().getHours();
    var part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    var g = document.createElement("p");
    g.className = "hb-greeting";
    g.textContent = part + ", " + user.name.split(" ")[0] + " 👋";
    hero.insertAdjacentElement("beforebegin", g);
  }

  // ------------------------------------------------------------
  // Init
  // ------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    renderBadge();
    initNotificationsPage();
    initCounters();
    initReveal();
    initPasswordMeter();
    initPasswordExtras();
    initConfirmMatch();
    initCharCounters();
    initScrollUI();
    initSearchExtras();
    initRipple();
    initCountPop();
    initGreeting();
  });

  // badge also refreshes when another tab changes read state / logs in
  window.addEventListener("storage", renderBadge);
})();
