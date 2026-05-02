import { firebaseConfig } from "./firebase-config.js";

const Firebase = { app: null, auth: null, db: null, ready: false, modules: null, authUsesFallbackPersistence: false };

const state = {
  user: null,
  demoMode: false,
  rememberedMode: false,
  sessions: [],
  activeSessionId: "",
  activeCourseId: "",
  activeQuestionIndex: 0,
  showResultScreen: false,
  answers: {},
  courseScores: {},
};

const CACHE_KEYS = {
  sessions: "paem9:sessions:v2",
  userStatePrefix: "paem9:user-state:v2:",
  rememberedUser: "paem9:remembered-user:v1",
  profileSyncPrefix: "paem9:profile-sync:v1:",
};

const CACHE_TTL = {
  sessions: 24 * 60 * 60 * 1000,
  profileSync: 24 * 60 * 60 * 1000,
};

// ── DOM refs ──
const $ = (id) => document.getElementById(id);
const els = {
  screenAuth:      $("screenAuth"),
  screenHome:      $("screenHome"),
  screenCourses:   $("screenCourses"),
  screenQuestions: $("screenQuestions"),
  screenProfile:   $("screenProfile"),

  loginBox:      $("loginBox"),
  signupBox:     $("signupBox"),
  loginForm:     $("loginForm"),
  loginButton:   $("loginButton"),
  showSignupButton: $("showSignupButton"),
  signupForm:    $("signupForm"),
  signupName:    $("signupName"),
  signupEmail:   $("signupEmail"),
  signupPassword:$("signupPassword"),
  submitSignupButton: $("submitSignupButton"),
  showLoginButton:    $("showLoginButton"),
  signupAuthMessage:  $("signupAuthMessage"),
  googleLoginButton:  $("googleLoginButton"),
  authMessage:   $("authMessage"),
  email:         $("email"),
  password:      $("password"),

  homeUserName:       $("homeUserName"),
  homeSessionList:    $("homeSessionList"),
  homeInfoPanel:      $("homeInfoPanel"),

  coursesBackButton:    $("coursesBackButton"),
  coursesProfileButton: $("coursesProfileButton"),
  coursesSessionTitle:  $("coursesSessionTitle"),
  courseListMobile:     $("courseListMobile"),

  questionsBackButton: $("questionsBackButton"),
  questionsCourseName: $("questionsCourseName"),
  qHeaderCount:        $("qHeaderCount"),
  qHeaderScore:        $("qHeaderScore"),
  questionProgressWrap:  $("questionProgressWrap"),
  questionAreaMobile:    $("questionAreaMobile"),
  questionControlsMobile:$("questionControlsMobile"),

  profileButton:     $("profileButton"),
  profileBackButton: $("profileBackButton"),
  logoutButton:      $("logoutButton"),
  profileEmail:      $("profileEmail"),
  profileName:       $("profileName"),
  profileCreatedAt:  $("profileCreatedAt"),
  profileAvatarBig:  $("profileAvatarBig"),

  leaderboardButton:     $("leaderboardButton"),
  leaderboardBackButton: $("leaderboardBackButton"),
  leaderboardList:       $("leaderboardList"),
  leaderboardMyScore:    $("leaderboardMyScore"),
  leaderboardMyRank:     $("leaderboardMyRank"),
  screenLeaderboard:     $("screenLeaderboard"),
};

const letters = ["A","B","C","D","E"];

init();

async function init() {
  bindEvents();
  await initFirebase();
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.showSignupButton.addEventListener("click", showSignupScreen);
  els.showLoginButton.addEventListener("click", showLoginScreen);
  els.signupForm.addEventListener("submit", handleSignupForm);
  els.googleLoginButton.addEventListener("click", handleGoogleLogin);
  els.logoutButton.addEventListener("click", handleLogout);
  els.profileButton.addEventListener("click", () => navigate("profile"));
  els.coursesProfileButton.addEventListener("click", () => navigate("profile"));
  els.profileBackButton.addEventListener("click", () => navigate("home"));
  els.coursesBackButton.addEventListener("click", () => navigate("home"));
  els.questionsBackButton.addEventListener("click", () => navigate("courses"));
  els.leaderboardButton?.addEventListener("click", () => navigate("leaderboard"));
  els.leaderboardBackButton?.addEventListener("click", () => navigate("home"));
}

