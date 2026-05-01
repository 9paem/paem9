import { firebaseConfig } from "./firebase-config.js";

const Firebase = {
  app: null,
  auth: null,
  db: null,
  ready: false,
  modules: null,
  authUsesFallbackPersistence: false,
};

const state = {
  user: null,
  demoMode: false,
  rememberedMode: false,
  sessions: [],
  activeSessionId: "",
  activeCourseId: "",
  activeTopic: "Tümü",
  activeQuestionIndex: 0,
  showResultScreen: false,
  answers: {},
};

const CACHE_KEYS = {
  sessions: "paem9:sessions:v2",
  userStatePrefix: "paem9:user-state:v1:",
  rememberedUser: "paem9:remembered-user:v1",
};

const SESSIONS_CACHE_MAX_AGE_MS = 15 * 60 * 1000;

const els = {
  authView: document.querySelector('[data-view="auth"]'),
  mainView: document.querySelector('[data-view="main"]'),
  loginBox: document.querySelector("#loginForm"),
  signupBox: document.querySelector("#signupBox"),
  loginForm: document.querySelector("#loginForm"),
  loginButton: document.querySelector("#loginButton"),
  showSignupButton: document.querySelector("#showSignupButton"),
  signupForm: document.querySelector("#signupForm"),
  signupName: document.querySelector("#signupName"),
  signupEmail: document.querySelector("#signupEmail"),
  signupPassword: document.querySelector("#signupPassword"),
  submitSignupButton: document.querySelector("#submitSignupButton"),
  showLoginButton: document.querySelector("#showLoginButton"),
  signupAuthMessage: document.querySelector("#signupAuthMessage"),
  googleLoginButton: document.querySelector("#googleLoginButton"),
  authMessage: document.querySelector("#authMessage"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  userEmail: document.querySelector("#userEmail"),
  logoutButton: document.querySelector("#logoutButton"),
  topbar: document.querySelector(".topbar"),
  appNavigator: document.querySelector("#appNavigator"),
  sessionTabs: document.querySelector("#sessionTabs"),
  sidebar: document.querySelector(".sidebar"),
  courseList: document.querySelector("#courseList"),
  mainColumn: document.querySelector(".main-column"),
  contentPanel: document.querySelector(".content-panel"),
  profilePanel: document.querySelector("#profilePanel"),
  profileEmail: document.querySelector("#profileEmail"),
  profileCreatedAt: document.querySelector("#profileCreatedAt"),
  selectedSession: document.querySelector("#selectedSession"),
  selectedCourse: document.querySelector("#selectedCourse"),
  examInfo: document.querySelector("#examInfo"),
  questionCount: document.querySelector("#questionCount"),
  scoreCount: document.querySelector("#scoreCount"),
  topicBar: document.querySelector("#topicBar"),
  questionArea: document.querySelector("#questionArea"),
};

const letters = ["A", "B", "C", "D", "E"];

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
  els.appNavigator.addEventListener("click", handleNavigation);
}

async function initFirebase() {
  try {
    const [
      appModule,
      authModule,
      firestoreModule,
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    ]);

    Firebase.modules = { ...appModule, ...authModule, ...firestoreModule };
    Firebase.app = Firebase.modules.initializeApp(firebaseConfig);
    Firebase.auth = createAuth();

    if (Firebase.authUsesFallbackPersistence) {
      await configureAuthPersistence();
    }

    Firebase.db = Firebase.modules.getFirestore(Firebase.app);
    Firebase.ready = true;

    Firebase.modules.getRedirectResult(Firebase.auth).catch((error) => {
      setAuthMessage(firebaseErrorMessage(error));
    });

    if (typeof Firebase.auth.authStateReady === "function") {
      await Firebase.auth.authStateReady();
    }

    if (Firebase.auth.currentUser) {
      await openMainForUser(Firebase.auth.currentUser);
    } else if (loadRememberedUser()) {
      await openMainFromRememberedUser(loadRememberedUser());
    } else {
      showAuth();
    }

    Firebase.modules.onAuthStateChanged(Firebase.auth, async (user) => {
      if (user?.uid && user.uid === state.user?.uid) {
        return;
      }

      if (!user) {
        if (state.rememberedMode || loadRememberedUser()) {
          return;
        }
        showAuth();
        return;
      }

      await openMainForUser(user);
    });
  } catch (error) {
    setAuthMessage(`Firebase başlatılamadı: ${error.message}`);
  }
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
    } catch (error) {
      console.warn("initializeAuth fallback to getAuth.", error);
    }
  }

  Firebase.authUsesFallbackPersistence = true;
  return Firebase.modules.getAuth(Firebase.app);
}

