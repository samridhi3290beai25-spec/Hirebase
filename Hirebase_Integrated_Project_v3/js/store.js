// ============================================================
// Hirebase Shared Data Management Store (js/store.js)
// Centralized storage layer managing users, authentication, jobs,
// applications, bookmarks, and search suggestions in localStorage.
// Plain Vanilla JavaScript (ES6) for second-year college evaluation.
// ============================================================

(function (window) {
  "use strict";

  const STORAGE_KEYS = {
    INIT: "hb_initialized_v2",
    USERS: "hb_users_v2",
    CURRENT_USER: "hb_current_user_v2",
    LOGGED_IN: "hb_logged_in",
    JOBS: "hb_jobs_v2",
    APPLICATIONS: "hb_applications_v2",
    SAVED_JOBS: "hb_saved_jobs_v2",
    NOTIFICATIONS: "hb_notifications_v2"
  };

  // Safe read from localStorage
  function readStorage(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return fallback;
      return JSON.parse(item);
    } catch (e) {
      console.warn(`[HirebaseStore] Error reading ${key}:`, e);
      return fallback;
    }
  }

  // Safe write to localStorage
  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[HirebaseStore] Error writing ${key}:`, e);
      return false;
    }
  }

  // Seed Users
  const SEED_USERS = [
    {
      id: "usr_seeker_1",
      name: "Jordan Lee",
      email: "jordan@hirebase.com",
      // Plain text password hashed representation for demonstration purposes
      password: "Password123!",
      role: "seeker",
      createdAt: "2026-08-15T10:00:00.000Z",
      profile: {
        title: "Senior Full Stack Engineer",
        phone: "+1 (555) 234-5678",
        location: "Bengaluru, IN / Remote",
        bio: "Passionate full-stack developer with 4+ years building high-concurrency web apps with React, Node.js, and TypeScript.",
        experience: "3-5",
        linkedin: "https://linkedin.com/in/jordanlee",
        github: "https://github.com/jordanlee",
        expectedSalary: "135000",
        noticePeriod: "30days",
        resumeUrl: "https://drive.google.com/jordan-lee-resume.pdf",
        skills: ["React", "TypeScript", "Node.js", "Figma", "AWS / Cloud"]
      }
    },
    {
      id: "usr_provider_1",
      name: "Sarah Vance",
      email: "sarah@cursive.com",
      password: "Password123!",
      role: "provider",
      createdAt: "2026-08-10T09:30:00.000Z",
      company: "Cursive Labs",
      website: "https://cursive.com",
      isVerified: true,
      profile: {
        title: "Head of Technical Talent Acquisition",
        phone: "+1 (555) 987-6543",
        location: "Bengaluru, IN",
        bio: "Leading engineering hiring at Cursive Labs. Building next-generation merchant payment infrastructure."
      }
    },
    {
      id: "usr_provider_2",
      name: "David Kim",
      email: "david@nimbus.com",
      password: "Password123!",
      role: "provider",
      company: "Nimbus Labs",
      website: "https://nimbuslabs.io",
      isVerified: true,
      profile: {
        title: "Staff Design Recruiter",
        phone: "+1 (555) 456-7890",
        location: "Remote",
        bio: "Recruiting world-class product designers and design system engineers for Nimbus Labs."
      }
    }
  ];

  // Seed Jobs covering Engineering, Design, Marketing, Support, Finance, HR, Internships, Freshers
  const SEED_JOBS = [
    {
      id: "j1",
      title: "Product Designer",
      company: "Nimbus Labs",
      postedBy: "usr_provider_2",
      location: "Remote, India",
      worktype: "Remote",
      jobtype: "Full-time",
      salaryMin: 110,
      salaryMax: 140,
      skills: ["Figma", "TypeScript"],
      category: "Design",
      experience: "mid",
      companySize: "mid",
      postedDaysAgo: 1,
      match: 96,
      status: "Open",
      summary: "Own end-to-end product design for our core scheduling app, from research through polished UI.",
      responsibilities: [
        "Lead design for 2-3 product areas across web and mobile",
        "Run user research, prototype interactions, and usability tests",
        "Partner closely with engineering on tokenized design system implementation"
      ],
      qualifications: [
        "4+ years product design experience in high-growth SaaS",
        "Strong portfolio demonstrating Figma component architectures",
        "Comfortable working with design systems and user journey flows"
      ]
    },
    {
      id: "j2",
      title: "Backend Engineer",
      company: "Cursive Labs",
      postedBy: "usr_provider_1",
      location: "Bengaluru, IN",
      worktype: "On-site",
      jobtype: "Full-time",
      salaryMin: 90,
      salaryMax: 120,
      skills: ["Node.js", "TypeScript"],
      category: "Engineering",
      experience: "mid",
      companySize: "mid",
      postedDaysAgo: 2,
      match: 91,
      status: "Open",
      summary: "Build and scale high-throughput APIs powering our global payments and settlement infrastructure.",
      responsibilities: [
        "Design and ship backend microservices in Node.js and TypeScript",
        "Own reliability and on-call for core transaction settlement pipelines",
        "Mentor junior developers and participate in design reviews"
      ],
      qualifications: [
        "3+ years backend engineering experience",
        "Deep familiarity with distributed caching, SQL, and event streams",
        "Strong system design and API security fundamentals"
      ]
    },
    {
      id: "j3",
      title: "Marketing Intern",
      company: "Petal & Co",
      postedBy: "system",
      location: "Pune, IN",
      worktype: "Hybrid",
      jobtype: "Internship",
      salaryMin: 40,
      salaryMax: 50,
      skills: ["Digital Marketing"],
      category: "Marketing",
      experience: "entry",
      companySize: "startup",
      postedDaysAgo: 4,
      match: 74,
      status: "Open",
      summary: "Support campaign planning, content creation, and analytics tracking for a fast-growing consumer brand.",
      responsibilities: [
        "Assist with social media scheduling and email newsletter campaigns",
        "Draft engaging copy and creative briefs for design partners",
        "Track campaign performance metrics across Google and Meta analytics"
      ],
      qualifications: [
        "Currently pursuing or recent graduate in marketing, communications, or business",
        "Strong written English communication and copywriting skills",
        "Familiarity with social platforms, Canva, and trend research"
      ]
    },
    {
      id: "j4",
      title: "Software Engineer",
      company: "Cursive Labs",
      postedBy: "usr_provider_1",
      location: "Remote, India",
      worktype: "Remote",
      jobtype: "Full-time",
      salaryMin: 100,
      salaryMax: 135,
      skills: ["React", "TypeScript", "Node.js"],
      category: "Engineering",
      experience: "mid",
      companySize: "mid",
      postedDaysAgo: 1,
      match: 95,
      status: "Open",
      summary: "Develop robust merchant-facing web apps and high-performance financial dashboards used by thousands of businesses daily.",
      responsibilities: [
        "Build accessible, responsive features in React and TypeScript",
        "Collaborate with UI/UX designers to implement design system tokens",
        "Improve core web vitals and client-side caching efficiency"
      ],
      qualifications: [
        "3+ years professional software engineering experience",
        "Deep proficiency in modern React, state management, and TypeScript",
        "Strong understanding of browser networking and performance optimization"
      ]
    },
    {
      id: "j5",
      title: "Data Analyst",
      company: "OpenLoop Analytics",
      postedBy: "system",
      location: "Hyderabad, IN",
      worktype: "Hybrid",
      jobtype: "Full-time",
      salaryMin: 85,
      salaryMax: 115,
      skills: ["Python", "SQL"],
      category: "Engineering",
      experience: "mid",
      companySize: "mid",
      postedDaysAgo: 3,
      match: 89,
      status: "Open",
      summary: "Analyze multi-terabyte customer engagement telemetry and construct executive BI dashboards.",
      responsibilities: [
        "Build scalable SQL data transformation workflows and Tableau dashboards",
        "Conduct cohort retention analysis and A/B test statistical modeling",
        "Present analytical findings and product recommendations to VP leadership"
      ],
      qualifications: [
        "2+ years experience as a Data Analyst or BI Developer",
        "Mastery of advanced SQL and Python data libraries (pandas, matplotlib)",
        "Proven ability to translate ambiguous business questions into actionable insights"
      ]
    },
    {
      id: "j6",
      title: "Fashion Designer",
      company: "Atelier Haute Living",
      postedBy: "system",
      location: "Mumbai, IN",
      worktype: "On-site",
      jobtype: "Full-time",
      salaryMin: 65,
      salaryMax: 90,
      skills: ["Fashion Design", "Figma"],
      category: "Design",
      experience: "mid",
      companySize: "startup",
      postedDaysAgo: 2,
      match: 83,
      status: "Open",
      summary: "Lead seasonal contemporary apparel collections, fabric sourcing, and digital tech-pack design for an eco-luxury fashion line.",
      responsibilities: [
        "Create mood boards, conceptual sketches, and digital apparel illustrations",
        "Oversee sample development, fittings, and material quality assurance",
        "Collaborate with merchandising on trend forecasting and collection calendars"
      ],
      qualifications: [
        "Degree in Fashion Design or Textile Arts",
        "Proficiency in Adobe Illustrator, CLO 3D, or digital tech packs",
        "Comprehensive knowledge of fabric construction and apparel manufacturing"
      ]
    },
    {
      id: "j7",
      title: "Graphic Designer",
      company: "Prism Creative Studio",
      postedBy: "system",
      location: "Bengaluru, IN",
      worktype: "Hybrid",
      jobtype: "Full-time",
      salaryMin: 60,
      salaryMax: 85,
      skills: ["Figma"],
      category: "Design",
      experience: "entry",
      companySize: "startup",
      postedDaysAgo: 3,
      match: 86,
      status: "Open",
      summary: "Craft striking visual brand identities, marketing collateral, social graphics, and packaging concepts for fast-scaling startups.",
      responsibilities: [
        "Produce high-fidelity digital and print graphics for multi-channel campaigns",
        "Design brand style guides, pitch decks, and digital banner packages",
        "Maintain visual consistency across all customer touchpoints"
      ],
      qualifications: [
        "2+ years graphic design experience with an outstanding portfolio",
        "Strong typography, color theory, and layout fundamentals in Figma and Photoshop",
        "Ability to manage multiple project deadlines efficiently"
      ]
    },
    {
      id: "j8",
      title: "UI/UX Designer",
      company: "Nimbus Labs",
      postedBy: "usr_provider_2",
      location: "Remote, India",
      worktype: "Remote",
      jobtype: "Full-time",
      salaryMin: 115,
      salaryMax: 150,
      skills: ["Figma", "React"],
      category: "Design",
      experience: "senior",
      companySize: "mid",
      postedDaysAgo: 2,
      match: 94,
      status: "Open",
      summary: "Transform complex cloud computing workflows into intuitive, beautiful user experiences and design systems.",
      responsibilities: [
        "Architect user journeys, wireframes, and interactive micro-prototypes",
        "Establish design tokens and maintain unified component specs for engineers",
        "Conduct usability testing and iterate based on customer feedback"
      ],
      qualifications: [
        "4+ years UI/UX design experience for web and mobile SaaS",
        "Deep mastery of Figma auto-layout, components, and variables",
        "Basic understanding of HTML/CSS/React component structure"
      ]
    },
    {
      id: "j9",
      title: "Digital Marketing Specialist",
      company: "Orbit Growth Partners",
      postedBy: "system",
      location: "Remote, India",
      worktype: "Remote",
      jobtype: "Full-time",
      salaryMin: 75,
      salaryMax: 105,
      skills: ["Digital Marketing"],
      category: "Marketing",
      experience: "mid",
      companySize: "mid",
      postedDaysAgo: 3,
      match: 87,
      status: "Open",
      summary: "Manage multi-channel digital acquisition pipelines across paid search, social advertising, and conversion rate optimization.",
      responsibilities: [
        "Execute and optimize Google Ads, LinkedIn Ads, and Meta campaigns",
        "Conduct landing page A/B tests to increase signup conversion rates",
        "Track customer acquisition cost (CAC) and LTV metrics"
      ],
      qualifications: [
        "3+ years running performance digital marketing campaigns",
        "Demonstrated success managing substantial paid ad budgets",
        "Data-driven mindset with Google Analytics 4 certification"
      ]
    },
    {
      id: "j10",
      title: "HR Executive",
      company: "Cursive Labs",
      postedBy: "usr_provider_1",
      location: "Bengaluru, IN",
      worktype: "Hybrid",
      jobtype: "Full-time",
      salaryMin: 55,
      salaryMax: 80,
      skills: [],
      category: "Support",
      experience: "entry",
      companySize: "mid",
      postedDaysAgo: 4,
      match: 82,
      status: "Open",
      summary: "Coordinate employee onboarding, talent operations, company culture programs, and internal policy administration.",
      responsibilities: [
        "Facilitate seamless onboarding experiences for new global hires",
        "Maintain HRIS employee records, attendance, and compliance files",
        "Support employee engagement initiatives and wellness events"
      ],
      qualifications: [
        "Bachelor's degree in Human Resources, Business, or Psychology",
        "1-3 years experience in HR operations or people coordination",
        "Exceptional interpersonal empathy and verbal communication"
      ]
    },
    {
      id: "j11",
      title: "Accountant",
      company: "Zenith Financial Services",
      postedBy: "system",
      location: "Mumbai, IN",
      worktype: "On-site",
      jobtype: "Full-time",
      salaryMin: 65,
      salaryMax: 95,
      skills: [],
      category: "Support",
      experience: "mid",
      companySize: "enterprise",
      postedDaysAgo: 5,
      match: 85,
      status: "Open",
      summary: "Manage general ledger accounting, accounts payable/receivable, payroll processing, and financial reporting compliance.",
      responsibilities: [
        "Prepare monthly financial statements, reconciliations, and tax filings",
        "Audit vendor invoices, expense reports, and accounts receivable balances",
        "Collaborate with external auditors during annual financial audits"
      ],
      qualifications: [
        "Degree in Accounting, Commerce, or CA/CPA inter qualification",
        "3+ years corporate accounting experience",
        "Proficiency in QuickBooks, Tally Prime, and advanced Excel"
      ]
    },
    {
      id: "j12",
      title: "Web Developer (Fresher / Junior)",
      company: "Nexus Software Labs",
      postedBy: "system",
      location: "Bengaluru, IN",
      worktype: "Hybrid",
      jobtype: "Full-time",
      salaryMin: 45,
      salaryMax: 65,
      skills: ["React", "TypeScript"],
      category: "Engineering",
      experience: "entry",
      companySize: "startup",
      postedDaysAgo: 1,
      match: 92,
      status: "Open",
      summary: "Exciting opportunity for freshers and early-career developers to build modern web applications and level up with senior engineering mentors.",
      responsibilities: [
        "Implement responsive web pages using modern HTML, CSS, and React",
        "Write clean, modular code with unit test coverage",
        "Fix bugs and improve frontend accessibility"
      ],
      qualifications: [
        "Bachelor's degree in Computer Science, IT, or equivalent practical portfolio",
        "Solid grounding in JavaScript (ES6+), HTML5, and CSS3",
        "Eagerness to learn cloud architectures and modern development tooling"
      ]
    },
    {
      id: "j13",
      title: "DevOps Engineer",
      company: "OpenLoop",
      postedBy: "system",
      location: "Remote, India",
      worktype: "Remote",
      jobtype: "Contract",
      salaryMin: 95,
      salaryMax: 130,
      skills: ["Node.js", "Python"],
      category: "Engineering",
      experience: "mid",
      companySize: "mid",
      postedDaysAgo: 2,
      match: 88,
      status: "Open",
      summary: "Harden our automated deployment pipelines, maintain Kubernetes infrastructure, and improve telemetry.",
      responsibilities: [
        "Maintain CI/CD pipelines across GitHub Actions and AWS",
        "Improve monitoring, alerting, and automated failover recovery",
        "Partner with engineering on containerized microservices"
      ],
      qualifications: [
        "3+ years experience with cloud infrastructure (AWS/GCP)",
        "Proficient with Docker, Linux, and infrastructure-as-code",
        "Strong scripting background in Python or Bash"
      ]
    },
    {
      id: "j14",
      title: "Customer Support Specialist",
      company: "Petal & Co",
      postedBy: "system",
      location: "Chennai, IN",
      worktype: "On-site",
      jobtype: "Full-time",
      salaryMin: 48,
      salaryMax: 60,
      skills: [],
      category: "Support",
      experience: "entry",
      companySize: "mid",
      postedDaysAgo: 3,
      match: 80,
      status: "Open",
      summary: "Be the first point of contact for our customers, resolving inquiries with empathy, precision, and speed.",
      responsibilities: [
        "Respond to customer tickets across live chat, email, and phone",
        "Troubleshoot ordering and account issues efficiently",
        "Maintain help center documentation and report recurring customer bugs"
      ],
      qualifications: [
        "1+ years in customer service or technical support",
        "Clear and courteous written English communication",
        "Patient, problem-solving mindset under fast-paced situations"
      ]
    }
  ];

  // Seed Initial Applications
  const SEED_APPLICATIONS = [
    {
      id: "app_seed_1",
      jobId: "j1",
      candidateId: "usr_seeker_1",
      candidateName: "Jordan Lee",
      candidateEmail: "jordan@hirebase.com",
      candidatePhone: "+1 (555) 234-5678",
      candidateLocation: "Bengaluru, IN / Remote",
      candidateTitle: "Senior Full Stack Engineer",
      experience: "3-5",
      expectedSalary: "135000",
      noticePeriod: "30days",
      skills: ["Figma", "TypeScript", "React"],
      resumeUrl: "https://drive.google.com/jordan-lee-resume.pdf",
      coverNote: "I have 4+ years of cross-functional experience pairing design system tokenization with clean UI code.",
      appliedAt: "2026-08-18T14:22:00.000Z",
      status: "Under Review",
      statusHistory: [
        { status: "Applied", timestamp: "2026-08-18T14:22:00.000Z" },
        { status: "Under Review", timestamp: "2026-08-19T09:15:00.000Z" }
      ]
    }
  ];

  // Initial Saved Jobs
  const SEED_SAVED = [
    { candidateId: "usr_seeker_1", jobId: "j4", savedAt: "2026-08-17T11:00:00.000Z" }
  ];

  // Store Initialization
  function initStore() {
    if (!localStorage.getItem(STORAGE_KEYS.INIT)) {
      writeStorage(STORAGE_KEYS.USERS, SEED_USERS);
      writeStorage(STORAGE_KEYS.JOBS, SEED_JOBS);
      writeStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
      writeStorage(STORAGE_KEYS.SAVED_JOBS, SEED_SAVED);
      localStorage.setItem(STORAGE_KEYS.INIT, "true");
    }

    // Default current user if logged in flag was set previously
    const isLogged = localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === "true";
    const currentUser = readStorage(STORAGE_KEYS.CURRENT_USER, null);
    if (isLogged && !currentUser) {
      // Default to Jordan Lee for backward compatibility
      const users = readStorage(STORAGE_KEYS.USERS, SEED_USERS);
      const defaultUser = users.find(u => u.role === "seeker") || users[0];
      writeStorage(STORAGE_KEYS.CURRENT_USER, defaultUser);
    }
  }

  // Ensure initialization runs
  initStore();

  // ==========================================
  // HirebaseStore API
  // ==========================================
  const HirebaseStore = {
    // Reset development data back to clean college demo defaults
    resetToDefaults: function () {
      localStorage.removeItem(STORAGE_KEYS.INIT);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      localStorage.removeItem(STORAGE_KEYS.JOBS);
      localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
      localStorage.removeItem(STORAGE_KEYS.SAVED_JOBS);
      initStore();
      HirebaseStore.syncNavAuth();
      return true;
    },

    // ---------- User & Auth Methods ----------
    getUsers: function () {
      return readStorage(STORAGE_KEYS.USERS, SEED_USERS);
    },

    getUserById: function (id) {
      const users = HirebaseStore.getUsers();
      return users.find(u => u.id === id) || null;
    },

    getUserByEmail: function (email) {
      if (!email) return null;
      const normalized = email.trim().toLowerCase();
      const users = HirebaseStore.getUsers();
      return users.find(u => u.email.toLowerCase() === normalized) || null;
    },

    getCurrentUser: function () {
      const isLogged = localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === "true";
      if (!isLogged) return null;
      return readStorage(STORAGE_KEYS.CURRENT_USER, null);
    },

    setCurrentUser: function (user) {
      if (user) {
        writeStorage(STORAGE_KEYS.CURRENT_USER, user);
        localStorage.setItem(STORAGE_KEYS.LOGGED_IN, "true");
        document.documentElement.setAttribute("data-user-logged-in", "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
        document.documentElement.setAttribute("data-user-logged-in", "false");
      }
      HirebaseStore.syncNavAuth();
    },

    registerUser: function (userData) {
      const { name, email, password, role, company, website, profile } = userData;

      if (!name || !name.trim()) return { success: false, error: "Full name is required." };
      if (!email || !email.trim()) return { success: false, error: "Email address is required." };
      if (!password || password.length < 8) return { success: false, error: "Password must be at least 8 characters long." };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return { success: false, error: "Please enter a valid email address." };

      const normalizedEmail = email.trim().toLowerCase();
      if (HirebaseStore.getUserByEmail(normalizedEmail)) {
        return { success: false, error: "An account with this email address already exists. Please sign in." };
      }

      const assignedRole = role === "provider" ? "provider" : "seeker";
      const newUser = {
        id: "usr_" + assignedRole + "_" + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password: password, // For college demonstration
        role: assignedRole,
        createdAt: new Date().toISOString(),
        company: assignedRole === "provider" ? (company ? company.trim() : name.trim() + " Ventures") : undefined,
        website: assignedRole === "provider" ? (website ? website.trim() : "") : undefined,
        // Honest verification: new registrations are false until verified
        isVerified: false,
        profile: profile || {
          title: assignedRole === "provider" ? "Hiring Manager" : "Candidate",
          phone: "",
          location: "",
          bio: "",
          experience: "1-3",
          linkedin: "",
          github: "",
          expectedSalary: "",
          noticePeriod: "30days",
          resumeUrl: "",
          skills: []
        }
      };

      const users = HirebaseStore.getUsers();
      users.push(newUser);
      writeStorage(STORAGE_KEYS.USERS, users);
      HirebaseStore.setCurrentUser(newUser);

      return { success: true, user: newUser };
    },

    loginUser: function (email, password) {
      if (!email || !email.trim()) return { success: false, error: "Email is required." };
      if (!password) return { success: false, error: "Password is required." };

      const user = HirebaseStore.getUserByEmail(email);
      if (!user) {
        return { success: false, error: "No account found matching this email address. Please sign up." };
      }

      if (user.password !== password) {
        return { success: false, error: "Incorrect password. Please verify your credentials." };
      }

      HirebaseStore.setCurrentUser(user);
      return { success: true, user: user };
    },

    logoutUser: function () {
      HirebaseStore.setCurrentUser(null);
    },

    updateUserProfile: function (userId, profileData) {
      const users = HirebaseStore.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) return { success: false, error: "User not found." };

      users[idx].profile = Object.assign({}, users[idx].profile, profileData);
      if (profileData.name) users[idx].name = profileData.name;
      if (profileData.company && users[idx].role === "provider") users[idx].company = profileData.company;
      if (profileData.website && users[idx].role === "provider") users[idx].website = profileData.website;

      writeStorage(STORAGE_KEYS.USERS, users);

      const currentUser = HirebaseStore.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        writeStorage(STORAGE_KEYS.CURRENT_USER, users[idx]);
        HirebaseStore.syncNavAuth();
      }

      return { success: true, user: users[idx] };
    },

    // ---------- Jobs Methods ----------
    getJobs: function () {
      return readStorage(STORAGE_KEYS.JOBS, SEED_JOBS);
    },

    getJobById: function (id) {
      const jobs = HirebaseStore.getJobs();
      return jobs.find(j => j.id === id) || null;
    },

    createJob: function (jobData, providerUser) {
      if (!providerUser || providerUser.role !== "provider") {
        return { success: false, error: "Unauthorized: Only registered Job Providers can publish job listings." };
      }

      const {
        title,
        category,
        jobtype,
        worktype,
        location,
        salaryMin,
        salaryMax,
        experience,
        skills,
        description,
        company,
        website
      } = jobData;

      if (!title || !title.trim()) return { success: false, error: "Job title is required." };
      if (!description || description.trim().length < 20) {
        return { success: false, error: "Please enter a detailed job description (minimum 20 characters)." };
      }

      const companyName = providerUser.company || (company && company.trim()) || "Verified Employer";

      const newJob = {
        id: "j_" + Date.now(),
        title: title.trim(),
        company: companyName,
        website: website || providerUser.website || "",
        postedBy: providerUser.id,
        location: (location && location.trim()) || "Remote, India",
        worktype: worktype || "Remote",
        jobtype: jobtype || "Full-time",
        salaryMin: Number(salaryMin) || 60,
        salaryMax: Number(salaryMax) || 100,
        skills: Array.isArray(skills) ? skills : [],
        category: category || "Engineering",
        experience: experience || "mid",
        companySize: "mid",
        postedDaysAgo: 0,
        postedDate: new Date().toISOString(),
        match: 92,
        status: "Open",
        summary: description.trim().slice(0, 160) + (description.trim().length > 160 ? "..." : ""),
        responsibilities: [
          description.trim().slice(0, 120),
          "Collaborate with multi-disciplinary stakeholders to achieve project milestones",
          "Maintain performance, security, and high reliability standards"
        ],
        qualifications: [
          "Demonstrated expertise matching role requirements",
          "Strong communication and collaborative problem solving",
          "Relevant experience in the required domain"
        ]
      };

      const jobs = HirebaseStore.getJobs();
      jobs.unshift(newJob);
      writeStorage(STORAGE_KEYS.JOBS, jobs);

      return { success: true, job: newJob };
    },

    updateJobStatus: function (jobId, newStatus, providerUser) {
      if (!providerUser || providerUser.role !== "provider") {
        return { success: false, error: "Unauthorized: Only Job Providers can manage job statuses." };
      }

      const jobs = HirebaseStore.getJobs();
      const job = jobs.find(j => j.id === jobId);
      if (!job) return { success: false, error: "Job not found." };

      // Ensure ownership: provider can only modify their own job or seeded jobs if testing
      if (job.postedBy !== providerUser.id && job.postedBy !== "system") {
        return { success: false, error: "Access denied: You can only modify jobs posted by your company account." };
      }

      job.status = newStatus;
      writeStorage(STORAGE_KEYS.JOBS, jobs);
      return { success: true, job: job };
    },

    getJobsByProvider: function (providerId) {
      const jobs = HirebaseStore.getJobs();
      return jobs.filter(j => j.postedBy === providerId || (providerId === "usr_provider_1" && j.company === "Cursive Labs"));
    },

    // ---------- Application Methods ----------
    getApplications: function () {
      return readStorage(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
    },

    getApplicationById: function (id) {
      const apps = HirebaseStore.getApplications();
      return apps.find(a => a.id === id) || null;
    },

    hasApplied: function (candidateId, jobId) {
      if (!candidateId || !jobId) return false;
      const apps = HirebaseStore.getApplications();
      return apps.some(a => a.candidateId === candidateId && a.jobId === jobId);
    },

    applyForJob: function (jobId, candidateUser, applicationData) {
      if (!candidateUser) {
        return { success: false, error: "Please sign in to submit your job application." };
      }
      if (candidateUser.role === "provider") {
        return { success: false, error: "Employer accounts cannot apply for jobs. Please log in with a Candidate account." };
      }

      const job = HirebaseStore.getJobById(jobId);
      if (!job) {
        return { success: false, error: "The requested job listing was not found." };
      }
      if (job.status === "Closed") {
        return { success: false, error: "This position has been filled or closed by the employer." };
      }

      if (HirebaseStore.hasApplied(candidateUser.id, jobId)) {
        return { success: false, error: "You have already submitted an application for this position." };
      }

      const {
        name,
        email,
        phone,
        location,
        title,
        experience,
        expectedSalary,
        noticePeriod,
        skills,
        resumeUrl,
        coverNote
      } = applicationData;

      if (!name || !name.trim()) return { success: false, error: "Full name is required." };
      if (!email || !email.trim()) return { success: false, error: "Email is required." };
      if (!resumeUrl || !resumeUrl.trim()) return { success: false, error: "Resume or Portfolio URL is required." };

      const newApp = {
        id: "app_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        candidateId: candidateUser.id,
        candidateName: name.trim(),
        candidateEmail: email.trim().toLowerCase(),
        candidatePhone: phone ? phone.trim() : "",
        candidateLocation: location ? location.trim() : "",
        candidateTitle: title ? title.trim() : "",
        experience: experience || "1-3",
        expectedSalary: expectedSalary || "",
        noticePeriod: noticePeriod || "30days",
        skills: Array.isArray(skills) ? skills : [],
        resumeUrl: resumeUrl.trim(),
        coverNote: coverNote ? coverNote.trim() : "",
        appliedAt: new Date().toISOString(),
        status: "Applied",
        statusHistory: [
          { status: "Applied", timestamp: new Date().toISOString() }
        ]
      };

      const apps = HirebaseStore.getApplications();
      apps.unshift(newApp);
      writeStorage(STORAGE_KEYS.APPLICATIONS, apps);

      // Also persist profile information for the candidate if empty
      HirebaseStore.updateUserProfile(candidateUser.id, {
        name: name.trim(),
        phone: phone ? phone.trim() : candidateUser.profile?.phone,
        location: location ? location.trim() : candidateUser.profile?.location,
        title: title ? title.trim() : candidateUser.profile?.title,
        resumeUrl: resumeUrl.trim()
      });

      return { success: true, application: newApp };
    },

    getApplicationsByCandidate: function (candidateId) {
      const apps = HirebaseStore.getApplications();
      return apps.filter(a => a.candidateId === candidateId);
    },

    getApplicationsByJob: function (jobId, providerUser) {
      const job = HirebaseStore.getJobById(jobId);
      if (!job) return [];
      // Security check
      if (providerUser && providerUser.role === "provider") {
        if (job.postedBy !== providerUser.id && job.postedBy !== "system") {
          return [];
        }
      }
      const apps = HirebaseStore.getApplications();
      return apps.filter(a => a.jobId === jobId);
    },

    getApplicationsForProvider: function (providerUser) {
      if (!providerUser || providerUser.role !== "provider") return [];
      const providerJobs = HirebaseStore.getJobsByProvider(providerUser.id);
      const jobIds = new Set(providerJobs.map(j => j.id));
      const apps = HirebaseStore.getApplications();
      return apps.filter(a => jobIds.has(a.jobId));
    },

    updateApplicationStatus: function (applicationId, newStatus, providerUser) {
      if (!providerUser || providerUser.role !== "provider") {
        return { success: false, error: "Unauthorized: Only Job Providers can update candidate application status." };
      }

      const validStatuses = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Rejected", "Accepted"];
      if (!validStatuses.includes(newStatus)) {
        return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
      }

      const apps = HirebaseStore.getApplications();
      const app = apps.find(a => a.id === applicationId);
      if (!app) return { success: false, error: "Application record not found." };

      const job = HirebaseStore.getJobById(app.jobId);
      if (!job) return { success: false, error: "Associated job not found." };

      // Ensure ownership
      if (job.postedBy !== providerUser.id && job.postedBy !== "system") {
        return { success: false, error: "Access denied: You can only update applications for your own company's jobs." };
      }

      app.status = newStatus;
      if (!app.statusHistory) app.statusHistory = [];
      app.statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString()
      });

      writeStorage(STORAGE_KEYS.APPLICATIONS, apps);
      return { success: true, application: app };
    },

    // ---------- Saved Jobs ----------
    getSavedJobIds: function (candidateId) {
      if (!candidateId) return new Set();
      const allSaved = readStorage(STORAGE_KEYS.SAVED_JOBS, SEED_SAVED);
      return new Set(allSaved.filter(s => s.candidateId === candidateId).map(s => s.jobId));
    },

    toggleSaveJob: function (jobId, candidateId) {
      if (!candidateId) return { success: false, error: "Please log in to save jobs." };
      let allSaved = readStorage(STORAGE_KEYS.SAVED_JOBS, SEED_SAVED);
      const existsIndex = allSaved.findIndex(s => s.candidateId === candidateId && s.jobId === jobId);

      let isSaved = false;
      if (existsIndex > -1) {
        allSaved.splice(existsIndex, 1);
        isSaved = false;
      } else {
        allSaved.push({
          candidateId: candidateId,
          jobId: jobId,
          savedAt: new Date().toISOString()
        });
        isSaved = true;
      }

      writeStorage(STORAGE_KEYS.SAVED_JOBS, allSaved);
      return { success: true, isSaved: isSaved };
    },

    // ---------- Search & Autocomplete ----------
    getSearchSuggestions: function (query) {
      if (!query || !query.trim()) return [];
      const clean = query.trim().toLowerCase();
      const jobs = HirebaseStore.getJobs();
      const suggestions = new Map(); // value -> metadata

      // Supplement with standard college demo roles
      const standardKeywords = [
        { label: "Software Engineer", category: "Role" },
        { label: "Web Developer", category: "Role" },
        { label: "Data Analyst", category: "Role" },
        { label: "Fashion Designer", category: "Role" },
        { label: "Graphic Designer", category: "Role" },
        { label: "UI/UX Designer", category: "Role" },
        { label: "Digital Marketing", category: "Role" },
        { label: "HR Executive", category: "Role" },
        { label: "Accountant", category: "Role" },
        { label: "Internships", category: "Type" },
        { label: "Fresher Jobs", category: "Level" }
      ];

      // 1. Check existing stored jobs
      jobs.forEach(j => {
        if (j.title && j.title.toLowerCase().includes(clean)) {
          suggestions.set(j.title, { text: j.title, type: "Job Title", count: (suggestions.get(j.title)?.count || 0) + 1 });
        }
        if (j.company && j.company.toLowerCase().includes(clean)) {
          suggestions.set(j.company, { text: j.company, type: "Company", count: 1 });
        }
        if (Array.isArray(j.skills)) {
          j.skills.forEach(s => {
            if (s.toLowerCase().includes(clean)) {
              suggestions.set(s, { text: s, type: "Skill", count: 1 });
            }
          });
        }
      });

      // 2. Check standard keywords
      standardKeywords.forEach(k => {
        if (k.label.toLowerCase().includes(clean) && !suggestions.has(k.label)) {
          suggestions.set(k.label, { text: k.label, type: k.category, count: 1 });
        }
      });

      // Convert to array and limit to top 8 suggestions
      return Array.from(suggestions.values()).slice(0, 8);
    },

    searchJobs: function (options) {
      const {
        keyword,
        location,
        worktype,
        jobtype,
        experience,
        minSalary,
        skill,
        category,
        sort,
        tab,
        currentUser
      } = options;

      let list = HirebaseStore.getJobs();

      // Filter by Tab (all, saved, applied)
      if (tab === "saved") {
        if (!currentUser) return [];
        const savedIds = HirebaseStore.getSavedJobIds(currentUser.id);
        list = list.filter(j => savedIds.has(j.id));
      } else if (tab === "applied") {
        if (!currentUser) return [];
        const candidateApps = HirebaseStore.getApplicationsByCandidate(currentUser.id);
        const appliedJobIds = new Set(candidateApps.map(a => a.jobId));
        list = list.filter(j => appliedJobIds.has(j.id));
      }

      // Keyword partial & case-insensitive matching
      if (keyword && keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        list = list.filter(j => {
          const title = (j.title || "").toLowerCase();
          const comp = (j.company || "").toLowerCase();
          const desc = (j.summary || "").toLowerCase();
          const loc = (j.location || "").toLowerCase();
          const skillsStr = Array.isArray(j.skills) ? j.skills.join(" ").toLowerCase() : "";
          const cat = (j.category || "").toLowerCase();

          return (
            title.includes(q) ||
            comp.includes(q) ||
            desc.includes(q) ||
            loc.includes(q) ||
            skillsStr.includes(q) ||
            cat.includes(q)
          );
        });
      }

      // Work location filter (Remote, Hybrid, On-site)
      if (location && location !== "") {
        list = list.filter(j => j.worktype === location || (j.location && j.location.toLowerCase().includes(location.toLowerCase())));
      }
      if (worktype && worktype.size > 0) {
        list = list.filter(j => worktype.has(j.worktype));
      }

      // Employment type filter (Full-time, Contract, Internship)
      if (jobtype && jobtype.size > 0) {
        list = list.filter(j => jobtype.has(j.jobtype));
      }

      // Experience level
      if (experience && experience !== "") {
        list = list.filter(j => j.experience === experience || (j.qualifications && j.qualifications.some(q => q.toLowerCase().includes(experience.toLowerCase()))));
      }

      // Minimum salary
      if (minSalary && typeof minSalary === "number") {
        list = list.filter(j => j.salaryMax >= minSalary);
      }

      // Required Skill
      if (skill && skill !== "All") {
        list = list.filter(j => Array.isArray(j.skills) && j.skills.includes(skill));
      }

      // Department Category
      if (category && category !== "All") {
        list = list.filter(j => j.category === category);
      }

      // Sorting
      const sorted = [...list];
      if (sort === "newest") {
        sorted.sort((a, b) => (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0));
      } else if (sort === "salary") {
        sorted.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
      } else {
        // Best match
        sorted.sort((a, b) => (b.match || 80) - (a.match || 80));
      }

      return sorted;
    },

    // ---------- Global Navbar & Auth Synchronizer ----------
    syncNavAuth: function () {
      const currentUser = HirebaseStore.getCurrentUser();
      const isLogged = !!currentUser;

      document.documentElement.setAttribute("data-user-logged-in", isLogged ? "true" : "false");

      // Update Profile Link and Avatar across the document
      const profileLinks = document.querySelectorAll(".profile-link");
      profileLinks.forEach(link => {
        if (isLogged) {
          // Point to respective portal
          link.href = currentUser.role === "provider" ? "post-job.html" : "apply-job.html";
          
          const avatar = link.querySelector(".profile-avatar");
          const nameSpan = link.querySelector("span:nth-child(2)");
          
          if (avatar) {
            const initials = currentUser.name
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            avatar.textContent = initials || "U";
          }
          if (nameSpan) {
            nameSpan.textContent = currentUser.name || "My Account";
          }
        }
      });

      // Update Logout links
      const logoutLinks = document.querySelectorAll(".logout-link");
      logoutLinks.forEach(link => {
        link.onclick = function (e) {
          e.preventDefault();
          HirebaseStore.logoutUser();
          window.location.href = "Index.html?logout=success";
        };
      });
    }
  };

  // Run navbar sync when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", HirebaseStore.syncNavAuth);
  } else {
    HirebaseStore.syncNavAuth();
  }

  // Expose globally
  window.HirebaseStore = HirebaseStore;
})(window);