// ── Navigation ──
function navigate(screen) {
  const all = [
    els.screenAuth, els.screenHome, els.screenCourses,
    els.screenQuestions, els.screenProfile, els.screenLeaderboard
  ];
  all.forEach(s => s?.classList.add("hidden"));
  const map = {
    auth:        els.screenAuth,
    home:        els.screenHome,
    courses:     els.screenCourses,
    questions:   els.screenQuestions,
    profile:     els.screenProfile,
    leaderboard: els.screenLeaderboard,
  };
  map[screen]?.classList.remove("hidden");
  if (screen === "profile") renderProfile();
  if (screen === "leaderboard") loadLeaderboard();
  window.scrollTo(0, 0);
}

// ── Firebase ──
async function initFirebase() {
  // Show loading overlay until auth state is known
  showLoadingOverlay(true);

  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    ]);
    Firebase.modules = { ...appMod, ...authMod, ...dbMod };
    Firebase.app  = Firebase.modules.initializeApp(firebaseConfig);
    Firebase.auth = createAuth();
    if (Firebase.authUsesFallbackPersistence) await configureAuthPersistence();
    Firebase.db   = Firebase.modules.getFirestore(Firebase.app);
    Firebase.ready = true;

    // First: check if this is a redirect-back from Google sign-in
    let handledByRedirect = false;
    try {
      const redirectResult = await Firebase.modules.getRedirectResult(Firebase.auth);
      if (redirectResult?.user) {
        handledByRedirect = true;
        await openMainForUser(redirectResult.user);
        showLoadingOverlay(false);
        return;
      }
    } catch (e) {
      // auth/unauthorized-domain or similar — show error on auth screen
      showLoadingOverlay(false);
      navigate("auth");
      setAuthMsg(firebaseErrorMessage(e));
      return;
    }

    // Second: wait for Firebase to restore existing session
    if (typeof Firebase.auth.authStateReady === "function") {
      await Firebase.auth.authStateReady();
    }

    if (Firebase.auth.currentUser) {
      await openMainForUser(Firebase.auth.currentUser);
    } else if (loadRememberedUser()) {
      await openMainFromRememberedUser(loadRememberedUser());
    } else {
      navigate("auth");
    }

    showLoadingOverlay(false);

    // Ongoing auth state changes (e.g. sign-out from another tab)
    Firebase.modules.onAuthStateChanged(Firebase.auth, async (user) => {
      if (user?.uid && user.uid === state.user?.uid) return;
      if (!user) {
        if (state.rememberedMode || loadRememberedUser()) return;
        state.user = null;
        navigate("auth");
        return;
      }
      await openMainForUser(user);
    });
  } catch (error) {
    showLoadingOverlay(false);
    setAuthMsg(`Firebase başlatılamadı: ${error.message}`);
    navigate("auth");
  }
}

function showLoadingOverlay(show) {
  let el = document.getElementById("loadingOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "loadingOverlay";
    el.style.cssText = `
      position:fixed;inset:0;z-index:999;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
      background:linear-gradient(160deg,#08111f,#0d1b2f 55%,#111827);
    `;
    el.innerHTML = `
      <div style="width:48px;height:48px;border-radius:50%;border:3px solid rgba(201,154,46,.2);border-top-color:#c99a2e;animation:spin .8s linear infinite;"></div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      <p style="color:#b7c4d6;font-size:.9rem;font-weight:600;font-family:Inter,sans-serif;">Yükleniyor...</p>
    `;
    document.body.appendChild(el);
  }
  el.style.display = show ? "flex" : "none";
}

function createAuth() {
  if (typeof Firebase.modules.initializeAuth === "function") {
    try {
      Firebase.authUsesFallbackPersistence = false;
      return Firebase.modules.initializeAuth(Firebase.app, {
        persistence: [
          Firebase.modules.indexedDBLocalPersistence,
          Firebase.modules.browserLocalPersistence,
          Firebase.modules.browserSessionPersistence,
        ].filter(Boolean),
        popupRedirectResolver: Firebase.modules.browserPopupRedirectResolver,
      });
    } catch {}
  }
  Firebase.authUsesFallbackPersistence = true;
  return Firebase.modules.getAuth(Firebase.app);
}

async function configureAuthPersistence() {
  for (const p of [Firebase.modules.browserLocalPersistence, Firebase.modules.browserSessionPersistence, Firebase.modules.inMemoryPersistence].filter(Boolean)) {
    try { await Firebase.modules.setPersistence(Firebase.auth, p); return; } catch {}
  }
}

async function openMainForUser(user) {
  state.user = user;
  state.demoMode = false;
  state.rememberedMode = false;
  persistRememberedUser(user);
  try {
    await loadFirestoreData();
    restoreUserStateFromCache();
  } catch (e) {
    console.warn("loadFirestoreData hatası:", e);
    state.sessions = [];
    state.answers  = {};
    state.courseScores = {};
  }
  await syncUserProfileIfNeeded(user);
  showHome();
  if (!sessionStorage.getItem("promoShown")) {
    sessionStorage.setItem("promoShown", "1");
    setTimeout(showPromoToast, 1200);
  }
}