async function configureAuthPersistence() {
  const persistenceOptions = [
    Firebase.modules.browserLocalPersistence,
    Firebase.modules.browserSessionPersistence,
    Firebase.modules.inMemoryPersistence,
  ].filter(Boolean);

  let lastError = null;

  for (const persistence of persistenceOptions) {
    try {
      await Firebase.modules.setPersistence(Firebase.auth, persistence);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.warn("Auth persistence could not be configured.", lastError);
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
  } catch (error) {
    state.sessions = [];
    state.answers = {};
    setAuthMessage(`Firestore okunamadı: ${error.message}`);
  }

  showMain();
}

async function openMainFromRememberedUser(user) {
  state.user = user;
  state.demoMode = false;
  state.rememberedMode = true;

  try {
    await loadFirestoreData();
    restoreUserStateFromCache();
  } catch (error) {
    state.sessions = [];
    state.answers = {};
    setAuthMessage(`Yerel veriler okunamadı: ${error.message}`);
  }

  showMain();
}

async function handleLogin(event) {
  event.preventDefault();

  setLoading(true);
  try {
    await Firebase.modules.signInWithEmailAndPassword(
      Firebase.auth,
      els.email.value.trim(),
      els.password.value,
    );
  } catch (error) {
    setAuthMessage(firebaseErrorMessage(error));
  } finally {
    setLoading(false);
  }
}

function showSignupScreen() {
  els.loginBox.classList.add("hidden");
  els.signupBox.classList.remove("hidden");
}

function showLoginScreen() {
  els.signupBox.classList.add("hidden");
  els.loginBox.classList.remove("hidden");
}

async function handleSignupForm(event) {
  event.preventDefault();

  const name = els.signupName.value.trim();
  const email = els.signupEmail.value.trim();
  const password = els.signupPassword.value;

  if (!email || !password || !name) {
    els.signupAuthMessage.textContent = "Lütfen tüm bilgileri girin.";
    return;
  }

  setLoading(true, "signup");
  try {
    const result = await Firebase.modules.createUserWithEmailAndPassword(
      Firebase.auth,
      email,
      password,
    );

    // Update Profile
    await Firebase.modules.updateProfile(result.user, {
      displayName: name
    });

    // Save to Firestore users collection
    const { doc, setDoc, serverTimestamp } = Firebase.modules;
    await setDoc(doc(Firebase.db, "users", result.user.uid), {
      uid: result.user.uid,
      email: email,
      displayName: name,
      createdAt: serverTimestamp()
    });

    await openMainForUser(result.user);
  } catch (error) {
    els.signupAuthMessage.textContent = firebaseErrorMessage(error);
  } finally {
    setLoading(false, "signup");
  }
}

async function handleGoogleLogin() {
  setLoading(true, "google");
  try {
    const provider = new Firebase.modules.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await Firebase.modules.signInWithPopup(Firebase.auth, provider);
    await openMainForUser(result.user);
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      const provider = new Firebase.modules.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await Firebase.modules.signInWithRedirect(Firebase.auth, provider);
      return;
    }
    setAuthMessage(firebaseErrorMessage(error));
  } finally {
    setLoading(false, "google");
  }
}

async function handleLogout() {
  clearRememberedUser();
  if (state.demoMode || !Firebase.ready) {
    showAuth();
    return;
  }

  await Firebase.modules.signOut(Firebase.auth);
}

