// ============================================================
// Hirebase job board — live search, autocomplete suggestions,
// filtering, sorting, bookmarking & application tracking via HirebaseStore,
// details drawer, Easy Apply modal, salary estimator, and toasts.
// Runs only on Index.html (guards below no-op elsewhere).
// ============================================================

(function () {
  const grid = document.getElementById("job-grid");
  if (!grid) return; // not on the home page

  // ---------- State ----------
  const state = {
    tab: "all",
    search: "",
    locationType: "",
    expLevel: "",
    category: null, // set via category card click
    worktypes: new Set(["Remote", "Hybrid", "On-site"]),
    jobtypes: new Set(["Full-time", "Contract", "Internship"]),
    minSalary: 40,
    skill: "All",
    sort: "match",
    activeJobId: null, // for the apply modal
    activeSuggestionIndex: -1
  };

  // Helper to get active user & sync applied/saved sets
  function getCandidateData() {
    const user = window.HirebaseStore ? window.HirebaseStore.getCurrentUser() : null;
    const isSeeker = user && user.role === "seeker";
    const savedIds = isSeeker ? window.HirebaseStore.getSavedJobIds(user.id) : new Set();
    const apps = isSeeker ? window.HirebaseStore.getApplicationsByCandidate(user.id) : [];
    const appliedIds = new Set(apps.map(a => a.jobId));
    return { user, isSeeker, savedIds, appliedIds };
  }

  // ---------- DOM refs ----------
  const DOM = {
    grid,
    emptyState: document.getElementById("empty-state"),
    resultCount: document.getElementById("jobs-result-count"),
    tabsWrap: document.querySelector(".jobs-tabs"),
    countAll: document.getElementById("count-all"),
    countSaved: document.getElementById("count-saved"),
    countApplied: document.getElementById("count-applied"),
    heroForm: document.getElementById("hero-search-form"),
    heroInput: document.getElementById("job-search"),
    searchLocation: document.querySelector(".search-location"),
    searchExp: document.querySelector(".search-exp"),
    searchSuggestions: document.getElementById("search-suggestions"),
    categoryCards: document.querySelectorAll(".category-card"),
    worktypeChecks: document.querySelectorAll(".f-worktype"),
    jobtypeChecks: document.querySelectorAll(".f-jobtype"),
    cntRemote: document.getElementById("cnt-remote"),
    cntHybrid: document.getElementById("cnt-hybrid"),
    cntOnsite: document.getElementById("cnt-onsite"),
    salaryRange: document.getElementById("salary-range"),
    salaryRangeVal: document.getElementById("salary-range-val"),
    skillPills: document.getElementById("skill-pills"),
    sortSelect: document.getElementById("sort-select"),
    resetFilters: document.getElementById("reset-filters"),
    detailsModal: document.getElementById("details-modal"),
    detailsContent: document.getElementById("details-content"),
    detailsClose: document.getElementById("details-close"),
    applyModal: document.getElementById("apply-modal"),
    applyForm: document.getElementById("apply-form"),
    applyClose: document.getElementById("apply-close"),
    applyRole: document.getElementById("apply-role"),
    applyCompany: document.getElementById("apply-company"),
    applyMessage: document.getElementById("apply-message"),
    calcRole: document.getElementById("calc-role"),
    calcExp: document.getElementById("calc-exp"),
    estimateAmount: document.getElementById("estimate-amount"),
    toastContainer: document.getElementById("toast-container")
  };

  // Ensure suggestions container exists
  if (!DOM.searchSuggestions && DOM.heroInput) {
    const sugg = document.createElement("div");
    sugg.id = "search-suggestions";
    sugg.className = "search-suggestions";
    sugg.hidden = true;
    DOM.heroInput.parentNode.appendChild(sugg);
    DOM.searchSuggestions = sugg;
  }

  // ---------- Filtering & sorting ----------
  function getFilteredJobs() {
    const { user, isSeeker, savedIds, appliedIds } = getCandidateData();
    const allJobs = window.HirebaseStore ? window.HirebaseStore.getJobs() : [];

    return allJobs.filter((job) => {
      // Tab filter
      if (state.tab === "saved") {
        if (!isSeeker || !savedIds.has(job.id)) return false;
      }
      if (state.tab === "applied") {
        if (!isSeeker || !appliedIds.has(job.id)) return false;
      }

      // Checkboxes & slider
      if (!state.worktypes.has(job.worktype)) return false;
      if (!state.jobtypes.has(job.jobtype)) return false;
      if (job.salaryMax < state.minSalary) return false;
      if (state.skill !== "All" && (!Array.isArray(job.skills) || !job.skills.includes(state.skill))) return false;
      if (state.category && job.category !== state.category) return false;

      // Location dropdown in hero
      if (state.locationType && state.locationType !== "") {
        if (job.worktype !== state.locationType && (!job.location || !job.location.toLowerCase().includes(state.locationType.toLowerCase()))) {
          return false;
        }
      }

      // Experience dropdown in hero
      if (state.expLevel && state.expLevel !== "") {
        if (job.experience !== state.expLevel) return false;
      }

      // Keyword Search (partial, case-insensitive across title, company, skills, description, category, location)
      if (state.search) {
        const q = state.search.toLowerCase().trim();
        const title = (job.title || "").toLowerCase();
        const comp = (job.company || "").toLowerCase();
        const desc = (job.summary || "").toLowerCase();
        const loc = (job.location || "").toLowerCase();
        const skillsStr = Array.isArray(job.skills) ? job.skills.join(" ").toLowerCase() : "";
        const cat = (job.category || "").toLowerCase();

        const matches =
          title.includes(q) ||
          comp.includes(q) ||
          desc.includes(q) ||
          loc.includes(q) ||
          skillsStr.includes(q) ||
          cat.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }

  function getSortedJobs(jobs) {
    const copy = [...jobs];
    if (state.sort === "newest") {
      copy.sort((a, b) => (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0));
    } else if (state.sort === "salary") {
      copy.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    } else {
      copy.sort((a, b) => (b.match || 80) - (a.match || 80));
    }
    return copy;
  }

  function updateCounts() {
    const allJobs = window.HirebaseStore ? window.HirebaseStore.getJobs() : [];
    const { isSeeker, savedIds, appliedIds } = getCandidateData();

    if (DOM.countAll) DOM.countAll.textContent = allJobs.length;
    if (DOM.countSaved) DOM.countSaved.textContent = isSeeker ? savedIds.size : 0;
    if (DOM.countApplied) DOM.countApplied.textContent = isSeeker ? appliedIds.size : 0;

    if (DOM.cntRemote) DOM.cntRemote.textContent = allJobs.filter(j => j.worktype === "Remote").length;
    if (DOM.cntHybrid) DOM.cntHybrid.textContent = allJobs.filter(j => j.worktype === "Hybrid").length;
    if (DOM.cntOnsite) DOM.cntOnsite.textContent = allJobs.filter(j => j.worktype === "On-site").length;

    // Live "N active roles" on each department card
    DOM.categoryCards.forEach((card) => {
      const label = card.querySelector("p");
      if (!label) return;
      const n = allJobs.filter(j => j.category === card.dataset.category).length;
      label.textContent = `${n} active role${n === 1 ? "" : "s"}`;
    });
  }

  // ---------- Rendering ----------
  function tagClass(jobtype) {
    if (jobtype === "Full-time") return "tag-fulltime";
    if (jobtype === "Internship") return "tag-internship";
    return "tag-contract";
  }

  function createJobCardHTML(job) {
    const { isSeeker, savedIds, appliedIds } = getCandidateData();
    const saved = isSeeker && savedIds.has(job.id);
    const applied = isSeeker && appliedIds.has(job.id);
    const skillsText = Array.isArray(job.skills) && job.skills.length ? job.skills.join(" · ") : "General Requirements";

    return `
      <article class="job-card" data-id="${job.id}">
        <div class="job-card-top">
          <div>
            <h3>${job.title}</h3>
            <p class="job-meta">${job.company} &middot; ${job.location || "Remote"}</p>
          </div>
          <button class="save-btn ${saved ? "saved" : ""}" data-action="save" data-id="${job.id}" aria-label="${saved ? "Unsave job" : "Save job"}">${saved ? "★" : "☆"}</button>
        </div>
        <div class="job-tags">
          <span class="tag ${tagClass(job.jobtype)}">${job.jobtype}</span>
          <span class="tag tag-salary">$${job.salaryMin}k&ndash;$${job.salaryMax}k</span>
        </div>
        <p class="job-skills">${skillsText}</p>
        <div class="job-card-actions">
          <button class="btn-details" data-action="details" data-id="${job.id}">View details</button>
          <button class="btn-apply ${applied ? "applied" : ""}" data-action="apply" data-id="${job.id}">${applied ? "Applied" : "Easy Apply"}</button>
        </div>
      </article>
    `;
  }

  // ---------- Skeleton loaders ----------
  let skeletonTimer = null;

  function skeletonCardHTML() {
    return `
      <article class="job-card skeleton-card" aria-hidden="true">
        <div class="job-card-top">
          <div style="flex:1">
            <span class="sk sk-title"></span>
            <span class="sk sk-meta"></span>
          </div>
          <span class="sk sk-star"></span>
        </div>
        <div class="sk-tags"><span class="sk sk-pill"></span><span class="sk sk-pill sk-pill-wide"></span></div>
        <span class="sk sk-line"></span>
        <div class="sk-actions"><span class="sk sk-btn"></span><span class="sk sk-btn"></span></div>
      </article>`;
  }

  // Shows shimmering placeholder cards, then renders the real feed
  function renderFeedWithSkeleton(ms) {
    clearTimeout(skeletonTimer);
    DOM.grid.innerHTML = Array.from({ length: 6 }, skeletonCardHTML).join("");
    DOM.grid.setAttribute("aria-busy", "true");
    if (DOM.emptyState) DOM.emptyState.hidden = true;
    if (DOM.resultCount) DOM.resultCount.textContent = "Loading roles…";
    updateCounts();
    skeletonTimer = setTimeout(() => {
      DOM.grid.removeAttribute("aria-busy");
      renderFeed();
    }, ms);
  }

  function renderFeed() {
    clearTimeout(skeletonTimer); // a real render always wins over a pending skeleton
    DOM.grid.removeAttribute("aria-busy");
    const filtered = getFilteredJobs();
    const sorted = getSortedJobs(filtered);

    if (DOM.resultCount) {
      DOM.resultCount.textContent = `${sorted.length} role${sorted.length === 1 ? "" : "s"}`;
    }

    if (sorted.length === 0) {
      DOM.grid.innerHTML = "";
      if (DOM.emptyState) DOM.emptyState.hidden = false;
    } else {
      if (DOM.emptyState) DOM.emptyState.hidden = true;
      DOM.grid.innerHTML = sorted.map(createJobCardHTML).join("");
    }

    updateCounts();
  }

  // ---------- Live Autocomplete Search Suggestions ----------
  // ---------- Recent searches (saved in localStorage) ----------
  const RECENT_KEY = "hb_recent_searches";
  const RECENT_MAX = 5;

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function getRecents() {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function setRecents(list) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function saveRecent(term) {
    term = (term || "").trim();
    if (term.length < 2) return;
    const list = getRecents().filter((t) => t.toLowerCase() !== term.toLowerCase());
    list.unshift(term);
    setRecents(list.slice(0, RECENT_MAX));
  }

  function removeRecent(term) {
    setRecents(getRecents().filter((t) => t !== term));
  }

  function renderRecents() {
    if (!DOM.searchSuggestions) return;
    const list = getRecents();
    if (!list.length) { closeSuggestions(); return; }
    DOM.searchSuggestions.innerHTML =
      `<div class="recent-head"><span>Recent searches</span><button type="button" class="recent-clear">Clear all</button></div>` +
      list.map((t, idx) => `
        <div class="search-suggestion-item recent-item" data-index="${idx}" data-value="${escapeHTML(t)}">
          <span>🕘 ${escapeHTML(t)}</span>
          <button type="button" class="recent-remove" data-remove="${escapeHTML(t)}" aria-label="Remove ${escapeHTML(t)} from recent searches">✕</button>
        </div>`).join("");
    DOM.searchSuggestions.hidden = false;
    state.activeSuggestionIndex = -1;
  }

  function closeSuggestions() {
    if (DOM.searchSuggestions) {
      DOM.searchSuggestions.hidden = true;
      DOM.searchSuggestions.innerHTML = "";
    }
    state.activeSuggestionIndex = -1;
  }

  function renderSuggestions(suggestions) {
    if (!DOM.searchSuggestions) return;
    if (!suggestions || suggestions.length === 0) {
      closeSuggestions();
      return;
    }

    DOM.searchSuggestions.innerHTML = suggestions
      .map(
        (s, idx) => `
        <div class="search-suggestion-item" data-index="${idx}" data-value="${s.text}">
          <span>💼 ${s.text}</span>
          <span class="search-suggestion-badge">${s.type}</span>
        </div>
      `
      )
      .join("");
    DOM.searchSuggestions.hidden = false;
    state.activeSuggestionIndex = -1;
  }

  function selectSuggestion(text) {
    if (DOM.heroInput) {
      DOM.heroInput.value = text;
      state.search = text;
    }
    saveRecent(text);
    closeSuggestions();
    renderFeed();
    const board = document.getElementById("jobs-board");
    if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- Save / Bookmark ----------
  function toggleSave(id) {
    const { user, isSeeker } = getCandidateData();
    if (!user) {
      showToast("Please sign in as a Job Seeker to bookmark jobs", "error");
      return;
    }
    if (!isSeeker) {
      showToast("Employer accounts cannot bookmark candidate jobs", "error");
      return;
    }

    const res = window.HirebaseStore.toggleSaveJob(id, user.id);
    if (res.success) {
      showToast(res.isSaved ? "★ Job saved to your bookmarks" : "Job removed from saved jobs");
      renderFeed();
    }
  }

  // ---------- Job Details Modal ----------
  function openDetailsModal(id) {
    const job = window.HirebaseStore ? window.HirebaseStore.getJobById(id) : null;
    if (!job) return;

    const { isSeeker, savedIds, appliedIds } = getCandidateData();
    const saved = isSeeker && savedIds.has(job.id);
    const applied = isSeeker && appliedIds.has(job.id);

    const responsibilities = Array.isArray(job.responsibilities)
      ? job.responsibilities.map(r => `<li>${r}</li>`).join("")
      : `<li>Deliver high-quality work aligned with team goals</li>`;

    const qualifications = Array.isArray(job.qualifications)
      ? job.qualifications.map(q => `<li>${q}</li>`).join("")
      : `<li>Demonstrated background matching job requirements</li>`;

    DOM.detailsContent.innerHTML = `
      <h3 class="details-title">${job.title}</h3>
      <p class="details-company">${job.company} &middot; ${job.location || "Remote"} &middot; ${job.worktype}</p>
      <div class="details-tags">
        <span class="tag ${tagClass(job.jobtype)}">${job.jobtype}</span>
        <span class="tag tag-salary">$${job.salaryMin}k&ndash;$${job.salaryMax}k / yr</span>
        <span class="tag" style="background: var(--color-accent-soft); color: var(--color-accent);">${job.category || "General"}</span>
      </div>
      <div class="details-section">
        <h4>About the role</h4>
        <p>${job.summary}</p>
      </div>
      <div class="details-section">
        <h4>Responsibilities</h4>
        <ul>${responsibilities}</ul>
      </div>
      <div class="details-section">
        <h4>Qualifications</h4>
        <ul>${qualifications}</ul>
      </div>
      <div class="details-actions">
        <button class="btn-apply ${applied ? "applied" : ""}" data-action="apply" data-id="${job.id}" style="flex:1;">${applied ? "Applied" : "Easy Apply"}</button>
        <button class="save-btn ${saved ? "saved" : ""}" data-action="save" data-id="${job.id}" aria-label="${saved ? "Unsave job" : "Save job"}">${saved ? "★" : "☆"}</button>
      </div>
    `;
    DOM.detailsModal.hidden = false;
  }

  function closeDetailsModal() {
    DOM.detailsModal.hidden = true;
  }

  // ---------- Easy Apply Modal ----------
  function openApplyModal(id) {
    const { user, isSeeker, appliedIds } = getCandidateData();

    if (!user) {
      showToast("Please sign in as a Job Seeker to apply for roles", "error");
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 1200);
      return;
    }

    if (!isSeeker) {
      showToast("Employer accounts cannot apply for jobs. Please log in with a Candidate account.", "error");
      return;
    }

    const job = window.HirebaseStore ? window.HirebaseStore.getJobById(id) : null;
    if (!job) return;

    if (appliedIds.has(id)) {
      showToast("You have already applied for this role", "info");
      return;
    }

    state.activeJobId = id;
    DOM.applyRole.textContent = job.title;
    DOM.applyCompany.textContent = job.company;
    DOM.applyMessage.textContent = "";
    DOM.applyMessage.classList.remove("success", "error");

    // Pre-fill with candidate's stored profile
    const nameInput = document.getElementById("apply-name");
    const emailInput = document.getElementById("apply-email");
    const phoneInput = document.getElementById("apply-phone");
    const expSelect = document.getElementById("apply-exp");
    const resumeInput = document.getElementById("apply-resume");
    const pitchInput = document.getElementById("apply-pitch");

    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
    if (phoneInput) phoneInput.value = user.profile?.phone || "";
    if (expSelect && user.profile?.experience) expSelect.value = user.profile.experience;
    if (resumeInput) resumeInput.value = user.profile?.resumeUrl || "";
    if (pitchInput) pitchInput.value = user.profile?.bio || "";

    DOM.applyModal.hidden = false;
  }

  function closeApplyModal() {
    DOM.applyModal.hidden = true;
    state.activeJobId = null;
  }

  function handleApplySubmit(e) {
    e.preventDefault();
    const { user } = getCandidateData();
    if (!user) {
      showToast("Authentication session expired. Please sign in again.", "error");
      return;
    }

    const nameEl = document.getElementById("apply-name");
    const emailEl = document.getElementById("apply-email");
    const phoneEl = document.getElementById("apply-phone");
    const expEl = document.getElementById("apply-exp");
    const resumeEl = document.getElementById("apply-resume");
    const pitchEl = document.getElementById("apply-pitch");

    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const exp = expEl ? expEl.value : "3-5";
    const resume = resumeEl ? resumeEl.value.trim() : "";
    const pitch = pitchEl ? pitchEl.value.trim() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;

    if (!name) { if (nameEl) nameEl.classList.add("invalid"); isValid = false; } else { if (nameEl) nameEl.classList.remove("invalid"); }
    if (!email || !emailRegex.test(email)) { if (emailEl) emailEl.classList.add("invalid"); isValid = false; } else { if (emailEl) emailEl.classList.remove("invalid"); }
    if (!phone) { if (phoneEl) phoneEl.classList.add("invalid"); isValid = false; } else { if (phoneEl) phoneEl.classList.remove("invalid"); }
    if (!resume) { if (resumeEl) resumeEl.classList.add("invalid"); isValid = false; } else { if (resumeEl) resumeEl.classList.remove("invalid"); }
    if (!pitch) { if (pitchEl) pitchEl.classList.add("invalid"); isValid = false; } else { if (pitchEl) pitchEl.classList.remove("invalid"); }

    if (!isValid) {
      DOM.applyMessage.textContent = "Please fill in all required fields highlighted in red.";
      DOM.applyMessage.className = "form-message error";
      return;
    }

    const id = state.activeJobId;
    if (!id) return;

    const res = window.HirebaseStore.applyForJob(id, user, {
      name,
      email,
      phone,
      experience: exp,
      resumeUrl: resume,
      coverNote: pitch
    });

    if (!res.success) {
      DOM.applyMessage.textContent = "⚠️ " + res.error;
      DOM.applyMessage.className = "form-message error";
      return;
    }

    DOM.applyMessage.textContent = "✓ Application successfully submitted to hiring manager!";
    DOM.applyMessage.className = "form-message success";
    if (window.HBConfetti) window.HBConfetti.fire();
    if (window.HBNotifs) window.HBNotifs.refresh();

    setTimeout(() => {
      closeApplyModal();
      closeDetailsModal();
      renderFeed();
      showToast("✓ Application sent successfully to recruiter!");
    }, 700);
  }

  // ---------- Salary Estimator ----------
  const SALARY_RANGES = {
    software: { junior: [80, 105], mid: [105, 140], senior: [140, 180], lead: [175, 230] },
    design: { junior: [70, 95], mid: [95, 130], senior: [130, 165], lead: [160, 200] },
    product: { junior: [85, 110], mid: [115, 150], senior: [150, 190], lead: [185, 240] },
    data: { junior: [90, 115], mid: [120, 155], senior: [155, 195], lead: [190, 245] }
  };

  function updateSalaryEstimator() {
    if (!DOM.calcRole || !DOM.calcExp || !DOM.estimateAmount) return;
    const role = DOM.calcRole.value;
    const exp = DOM.calcExp.value;
    const range = (SALARY_RANGES[role] && SALARY_RANGES[role][exp]) || [80, 120];
    DOM.estimateAmount.textContent = `$${range[0]},000 - $${range[1]},000`;
  }

  // ---------- Toast Notification ----------
  function showToast(message, type = "info") {
    if (!DOM.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-out");
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  }

  // ---------- Event Listeners ----------
  function handleActionClick(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "save") toggleSave(id);
    else if (action === "details") openDetailsModal(id);
    else if (action === "apply") openApplyModal(id);
  }

  function setupEventListeners() {
    DOM.grid.addEventListener("click", handleActionClick);
    DOM.detailsContent.addEventListener("click", handleActionClick);

    // Tab buttons (All, Saved, Applied)
    if (DOM.tabsWrap) {
      DOM.tabsWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".tab-btn");
        if (!btn) return;
        DOM.tabsWrap.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.tab = btn.dataset.tab;
        renderFeedWithSkeleton(450);
      });
    }

    // Hero Form Submit & Live Autocomplete Input
    if (DOM.heroForm) {
      DOM.heroForm.addEventListener("submit", (e) => {
        e.preventDefault();
        closeSuggestions();
        state.search = DOM.heroInput.value.trim();
        if (DOM.searchLocation) state.locationType = DOM.searchLocation.value;
        if (DOM.searchExp) state.expLevel = DOM.searchExp.value;
        saveRecent(state.search);
        renderFeedWithSkeleton(450);
        const board = document.getElementById("jobs-board");
        if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      DOM.heroInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        state.search = val;
        if (val.length > 0) {
          const suggestions = window.HirebaseStore.getSearchSuggestions(val);
          renderSuggestions(suggestions);
        } else {
          renderRecents(); // empty box -> show recent searches again
        }
        renderFeed();
      });

      // Focusing an empty search box shows the recent searches
      DOM.heroInput.addEventListener("focus", () => {
        if (!DOM.heroInput.value.trim()) renderRecents();
      });

      // Keyboard navigation for suggestions
      DOM.heroInput.addEventListener("keydown", (e) => {
        if (!DOM.searchSuggestions || DOM.searchSuggestions.hidden) return;
        const items = DOM.searchSuggestions.querySelectorAll(".search-suggestion-item");
        if (!items.length) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          state.activeSuggestionIndex = (state.activeSuggestionIndex + 1) % items.length;
          items.forEach((it, i) => it.classList.toggle("active", i === state.activeSuggestionIndex));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          state.activeSuggestionIndex = (state.activeSuggestionIndex - 1 + items.length) % items.length;
          items.forEach((it, i) => it.classList.toggle("active", i === state.activeSuggestionIndex));
        } else if (e.key === "Enter") {
          if (state.activeSuggestionIndex >= 0 && items[state.activeSuggestionIndex]) {
            e.preventDefault();
            const chosen = items[state.activeSuggestionIndex].dataset.value;
            selectSuggestion(chosen);
          }
        } else if (e.key === "Escape") {
          closeSuggestions();
        }
      });
    }

    // Click on suggestion item
    if (DOM.searchSuggestions) {
      DOM.searchSuggestions.addEventListener("click", (e) => {
        const removeBtn = e.target.closest(".recent-remove");
        if (removeBtn) {
          e.stopPropagation();
          removeRecent(removeBtn.dataset.remove);
          renderRecents();
          return;
        }
        if (e.target.closest(".recent-clear")) {
          e.stopPropagation();
          setRecents([]);
          closeSuggestions();
          return;
        }
        const item = e.target.closest(".search-suggestion-item");
        if (!item) return;
        selectSuggestion(item.dataset.value);
      });
    }

    // Close suggestions on outside click
    document.addEventListener("click", (e) => {
      if (DOM.heroForm && !DOM.heroForm.contains(e.target)) {
        closeSuggestions();
      }
    });

    // Hero Dropdowns (Location & Experience)
    if (DOM.searchLocation) {
      DOM.searchLocation.addEventListener("change", (e) => {
        state.locationType = e.target.value;
        renderFeed();
      });
    }
    if (DOM.searchExp) {
      DOM.searchExp.addEventListener("change", (e) => {
        state.expLevel = e.target.value;
        renderFeed();
      });
    }

    // Category Cards
    DOM.categoryCards.forEach((card) => {
      card.addEventListener("click", () => {
        const cat = card.dataset.category;
        const alreadyActive = card.classList.contains("active");
        DOM.categoryCards.forEach((c) => c.classList.remove("active"));
        if (alreadyActive) {
          state.category = null;
        } else {
          card.classList.add("active");
          state.category = cat;
        }
        renderFeedWithSkeleton(450);
        const board = document.getElementById("jobs-board");
        if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Worktype Checkboxes
    DOM.worktypeChecks.forEach((cb) => {
      cb.addEventListener("change", () => {
        state.worktypes = new Set([...DOM.worktypeChecks].filter((c) => c.checked).map((c) => c.value));
        renderFeed();
      });
    });

    // Jobtype Checkboxes
    DOM.jobtypeChecks.forEach((cb) => {
      cb.addEventListener("change", () => {
        state.jobtypes = new Set([...DOM.jobtypeChecks].filter((c) => c.checked).map((c) => c.value));
        renderFeed();
      });
    });

    // Salary Slider
    if (DOM.salaryRange) {
      DOM.salaryRange.addEventListener("input", (e) => {
        state.minSalary = Number(e.target.value);
        if (DOM.salaryRangeVal) DOM.salaryRangeVal.textContent = `$${state.minSalary}k+ / yr`;
        renderFeed();
      });
    }

    // Skill Pills
    if (DOM.skillPills) {
      DOM.skillPills.addEventListener("click", (e) => {
        const pill = e.target.closest(".skill-pill");
        if (!pill) return;
        DOM.skillPills.querySelectorAll(".skill-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        state.skill = pill.dataset.skill;
        renderFeed();
      });
    }

    // Sort Select
    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener("change", (e) => {
        state.sort = e.target.value;
        renderFeed();
      });
    }

    // Reset Filters
    if (DOM.resetFilters) {
      DOM.resetFilters.addEventListener("click", () => {
        state.worktypes = new Set(["Remote", "Hybrid", "On-site"]);
        state.jobtypes = new Set(["Full-time", "Contract", "Internship"]);
        state.minSalary = 40;
        state.skill = "All";
        state.category = null;
        state.search = "";
        state.locationType = "";
        state.expLevel = "";

        if (DOM.heroInput) DOM.heroInput.value = "";
        if (DOM.searchLocation) DOM.searchLocation.value = "";
        if (DOM.searchExp) DOM.searchExp.value = "";
        DOM.worktypeChecks.forEach((c) => (c.checked = true));
        DOM.jobtypeChecks.forEach((c) => (c.checked = true));
        if (DOM.salaryRange) DOM.salaryRange.value = 40;
        if (DOM.salaryRangeVal) DOM.salaryRangeVal.textContent = "$40k+ / yr";
        if (DOM.skillPills) {
          DOM.skillPills.querySelectorAll(".skill-pill").forEach((p) => p.classList.toggle("active", p.dataset.skill === "All"));
        }
        DOM.categoryCards.forEach((c) => c.classList.remove("active"));
        closeSuggestions();
        renderFeed();
      });
    }

    // Modals
    if (DOM.detailsClose) DOM.detailsClose.addEventListener("click", closeDetailsModal);
    if (DOM.detailsModal) {
      DOM.detailsModal.addEventListener("click", (e) => {
        if (e.target === DOM.detailsModal) closeDetailsModal();
      });
    }

    if (DOM.applyClose) DOM.applyClose.addEventListener("click", closeApplyModal);
    if (DOM.applyModal) {
      DOM.applyModal.addEventListener("click", (e) => {
        if (e.target === DOM.applyModal) closeApplyModal();
      });
    }
    if (DOM.applyForm) DOM.applyForm.addEventListener("submit", handleApplySubmit);

    // Salary Estimator
    if (DOM.calcRole) DOM.calcRole.addEventListener("change", updateSalaryEstimator);
    if (DOM.calcExp) DOM.calcExp.addEventListener("change", updateSalaryEstimator);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDetailsModal();
        closeApplyModal();
        closeSuggestions();
      }
    });

    // Read URL Params (e.g. Index.html?q=React or ?q=Data)
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get("q");
    if (qParam && DOM.heroInput) {
      DOM.heroInput.value = qParam;
      state.search = qParam;
    }
    const catParam = urlParams.get("category");
    if (catParam) {
      state.category = catParam;
      DOM.categoryCards.forEach(c => {
        if (c.dataset.category.toLowerCase() === catParam.toLowerCase()) c.classList.add("active");
      });
    }
  }

  // ---------- Init ----------
  setupEventListeners();
  updateSalaryEstimator();
  renderFeedWithSkeleton(900);
})();