function showPromoToast() {
  const toast = document.getElementById("promoToast");
  const closeBtn = document.getElementById("promoToastClose");
  if (!toast) return;
  toast.classList.remove("hidden");
  function dismiss() {
    toast.style.animationName = "toastSlideOut";
    toast.style.animationDuration = ".25s";
    toast.style.animationFillMode = "forwards";
    setTimeout(() => toast.classList.add("hidden"), 260);
  }
  closeBtn?.addEventListener("click", dismiss, { once: true });
  setTimeout(dismiss, 8000);
}

async function openMainFromRememberedUser(user) {
  state.user = user;
  state.demoMode = false;
  state.rememberedMode = true;
  try {
    await loadFirestoreData();
    restoreUserStateFromCache();
  } catch {}
  showHome();
}

async function syncUserProfileIfNeeded(user, options = {}) {
  if (!user || !Firebase.db || state.demoMode || state.rememberedMode) return;
  if (!options.force && isProfileSyncFresh(user.uid)) return;

  try {
    const { doc, setDoc, serverTimestamp } = Firebase.modules;
    const profile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "Anonim",
      lastSeen: serverTimestamp(),
    };
    if (options.create) profile.createdAt = serverTimestamp();
    await setDoc(doc(Firebase.db, "users", user.uid), profile, { merge: true });
    markProfileSynced(user.uid);
  } catch (e) {
    console.error("Firestore kullanıcı yazma hatası:", e.code, e.message);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  try {
    await Firebase.modules.signInWithEmailAndPassword(Firebase.auth, els.email.value.trim(), els.password.value);
  } catch (err) {
    setAuthMsg(firebaseErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

async function handleSignupForm(e) {
  e.preventDefault();
  const name = els.signupName.value.trim();
  const email = els.signupEmail.value.trim();
  const password = els.signupPassword.value;
  if (!name || !email || !password) { els.signupAuthMessage.textContent = "Lütfen tüm alanları doldurun."; return; }
  setLoading(true, "signup");
  try {
    const r = await Firebase.modules.createUserWithEmailAndPassword(Firebase.auth, email, password);
    await Firebase.modules.updateProfile(r.user, { displayName: name });
    await syncUserProfileIfNeeded(r.user, { force: true, create: true });
    await openMainForUser(r.user);
  } catch (err) {
    els.signupAuthMessage.textContent = firebaseErrorMessage(err);
  } finally {
    setLoading(false, "signup");
  }
}

async function handleGoogleLogin() {
  if (!Firebase.ready || !Firebase.modules) {
    setAuthMsg("Firebase henüz hazır değil, lütfen bekleyin.");
    return;
  }
  setLoading(true, "google");
  try {
    const provider = new Firebase.modules.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await Firebase.modules.signInWithPopup(Firebase.auth, provider);
    await openMainForUser(result.user);
  } catch (err) {
    if (err.code === "auth/popup-blocked") {
      try {
        const p2 = new Firebase.modules.GoogleAuthProvider();
        p2.setCustomParameters({ prompt: "select_account" });
        await Firebase.modules.signInWithRedirect(Firebase.auth, p2);
      } catch (e2) {
        setAuthMsg(firebaseErrorMessage(e2));
        setLoading(false, "google");
      }
      return;
    }
    if (err.code !== "auth/popup-closed-by-user") {
      setAuthMsg(firebaseErrorMessage(err));
    }
    setLoading(false, "google");
  }
}

async function handleLogout() {
  clearRememberedUser();
  state.user = null;
  state.sessions = [];
  state.answers  = {};
  state.courseScores = {};
  if (Firebase.ready) {
    try { await Firebase.modules.signOut(Firebase.auth); } catch {}
  }
  navigate("auth");
}

function showSignupScreen() { els.loginBox.classList.add("hidden"); els.signupBox.classList.remove("hidden"); }
function showLoginScreen()  { els.signupBox.classList.add("hidden"); els.loginBox.classList.remove("hidden"); }

// ── Home ──
function showHome() {
  const name = state.user?.displayName || state.user?.email?.split("@")[0] || "Öğrenci";
  els.homeUserName.textContent = name;
  if (els.profileAvatarBig) els.profileAvatarBig.textContent = name[0]?.toUpperCase() || "P";
  renderHomeSessionCards();
  navigate("home");
}

function renderHomeSessionCards() {
  els.homeSessionList.innerHTML = "";
  if (els.homeInfoPanel) els.homeInfoPanel.innerHTML = "";
  
  if (!state.sessions.length) {
    els.homeSessionList.innerHTML = `<p style="color:#7f8fa4;text-align:center;padding:24px;">Yükleniyor...</p>`;
    return;
  }
  
  // Render Info Panel
  if (els.homeInfoPanel) {
    let infoHtml = `<h3 class="info-panel-title">📚 Sınav İçeriği</h3><div class="info-panel-content">`;
    state.sessions.forEach((session, idx) => {
      infoHtml += `
        <div class="info-panel-session">
          <h4>${idx + 1}. Oturum Konuları</h4>
          <ul>
            ${(session.courses || []).map(c => `<li>${escapeHtml(c.title)}</li>`).join("")}
          </ul>
        </div>
      `;
    });
    infoHtml += `</div>`;
    els.homeInfoPanel.innerHTML = infoHtml;
  }

  state.sessions.forEach((session, idx) => {
    const totalQ = session.courses?.reduce((s, c) => s + (c.questions?.length || 0), 0) || 0;
    const answeredQ = session.courses?.reduce((s, c) => s + (c.questions?.filter(q => state.answers[q.id]).length || 0), 0) || 0;
    let examDateStr = session.examDate && session.startsAt ? `${session.examDate}T${session.startsAt}:00` : "";
    const card = document.createElement("button");
    card.type = "button";
    card.className = "session-card";
    card.innerHTML = `
      <div class="session-card-label">Oturum ${idx + 1}</div>
      <div class="session-card-title">${escapeHtml(session.title)}</div>
      <div class="session-card-meta">${session.courses?.length || 0} ders · ${totalQ} soru · ${answeredQ} çözüldü</div>
      ${examDateStr ? `<div class="session-card-countdown" data-exam-date="${examDateStr}">00:00:00</div>` : ""}
      <span class="session-card-arrow">›</span>
    `;
    card.addEventListener("click", () => openSession(session.id));
    els.homeSessionList.append(card);
  });
  updateCountdowns();
  if (!window.countdownInterval) {
    window.countdownInterval = setInterval(updateCountdowns, 1000);
  }
}

function updateCountdowns() {
  document.querySelectorAll(".session-card-countdown").forEach(el => {
    const target = new Date(el.dataset.examDate).getTime();
    if (isNaN(target)) return;
    const diff = target - Date.now();
    if (diff <= 0) {
      el.textContent = "00:00:00";
    } else {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const dayStr = d > 0 ? `${d} gün ` : "";
      el.textContent = `${dayStr}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  });
}

function openSession(sessionId) {
  state.activeSessionId = sessionId;
  const session = state.sessions.find(s => s.id === sessionId);
  if (!session) return;
  els.coursesSessionTitle.textContent = session.title;
  renderCourseCards(session);
  navigate("courses");
}

function renderCourseCards(session) {
  els.courseListMobile.innerHTML = "";
  const icons = ["📚","⚖️","🔬","🛡️","📡","🔎","💊","🌿","🧪","📋"];
  (session.courses || []).forEach((course, idx) => {
    const qCount = course.questions?.length || 0;
    const answered = course.questions?.filter(q => state.answers[q.id]).length || 0;
    const correct  = course.questions?.filter(q => state.answers[q.id]?.isCorrect).length || 0;

    const card = document.createElement("div");
    card.className = "course-card-mobile-wrap";
    card.innerHTML = `
      <button type="button" class="course-card-mobile">
        <div class="course-card-icon">${icons[idx % icons.length]}</div>
        <div class="course-card-body">
          <div class="course-card-name">${escapeHtml(course.title)}</div>
          <div class="course-card-info">${course.expectedQuestionCount ? `Sınavda ${course.expectedQuestionCount} soru · ` : ""}${qCount} soru${answered ? ` · ${correct}/${answered} doğru` : ""}</div>
        </div>
        <div class="course-card-chevron"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div>
      </button>
    `;
    card.querySelector(".course-card-mobile").addEventListener("click", () => openCourse(session.id, course.id));
    els.courseListMobile.append(card);
  });
}



function openCourse(sessionId, courseId) {
  state.activeSessionId   = sessionId;
  state.activeCourseId    = courseId;
  state.activeQuestionIndex = 0;
  state.showResultScreen  = false;
  persistUserStateToCache();
  const course = getActiveCourse();
  if (!course) return;
  els.questionsCourseName.textContent = course.title;
  renderQuestions();
  navigate("questions");
}

// ── Questions ──
function getActiveSession() { return state.sessions.find(s => s.id === state.activeSessionId); }
function getActiveCourse()  {
  const session = getActiveSession();
  return session?.courses?.find(c => c.id === state.activeCourseId);
}

function countCorrect(questions) {
  return questions.filter(q => state.answers[q.id]?.isCorrect).length;
}

function renderQuestions() {
  const course = getActiveCourse();
  const questions = course?.questions || [];

  // header stats
  els.qHeaderCount.textContent = `${questions.length} soru`;
  els.qHeaderScore.textContent = `${countCorrect(questions)} doğru`;

  if (!questions.length) {
    els.questionProgressWrap.innerHTML = "";
    els.questionAreaMobile.innerHTML = `<div style="color:#7f8fa4;text-align:center;padding:32px;">Bu ders için henüz soru eklenmedi.</div>`;
    els.questionControlsMobile.innerHTML = "";
    return;
  }

  if (state.showResultScreen) {
    renderResultScreen(questions);
    return;
  }

  const idx = Math.min(state.activeQuestionIndex, questions.length - 1);
  state.activeQuestionIndex = idx;

  // progress bar
  els.questionProgressWrap.innerHTML = `
    <div class="q-progress-text">
      <span>Soru ${idx + 1} / ${questions.length}</span>
      <span>${countCorrect(questions)} doğru</span>
    </div>
    <div class="q-progress-bar">
      <div class="q-progress-fill" style="width:${((idx + 1) / questions.length) * 100}%"></div>
    </div>
  `;

  renderQuestionCard(questions[idx], idx);
  renderQuestionControls(questions);
}

function renderQuestionCard(question, idx) {
  const answer   = state.answers[question.id];
  const selected = answer?.selectedOptionId;

  const card = document.createElement("div");
  card.className = "question-card-mobile";

  let explanationHtml = "";
  if (answer) {
    let expText = question.explanation || "";
    if (!expText) {
      if (answer.isCorrect) {
        expText = "Doğru cevap!";
      } else {
        const correctOpt = question.options.find(o => o.id === question.correctOptionId);
        const correctLetter = letters[question.options.findIndex(o => o.id === question.correctOptionId)];
        expText = "Doğru cevap: " + correctLetter + ") " + (correctOpt?.text || "");
      }
    }
    explanationHtml = `<div class="q-explanation ${answer.isCorrect ? "" : "wrong"}">${escapeHtml(expText)}</div>`;
  }

  card.innerHTML = `
    <div class="q-num-badge">Soru ${idx + 1}</div>
    <p class="q-text">${escapeHtml(question.text)}</p>
    <div class="options-list"></div>
    ${explanationHtml}
  `;

  const optionsList = card.querySelector(".options-list");
  question.options.forEach((opt, i) => {
    const isSelected = selected === opt.id;
    const isCorrect  = opt.id === question.correctOptionId;
    const showResult = Boolean(answer);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = ["option-btn-mobile",
      showResult && isCorrect  ? "correct"   : "",
      showResult && isSelected && !isCorrect ? "incorrect" : "",
    ].filter(Boolean).join(" ");
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${escapeHtml(opt.text)}</span>`;
    if (answer) btn.disabled = true;
    btn.addEventListener("click", () => saveAnswer(question, opt.id));
    optionsList.append(btn);
  });

  els.questionAreaMobile.innerHTML = "";
  els.questionAreaMobile.append(card);
}

function renderQuestionControls(questions) {
  const idx = state.activeQuestionIndex;
  const isLast = idx >= questions.length - 1;

  els.questionControlsMobile.innerHTML = "";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "qc-btn reset";
  resetBtn.textContent = "↺";
  resetBtn.title = "Testi Sıfırla";
  resetBtn.addEventListener("click", () => {
    if (confirm("Bu testteki tüm cevaplarınız silinecek. Emin misiniz?")) {
      const course = getActiveCourse();
      course?.questions?.forEach(q => delete state.answers[q.id]);
      state.activeQuestionIndex = 0;
      state.showResultScreen = false;
      persistUserStateToCache();
      renderQuestions();
    }
  });

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "qc-btn secondary";
  prevBtn.textContent = "← Önceki";
  prevBtn.disabled = idx === 0;
  prevBtn.addEventListener("click", () => {
    state.activeQuestionIndex = Math.max(idx - 1, 0);
    persistUserStateToCache();
    renderQuestions();
    window.scrollTo(0, 0);
  });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "qc-btn primary";
  nextBtn.textContent = isLast ? "Testi Bitir ✓" : "Sonraki →";
  nextBtn.addEventListener("click", () => {
    if (isLast) {
      state.showResultScreen = true;
      persistUserStateToCache();
      renderQuestions();
    } else {
      state.activeQuestionIndex = idx + 1;
      persistUserStateToCache();
      renderQuestions();
      window.scrollTo(0, 0);
    }
  });

  els.questionControlsMobile.append(resetBtn, prevBtn, nextBtn);
}

// ── Score saving (delta-based leaderboard) ──
async function saveScoreIfImproved(courseId, newCorrect) {
  if (!Firebase.ready || state.demoMode || state.rememberedMode) return;
  const uid = state.user?.uid;
  if (!uid) return;

  const prevBest = state.courseScores?.[courseId]?.best || 0;
  const best = Math.max(prevBest, newCorrect);
  const delta = best - prevBest;
  if (delta <= 0) return;

  state.courseScores[courseId] = { best, updatedAt: new Date().toISOString() };
  persistUserStateToCache();

  try {
    const { doc, setDoc, serverTimestamp } = Firebase.modules;
    await setDoc(doc(Firebase.db, "users", uid, "courseScores", courseId), { best, updatedAt: serverTimestamp() }, { merge: true });

    const displayName = state.user?.displayName || state.user?.email?.split("@")[0] || "Anonim";
    const totalPoints = Object.values(state.courseScores).reduce((sum, score) => sum + (score.best || 0), 0);
    await setDoc(doc(Firebase.db, "users", uid), {
      displayName,
      email: state.user?.email || "",
      totalPoints,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn("Score save error:", e);
  }
}

// ── Leaderboard ──
async function loadLeaderboard() {
  if (!Firebase.ready) return;
  if (els.leaderboardList) els.leaderboardList.innerHTML = "<p style='color:#7f8fa4;text-align:center;padding:32px;'>Yükleniyor...</p>";

  try {
    const { collection, getDocs, query, orderBy, limit } = Firebase.modules;
    const q = query(collection(Firebase.db, "users"), orderBy("totalPoints", "desc"), limit(50));
    const snap = await getDocs(q);
    const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));

    // Find my rank
    const myUid = state.user?.uid;
    const myIdx = users.findIndex(u => u.uid === myUid);
    const myPoints = myIdx >= 0 ? (users[myIdx].totalPoints || 0) : 0;

    if (els.leaderboardMyRank) {
      els.leaderboardMyRank.textContent = myIdx >= 0 ? `#${myIdx + 1}` : "-";
    }

    if (els.leaderboardMyScore) {
      els.leaderboardMyScore.innerHTML = `
        <div class="lb-my-card">
          <span class="lb-my-label">Toplam Puanın</span>
          <span class="lb-my-points">${myPoints}</span>
          <span class="lb-my-rank">${myIdx >= 0 ? `${myIdx + 1}. sırada` : "Henüz puan yok"}</span>
        </div>
      `;
    }

    if (!users.length) {
      els.leaderboardList.innerHTML = "<p style='color:#7f8fa4;text-align:center;padding:32px;'>Henüz skor yok.</p>";
      return;
    }

    const medalMap = { 0: "🥇", 1: "🥈", 2: "🥉" };

    els.leaderboardList.innerHTML = users.map((u, i) => {
      const isMe = u.uid === myUid;
      const medal = medalMap[i] || "";
      const name = u.displayName || u.email?.split("@")[0] || "Anonim";
      const pts = u.totalPoints || 0;
      const rowClass = isMe ? "lb-row lb-row-me" : "lb-row";
      return `
        <div class="${rowClass}">
          <div class="lb-rank">${medal || (i + 1)}</div>
          <div class="lb-info">
            <span class="lb-name">${escapeHtml(name)}</span>
            ${isMe ? "<span class='lb-you'>(Sen)</span>" : ""}
          </div>
          <div class="lb-pts">${pts} <span>puan</span></div>
        </div>
      `;
    }).join("");
  } catch (e) {
    if (els.leaderboardList) els.leaderboardList.innerHTML = "<p style='color:#f87171;text-align:center;padding:32px;'>Yüklenemedi.</p>";
    console.warn("Leaderboard error:", e);
  }
}

function renderResultScreen(questions) {
  const correct = countCorrect(questions);
  const wrong   = questions.length - correct;
  const pct     = questions.length ? Math.round((correct / questions.length) * 100) : 0;

  // Save score (delta-based)
  const course = getActiveCourse();
  if (course) saveScoreIfImproved(course.id, correct);

  els.questionProgressWrap.innerHTML = "";
  els.questionAreaMobile.innerHTML = `
    <div class="result-card">
      <div class="result-percent">%${pct}</div>
      <div class="result-label">${correct}/${questions.length} doğru · ${wrong} yanlış</div>
      <div class="result-bars">
        <div class="result-bar good"><strong>${correct}</strong><span>Doğru</span></div>
        <div class="result-bar bad"><strong>${wrong}</strong><span>Yanlış</span></div>
      </div>
      <div class="result-actions">
        <button class="qc-btn primary" id="resultRestart">Yeniden Çöz</button>
        <button class="qc-btn secondary" id="resultReview">Soruları İncele</button>
      </div>
    </div>
    <div class="result-promo">
      <img src="./assets/logo.png" alt="Misyon Akademi" class="result-promo-logo" onerror="this.style.display='none'" />
      <div class="result-promo-body">
        <p class="result-promo-title">Misyon Akademi Uygulaması 📱</p>
        <p class="result-promo-sub">Komiserlik ve Misyon Koruma sınavları için tam kapsamlı hazırlık!</p>
        <div class="result-promo-links">
          <a href="https://t.me/misyon_akademi" target="_blank" class="badge-tg">Telegram</a>
          <a href="https://apps.apple.com/tr/app/komiserlik-misyon-koruma/id6760534055?l=tr" target="_blank" class="badge-ios">iOS</a>
          <a href="https://play.google.com/store/apps/details?id=com.misyonakademi.paem" target="_blank" class="badge-android">Android</a>
        </div>
      </div>
    </div>
  `;
  els.questionControlsMobile.innerHTML = "";

  document.getElementById("resultRestart").addEventListener("click", () => {
    if (confirm("Tüm cevaplarınız silinecek. Emin misiniz?")) {
      const course = getActiveCourse();
      course?.questions?.forEach(q => delete state.answers[q.id]);
      state.showResultScreen = false;
      state.activeQuestionIndex = 0;
      persistUserStateToCache();
      renderQuestions();
    }
  });

  document.getElementById("resultReview").addEventListener("click", () => {
    state.showResultScreen = false;
    state.activeQuestionIndex = 0;
    persistUserStateToCache();
    renderQuestions();
  });
}

async function saveAnswer(question, selectedOptionId) {
  const isCorrect = selectedOptionId === question.correctOptionId;
  state.answers[question.id] = { questionId: question.id, selectedOptionId, isCorrect, answeredAt: new Date().toISOString() };
  persistUserStateToCache();

  renderQuestions();
}

// ── Firestore ──
async function loadFirestoreData() {
  if (!Firebase.ready) return;

  const cached = loadSessionsCache();
  if (cached && Date.now() - cached.ts <= CACHE_TTL.sessions) {
    state.sessions = cached.sessions;
    return;
  }

  try {
    const staticBank = await loadStaticQuestionBank();
    if (staticBank?.sessions?.length) {
      state.sessions = staticBank.sessions;
      saveSessionsCache(staticBank.sessions, staticBank.version);
      return;
    }
  } catch (e) {
    console.warn("Statik soru bankası yüklenemedi, Firestore deneniyor:", e);
  }

  // Check version
  let remoteVersion = null;
  try {
    const { doc, getDoc } = Firebase.modules;
    const snap = await getDoc(doc(Firebase.db, "metadata", "content"));
    if (snap.exists()) remoteVersion = snap.data()?.questionBankVersion || null;
  } catch {}

  if (cached && cached.version === remoteVersion && remoteVersion) {
    state.sessions = cached.sessions;
    saveSessionsCache(cached.sessions, remoteVersion);
    return;
  }

  const { collection, getDocs, query, orderBy } = Firebase.modules;
  const sessionsSnap = await getDocs(query(collection(Firebase.db, "sessions"), orderBy("order")));
  const sessions = [];
  for (const sessionDoc of sessionsSnap.docs) {
    const sessionData = { id: sessionDoc.id, ...sessionDoc.data(), courses: [] };
    const coursesSnap = await getDocs(query(collection(Firebase.db, "sessions", sessionDoc.id, "courses"), orderBy("order")));
    for (const courseDoc of coursesSnap.docs) {
      const courseData = { id: courseDoc.id, ...courseDoc.data(), questions: [] };
      const questionsSnap = await getDocs(query(collection(Firebase.db, "sessions", sessionDoc.id, "courses", courseDoc.id, "questions"), orderBy("order")));
      courseData.questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      sessionData.courses.push(courseData);
    }
    sessions.push(sessionData);
  }
  state.sessions = sessions;
  saveSessionsCache(sessions, remoteVersion);
}

async function loadStaticQuestionBank() {
  const res = await fetch("./data/firestore-seed.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Soru bankası yüklenemedi: ${res.status}`);
  const data = await res.json();
  return {
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    version: data.metadata?.questionBankVersion || "static",
  };
}

function loadSessionsCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.sessions);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch { return null; }
}

function saveSessionsCache(sessions, version) {
  try { localStorage.setItem(CACHE_KEYS.sessions, JSON.stringify({ sessions, version, ts: Date.now() })); } catch {}
}

// ── User state cache ──
function getUserStateCacheKey() {
  const uid = state.user?.uid || "anon";
  return CACHE_KEYS.userStatePrefix + uid;
}

function restoreUserStateFromCache() {
  try {
    const raw = localStorage.getItem(getUserStateCacheKey());
    if (!raw) return;
    const d = JSON.parse(raw);
    state.answers             = d.answers || {};
    state.courseScores        = d.courseScores || {};
    state.activeSessionId     = d.activeSessionId || "";
    state.activeCourseId      = d.activeCourseId  || "";
    state.activeQuestionIndex = d.activeQuestionIndex || 0;
    state.showResultScreen    = d.showResultScreen || false;
  } catch {}
}

function persistUserStateToCache(overrides = {}) {
  try {
    const payload = {
      answers: state.answers,
      courseScores: state.courseScores,
      activeSessionId: state.activeSessionId,
      activeCourseId:  state.activeCourseId,
      activeQuestionIndex: state.activeQuestionIndex,
      showResultScreen: state.showResultScreen,
      ...overrides,
    };
    localStorage.setItem(getUserStateCacheKey(), JSON.stringify(payload));
  } catch {}
}

// ── Remembered user ──
function persistRememberedUser(user) {
  try { localStorage.setItem(CACHE_KEYS.rememberedUser, JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName || "" })); } catch {}
}
function loadRememberedUser() {
  try { const r = localStorage.getItem(CACHE_KEYS.rememberedUser); return r ? JSON.parse(r) : null; } catch { return null; }
}
function clearRememberedUser() {
  try { localStorage.removeItem(CACHE_KEYS.rememberedUser); } catch {}
}

function getProfileSyncKey(uid) {
  return CACHE_KEYS.profileSyncPrefix + uid;
}

function isProfileSyncFresh(uid) {
  try {
    const ts = Number(localStorage.getItem(getProfileSyncKey(uid)) || 0);
    return Date.now() - ts < CACHE_TTL.profileSync;
  } catch {
    return false;
  }
}

function markProfileSynced(uid) {
  try { localStorage.setItem(getProfileSyncKey(uid), String(Date.now())); } catch {}
}

// ── UI Helpers ──
function setAuthMsg(msg) {
  if (els.authMessage) els.authMessage.textContent = msg;
}

function setLoading(on, target = "login") {
  if (target === "login" && els.loginButton)  els.loginButton.disabled  = on;
  if (target === "signup" && els.submitSignupButton) els.submitSignupButton.disabled = on;
  if (target === "google" && els.googleLoginButton)  els.googleLoginButton.disabled  = on;
}

function escapeHtml(str = "") {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function firebaseErrorMessage(error) {
  const map = {
    "auth/invalid-credential":      "E-posta veya şifre hatalı.",
    "auth/user-not-found":          "Bu e-posta ile kayıtlı kullanıcı bulunamadı.",
    "auth/wrong-password":          "Şifre hatalı.",
    "auth/email-already-in-use":    "Bu e-posta zaten kayıtlı.",
    "auth/weak-password":           "Şifre en az 6 karakter olmalı.",
    "auth/invalid-email":           "Geçersiz e-posta adresi.",
    "auth/too-many-requests":       "Çok fazla deneme. Lütfen bekleyin.",
    "auth/popup-closed-by-user":    "Giriş penceresi kapatıldı.",
    "auth/unauthorized-domain":     "Bu alan adı Firebase'de yetkilendirilmemiş.",
  };
  return map[error?.code] || error?.message || "Bilinmeyen hata.";
}

// Profile rendering
function renderProfile() {
  const name = state.user?.displayName || state.user?.email?.split("@")[0] || "Öğrenci";
  if (els.profileName)      els.profileName.textContent      = name;
  if (els.profileEmail)     els.profileEmail.textContent     = state.user?.email || "-";
  if (els.profileCreatedAt) {
    const ct = state.user?.metadata?.creationTime;
    els.profileCreatedAt.textContent = ct ? new Date(ct).toLocaleDateString("tr-TR", { day:"numeric", month:"long", year:"numeric" }) : "-";
  }
  if (els.profileAvatarBig) els.profileAvatarBig.textContent = name[0]?.toUpperCase() || "P";
}