async function loadFirestoreData() {
  const remoteVersion = await loadQuestionBankVersion();
  const cachedSessions = loadSessionsFromCache();
  if (
    cachedSessions?.sessions?.length &&
    remoteVersion &&
    cachedSessions.version === remoteVersion
  ) {
    state.sessions = cachedSessions.sessions;
    state.answers = {};
    ensureActiveSelection();
    return;
  }

  if (cachedSessions?.sessions?.length && !remoteVersion) {
    state.sessions = cachedSessions.sessions;
    state.answers = {};
    ensureActiveSelection();
    return;
  }

  const { collection, doc, getDoc, getDocs, orderBy, query } = Firebase.modules;
  const contentMetadataRef = doc(Firebase.db, "metadata", "content");
  const contentMetadataSnap = await getDoc(contentMetadataRef);
  const resolvedVersion =
    contentMetadataSnap.exists() && contentMetadataSnap.data()?.questionBankVersion
      ? contentMetadataSnap.data().questionBankVersion
      : remoteVersion;

  const sessionsSnap = await getDocs(query(collection(Firebase.db, "sessions"), orderBy("order")));
  const sessions = [];

  for (const sessionDoc of sessionsSnap.docs) {
    const coursesSnap = await getDocs(
      query(
        collection(Firebase.db, "sessions", sessionDoc.id, "courses"),
        orderBy("order"),
      ),
    );

    const courses = [];
    for (const courseDoc of coursesSnap.docs) {
      const questionsSnap = await getDocs(
        query(
          collection(
            Firebase.db,
            "sessions",
            sessionDoc.id,
            "courses",
            courseDoc.id,
            "questions",
          ),
          orderBy("order"),
        ),
      );

      courses.push({
        id: courseDoc.id,
        ...courseDoc.data(),
        questions: questionsSnap.docs.map((questionDoc) => ({
          id: questionDoc.id,
          ...questionDoc.data(),
        })),
      });
    }

    sessions.push({
      id: sessionDoc.id,
      ...sessionDoc.data(),
      courses,
    });
  }

  state.sessions = sessions;
  state.answers = {};
  persistSessionsToCache(sessions, resolvedVersion || "unversioned");
  ensureActiveSelection();
}

async function loadQuestionBankVersion() {
  if (!Firebase.ready) return "";

  try {
    const { doc, getDoc } = Firebase.modules;
    const versionSnap = await getDoc(doc(Firebase.db, "metadata", "content"));
    return versionSnap.exists() ? versionSnap.data()?.questionBankVersion || "" : "";
  } catch (error) {
    console.warn("Question bank version could not be read.", error);
    return "";
  }
}

function loadSessionsFromCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEYS.sessions);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.sessions)) {
      return null;
    }

    const isFresh =
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt < SESSIONS_CACHE_MAX_AGE_MS;

    return isFresh ? parsed : null;
  } catch (error) {
    console.warn("Session cache could not be read.", error);
    return null;
  }
}

function persistSessionsToCache(sessions, version) {
  try {
    window.localStorage.setItem(
      CACHE_KEYS.sessions,
      JSON.stringify({
        savedAt: Date.now(),
        version,
        sessions,
      }),
    );
  } catch (error) {
    console.warn("Session cache could not be saved.", error);
  }
}

function getUserStateCacheKey() {
  return state.user?.uid ? `${CACHE_KEYS.userStatePrefix}${state.user.uid}` : "";
}

function restoreUserStateFromCache() {
  const cacheKey = getUserStateCacheKey();
  if (!cacheKey) return;

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return;

    const cachedState = JSON.parse(raw);
    state.activeSessionId = cachedState.activeSessionId || state.activeSessionId;
    state.activeCourseId = cachedState.activeCourseId || state.activeCourseId;
    state.activeTopic = cachedState.activeTopic || "Tümü";
    state.activeQuestionIndex = Number.isInteger(cachedState.activeQuestionIndex)
      ? cachedState.activeQuestionIndex
      : 0;

    if (cachedState.completedAt) {
      state.answers = {};
      state.showResultScreen = false;
      state.activeQuestionIndex = 0;
      clearUserAttemptCache();
      return;
    }

    state.answers = cachedState.answers || {};
    state.showResultScreen = Boolean(cachedState.showResultScreen);
  } catch (error) {
    console.warn("User cache could not be restored.", error);
  }
}

function persistUserStateToCache(overrides = {}) {
  const cacheKey = getUserStateCacheKey();
  if (!cacheKey) return;

  const payload = {
    activeSessionId: state.activeSessionId,
    activeCourseId: state.activeCourseId,
    activeTopic: state.activeTopic,
    activeQuestionIndex: state.activeQuestionIndex,
    showResultScreen: state.showResultScreen,
    answers: state.answers,
    completedAt: null,
    ...overrides,
  };

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("User cache could not be saved.", error);
  }
}

function clearUserAttemptCache() {
  const cacheKey = getUserStateCacheKey();
  if (!cacheKey) return;

  try {
    window.localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn("User cache could not be cleared.", error);
  }
}

function persistRememberedUser(user) {
  try {
    window.localStorage.setItem(
      CACHE_KEYS.rememberedUser,
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
      }),
    );
  } catch (error) {
    console.warn("Remembered user could not be saved.", error);
  }
}

function loadRememberedUser() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEYS.rememberedUser);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Remembered user could not be read.", error);
    return null;
  }
}

function clearRememberedUser() {
  try {
    window.localStorage.removeItem(CACHE_KEYS.rememberedUser);
  } catch (error) {
    console.warn("Remembered user could not be cleared.", error);
  }
}

function ensureActiveSelection() {
  state.activeSessionId ||= state.sessions[0]?.id || "";
  const session = getActiveSession();
  state.activeCourseId ||= session?.courses?.[0]?.id || "";
}

function showAuth() {
  state.user = null;
  state.demoMode = false;
  state.rememberedMode = false;
  state.answers = {};
  els.authView.classList.remove("hidden");
  els.mainView.classList.add("hidden");
}

function showMain() {
  els.userEmail.textContent = state.user?.email || "";
  els.authView.classList.add("hidden");
  els.mainView.classList.remove("hidden");
  render();
  setNavigationActive("courses");
}

function render() {
  renderSessions();
  renderCourses();
  renderTopics();
  renderQuestions();
  renderProfile();
}

function handleNavigation(event) {
  const button = event.target.closest("[data-nav-target]");
  if (!button) return;

  const target = button.dataset.navTarget;
  const targets = {
    courses: els.sidebar,
    questions: els.contentPanel,
    profile: els.profilePanel,
  };

  targets[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
  setNavigationActive(target);
}

function setNavigationActive(target) {
  els.appNavigator.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.navTarget === target);
  });
}

function renderSessions() {
  els.sessionTabs.innerHTML = "";
  state.sessions.forEach((session) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-button ${session.id === state.activeSessionId ? "active" : ""}`;
    button.textContent = session.title;
    button.addEventListener("click", () => {
      state.activeSessionId = session.id;
      state.activeCourseId = session.courses?.[0]?.id || "";
      state.activeTopic = "Tümü";
      state.activeQuestionIndex = 0;
      state.showResultScreen = false;
      persistUserStateToCache();
      render();
      setNavigationActive("courses");
    });
    els.sessionTabs.append(button);
  });
}

function renderCourses() {
  const session = getActiveSession();
  els.courseList.innerHTML = "";
  els.selectedSession.textContent = session?.title || "";
  els.examInfo.textContent = session ? formatExamInfo(session) : "";

  session?.courses?.forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `course-button ${course.id === state.activeCourseId ? "active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(course.title)}</strong>
      <span>${course.questionShare || "Sınav soru sayısı eklenecek"} · Çalışma ${course.questions?.length || 0} soru</span>
    `;
    button.addEventListener("click", () => {
      state.activeCourseId = course.id;
      state.activeTopic = "Tümü";
      state.activeQuestionIndex = 0;
      state.showResultScreen = false;
      persistUserStateToCache();
      render();
      setNavigationActive("questions");
    });
    els.courseList.append(button);
  });
}

function renderTopics() {
  // User requested to remove topic tags/filters from lessons UI.
  state.activeTopic = "Tümü";
  els.topicBar.innerHTML = "";
  els.topicBar.classList.add("hidden");
}

function renderQuestions() {
  const course = getActiveCourse();
  els.selectedCourse.textContent = course?.title || "Ders seç";

  const questions = course?.questions || [];
  if (state.activeQuestionIndex >= questions.length) {
    state.activeQuestionIndex = Math.max(questions.length - 1, 0);
  }
  const currentQuestion = questions[state.activeQuestionIndex];

  els.questionCount.textContent = course?.expectedQuestionCount
    ? `Sınavda ${course.expectedQuestionCount} soru`
    : `${questions.length} soru`;
  els.scoreCount.textContent = `${countCorrect(questions)} doğru`;
  els.questionArea.innerHTML = "";

  if (!questions.length) {
    els.questionArea.innerHTML = `
      <div class="empty-state">
        <p>Bu ders için soru henüz eklenmedi. Örnek soruları gönderdiğinde aynı formata dönüştürüp ekleyeceğim.</p>
      </div>
    `;
    return;
  }

  if (state.showResultScreen) {
    els.questionArea.append(renderResultScreen(questions));
    return;
  }

  els.questionArea.append(renderQuestionProgress(questions));
  els.questionArea.append(renderQuestionCard(currentQuestion, state.activeQuestionIndex));
  els.questionArea.append(renderQuestionControls(questions));
}

function renderResultScreen(questions) {
  const result = document.createElement("section");
  const correctCount = countCorrect(questions);
  const wrongCount = questions.length - correctCount;
  const percent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  result.className = "result-screen";
  result.innerHTML = `
    <div class="result-score">
      <span>%${percent}</span>
      <strong>${correctCount}/${questions.length} doğru</strong>
      <small>${wrongCount} yanlış</small>
    </div>
    <div class="result-summary">
      <p class="eyebrow">Test tamamlandı</p>
      <h3>${escapeHtml(getActiveCourse()?.title || "Test sonucu")}</h3>
      <div class="result-actions">
        <button class="primary-button" type="button" data-result-action="restart">Testi Yeniden Çöz</button>
        <button class="secondary-button" type="button" data-result-action="review">Soruları İncele</button>
      </div>
    </div>
  `;

  result.addEventListener("click", (event) => {
    const button = event.target.closest("[data-result-action]");
    if (!button) return;

    if (button.dataset.resultAction === "restart") {
      if (confirm("Bu testteki tüm cevaplarınız silinecek ve sıfırdan başlayacaksınız. Emin misiniz?")) {
        const course = getActiveCourse();
        course?.questions?.forEach(q => {
          delete state.answers[q.id];
        });
        state.showResultScreen = false;
        state.activeQuestionIndex = 0;
        persistUserStateToCache();
        render();
      }
    } else if (button.dataset.resultAction === "review") {
      state.showResultScreen = false;
      state.activeQuestionIndex = 0;
      persistUserStateToCache();
      renderQuestions();
    }
  });

  return result;
}

function renderQuestionProgress(questions) {
  const progress = document.createElement("div");
  progress.className = "question-progress";
  progress.innerHTML = `
    <span>${state.activeQuestionIndex + 1}/${questions.length}</span>
    <div aria-hidden="true">
      <i style="width: ${((state.activeQuestionIndex + 1) / questions.length) * 100}%"></i>
    </div>
  `;
  return progress;
}

function renderQuestionControls(questions) {
  const controls = document.createElement("div");
  controls.className = "question-controls";
  controls.innerHTML = `
    <button class="text-button" type="button" data-question-action="reset" style="margin-right: auto; color: var(--color-gray-500); padding-left: 0;">Sıfırla</button>
    <button class="secondary-button" type="button" data-question-action="prev" ${
      state.activeQuestionIndex === 0 ? "disabled" : ""
    }>Önceki</button>
    <button class="primary-button" type="button" data-question-action="${
      state.activeQuestionIndex >= questions.length - 1 ? "finish" : "next"
    }">${state.activeQuestionIndex >= questions.length - 1 ? "Testi Bitir" : "Sonraki"}</button>
  `;

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-question-action]");
    if (!button) return;

    if (button.dataset.questionAction === "reset") {
      if (confirm("Bu testteki tüm cevaplarınız silinecek ve sıfırdan başlayacaksınız. Emin misiniz?")) {
        const course = getActiveCourse();
        course?.questions?.forEach(q => {
          delete state.answers[q.id];
        });
        state.activeQuestionIndex = 0;
        state.showResultScreen = false;
        persistUserStateToCache();
        render();
      }
      return;
    }

    if (button.dataset.questionAction === "finish") {
      state.showResultScreen = true;
      persistUserStateToCache({ completedAt: new Date().toISOString() });
      renderQuestions();
      return;
    }

    const direction = button.dataset.questionAction === "next" ? 1 : -1;
    state.activeQuestionIndex = Math.min(
      Math.max(state.activeQuestionIndex + direction, 0),
      questions.length - 1,
    );
    persistUserStateToCache();
    renderQuestions();
    els.contentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return controls;
}

function renderProfile() {
  const user = state.user;
  els.profileEmail.textContent = user?.email || "Bilinmiyor";
  els.profileCreatedAt.textContent = formatProfileDate(
    user?.metadata?.creationTime,
    state.demoMode,
  );
}

function renderQuestionCard(question, index) {
  const card = document.createElement("article");
  card.className = "question-card";

  const answer = state.answers[question.id];
  const selected = answer?.selectedOptionId;

  card.innerHTML = `
    <div class="question-meta">
      <span class="badge">Soru ${index + 1}</span>
    </div>
    <p class="question-text">${escapeHtml(question.text)}</p>
    <div class="options"></div>
    <p class="answer-note">${answer ? resultText(question, selected) : ""}</p>
  `;

  const optionsEl = card.querySelector(".options");
  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    const isSelected = selected === option.id;
    const isCorrect = option.id === question.correctOptionId;
    const showResult = Boolean(answer);

    button.type = "button";
    button.className = [
      "option-button",
      showResult && isCorrect ? "correct" : "",
      showResult && isSelected && !isCorrect ? "incorrect" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.innerHTML = `
      <span class="option-letter">${letters[optionIndex] || "?"}</span>
      <span>${escapeHtml(option.text)}</span>
    `;
    button.addEventListener("click", () => saveAnswer(question, option.id));
    optionsEl.append(button);
  });

  return card;
}

async function saveAnswer(question, selectedOptionId) {
  const isCorrect = selectedOptionId === question.correctOptionId;
  state.answers[question.id] = {
    questionId: question.id,
    selectedOptionId,
    isCorrect,
    answeredAt: new Date().toISOString(),
  };
  persistUserStateToCache();

  if (
    Firebase.ready &&
    !state.demoMode &&
    !state.rememberedMode &&
    Firebase.auth?.currentUser?.uid === state.user?.uid
  ) {
    const { doc, setDoc, serverTimestamp } = Firebase.modules;
    await setDoc(doc(Firebase.db, "users", state.user.uid, "answers", question.id), {
      questionId: question.id,
      selectedOptionId,
      isCorrect,
      answeredAt: serverTimestamp(),
    });
  }

  renderQuestions();

  const questions = getActiveCourse()?.questions || [];
  if (state.activeQuestionIndex < questions.length - 1) {
    window.setTimeout(() => {
      state.activeQuestionIndex += 1;
      persistUserStateToCache();
      renderQuestions();
      els.contentPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 650);
  } else {
    window.setTimeout(() => {
      state.showResultScreen = true;
      persistUserStateToCache({ completedAt: new Date().toISOString() });
      renderQuestions();
    }, 650);
  }
}

function getActiveSession() {
  return state.sessions.find((session) => session.id === state.activeSessionId);
}

function getActiveCourse() {
  return getActiveSession()?.courses?.find((course) => course.id === state.activeCourseId);
}

function countCorrect(questions) {
  return questions.filter((question) => state.answers[question.id]?.isCorrect).length;
}

function formatExamInfo(session) {
  const date = session.examDate
    ? new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        weekday: "long",
      }).format(new Date(`${session.examDate}T00:00:00`))
    : "Tarih eklenecek";

  return `${date} · ${session.startsAt} · ${session.totalQuestions} soru · ${session.durationMinutes} dakika · Her soru ${session.pointPerQuestion} puan`;
}

function formatProfileDate(value, isDemoMode) {
  if (isDemoMode) return "Demo oturum";
  if (!value) return "Bilinmiyor";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resultText(question, selectedOptionId) {
  if (selectedOptionId === question.correctOptionId) {
    return "Doğru.";
  }

  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  return `Yanlış. Doğru cevap: ${correctOption?.text || "Belirtilmedi"}.`;
}

function setLoading(isLoading, source = "email") {
  els.loginButton.disabled = isLoading;
  els.submitSignupButton.disabled = isLoading;
  els.showSignupButton.disabled = isLoading;
  els.googleLoginButton.disabled = isLoading;

  if (source === "google") {
    els.googleLoginButton.innerHTML = isLoading
      ? "Google açılıyor..."
      : '<span class="google-mark" aria-hidden="true">G</span> Google ile Giriş Yap';
    return;
  }

  els.loginButton.textContent = isLoading ? "Giriş yapılıyor..." : "Giriş Yap";
}

function setAuthMessage(message) {
  els.authMessage.textContent = message;
}

function firebaseErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/user-not-found": "Bu e-posta ile kullanıcı bulunamadı.",
    "auth/wrong-password": "Şifre hatalı.",
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.",
    "auth/popup-closed-by-user": "Google giriş penceresi kapatıldı.",
    "auth/popup-blocked": "Tarayıcı Google giriş penceresini engelledi.",
    "auth/unauthorized-domain": "Bu alan adı Firebase Authentication için yetkilendirilmemiş.",
  };

  return messages[error.code] || `Giriş yapılamadı: ${error.message}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
