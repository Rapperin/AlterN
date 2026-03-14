import { fetchJson } from "../shared/api.js";
import { bindAuthControls, clearAuthPassword, readAuthCredentials } from "../shared/auth-form.js";
import { applyAuthFeedback, applyAuthPanelState } from "../shared/auth-ui.js";
import {
    normalizeProblemDifficulty,
    normalizeProblemScope,
    normalizeProgrammingLanguage,
    readPositiveNumber
} from "../shared/arena-links.js";
import { replaceCurrentUrl, setUrlSearchParam } from "../shared/page-links.js";
import { authHeaders as buildAuthHeaders, clearAuthToken, setAuthToken } from "../shared/session.js";
import { renderEmptyState } from "../shared/ui.js";
import { applyFeedbackSurface, buildGenericFeedbackSpec } from "./arena-feedback.js";

export async function bootstrap(context) {
    bindEvents(context);
    context.state.editorLanguageContext = context.refs.language.value;
    context.renderContinuumGate();
    context.renderProblemStats();
    await hydrateAuth(context);
    context.updateEditorNote();
    context.applyStarterTemplate();
    const initialContext = readInitialArenaContext();
    if (initialContext.scope) {
        context.state.problemScope = initialContext.scope;
    }
    context.state.problemDifficultyFilter = initialContext.difficulty || "ALL";
    context.state.problemTagFilter = initialContext.tag || "ALL";
    context.refs.problemSearch.value = initialContext.search;
    await Promise.all([
        loadProblems(context, initialContext.problemId),
        loadRunnerHealth(context)
    ]);
    await applyInitialArenaContext(context, initialContext);
}

export async function loadProblems(context, preferredProblemId = context.state.selectedProblemId) {
    const { state, refs } = context;
    try {
        state.problems = await fetchAllProblems(context);
        state.filteredProblems = [...state.problems];
        await refreshProblemArchive(context, { preferredProblemId });
    } catch (error) {
        showFeedback(context, error.message, "error");
        renderProblemEmptyState(context, "Problem listesi yuklenemedi.");
    }

    await loadUserDashboard(context);
}

export async function refreshProblemArchive(context, options = {}) {
    const { state, refs } = context;
    const preferredProblemId = options.preferredProblemId ?? state.selectedProblemId;
    const emptyMessage = options.emptyMessage || "Secili filtre icin problem bulunamadi.";
    const previousSelection = state.selectedProblemId;

    context.renderProblemList();
    context.renderProblemFacets();
    context.renderProgressSummary();

    if (refs.problemCount) {
        refs.problemCount.textContent = state.filteredProblems.length === state.problems.length
            ? `${state.problems.length} problem`
            : `${state.filteredProblems.length}/${state.problems.length} problem`;
    }

    if (state.problems.length === 0) {
        renderProblemEmptyState(context);
        return;
    }

    if (state.filteredProblems.length === 0) {
        renderProblemEmptyState(context, emptyMessage);
        return;
    }

    const preferredVisible = preferredProblemId
        ? state.filteredProblems.some((problem) => problem.id === preferredProblemId)
        : false;
    const nextProblemId = preferredVisible
        ? preferredProblemId
        : state.filteredProblems[0]?.id ?? null;

    if (!nextProblemId) {
        renderProblemEmptyState(context, emptyMessage);
        return;
    }

    if (!state.selectedProblem || state.selectedProblemId !== nextProblemId) {
        await selectProblem(context, nextProblemId);
        return;
    }

    if (previousSelection !== nextProblemId) {
        syncArenaUrl(context, nextProblemId);
    } else {
        syncArenaUrl(context, state.selectedProblemId);
    }
}

export function handleProblemSearchInput(context) {
    void refreshProblemArchive(context);
}

export async function loadRunnerHealth(context, options = {}) {
    const { state } = context;
    const refresh = Boolean(options.refresh);
    state.runnerHealthRefreshing = refresh;
    context.renderRunnerHealth();

    try {
        state.runnerHealth = await fetchJson(refresh ? "/api/health?refresh=true" : "/api/health", {
            headers: authHeaders(context)
        });
    } catch (error) {
        state.runnerHealth = null;
    } finally {
        state.runnerHealthRefreshing = false;
    }

    context.renderRunnerHealth();
    context.refreshLanguageAvailability();
    context.renderPreflightBanner();
}

export function handleRunnerHealthCardClick(context, event) {
    const { state } = context;
    const refreshButton = event.target.closest("[data-runner-health-refresh]");
    if (refreshButton) {
        if (state.runnerHealthRefreshing) {
            return;
        }

        void loadRunnerHealth(context, { refresh: true });
        return;
    }

    const copyButton = event.target.closest("[data-copy-runtime-command]");
    if (!copyButton) {
        return;
    }

    void context.copyRuntimeCommand(copyButton.dataset.copyRuntimeCommand, copyButton.dataset.copyRuntimeLanguage);
}

export function handleEditorRuntimeAssistClick(context, event) {
    const { state } = context;
    const switchButton = event.target.closest("[data-editor-runtime-switch-language]");
    if (switchButton) {
        context.switchEditorLanguage(switchButton.dataset.editorRuntimeSwitchLanguage);
        return;
    }

    const copyButton = event.target.closest("[data-copy-runtime-command]");
    if (copyButton) {
        void context.copyRuntimeCommand(copyButton.dataset.copyRuntimeCommand, copyButton.dataset.copyRuntimeLanguage);
        return;
    }

    const refreshButton = event.target.closest("[data-runner-health-refresh]");
    if (refreshButton && !state.runnerHealthRefreshing) {
        void loadRunnerHealth(context, { refresh: true });
    }
}

export function handleEditorForgeStatusClick(context, event) {
    const { refs } = context;
    const starterButton = event.target.closest("[data-editor-apply-starter]");
    if (starterButton) {
        context.applyStarterTemplate({ confirmOverwrite: true });
        return;
    }

    const primeButton = event.target.closest("[data-editor-prime-first-sample]");
    if (primeButton) {
        if (context.primeReplayFromFirstSample()) {
            refs.replayInput.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            showFeedback(context, "Prime edilecek uygun sample bulunamadi.", "error");
        }
        return;
    }

    const latestSubmissionButton = event.target.closest("[data-editor-load-last-submission-id]");
    if (!latestSubmissionButton) {
        return;
    }

    void context.loadSubmissionIntoEditor(Number(latestSubmissionButton.dataset.editorLoadLastSubmissionId), "Son deneme");
}

export function handleEditorLanguageRecommendationClick(context, event) {
    const recommendationButton = event.target.closest("[data-editor-recommended-language]");
    if (!recommendationButton) {
        return;
    }

    context.switchEditorLanguage(recommendationButton.dataset.editorRecommendedLanguage);
}

export async function loadUserDashboard(context) {
    const { state } = context;
    if (!state.currentUser || !state.authToken) {
        context.clearPendingDashboardRefresh();
        state.userDashboard = null;
        context.renderContinuumGate();
        context.renderProblemList();
        return;
    }

    try {
        state.userDashboard = await fetchJson("/api/dashboard", {
            headers: authHeaders(context)
        });
    } catch (error) {
        state.userDashboard = null;
    }

    context.renderContinuumGate();
    context.renderProblemList();
    context.schedulePendingDashboardRefresh();
}

export async function selectProblem(context, problemId) {
    const { state, refs } = context;
    const previousProblemId = state.selectedProblemId;
    if (previousProblemId && previousProblemId !== problemId) {
        context.flushCurrentDraft();
    }

    const shouldResetReplay = problemId !== state.selectedProblemId;
    state.selectedProblemId = problemId;
    syncArenaUrl(context, problemId);
    context.renderProblemList();
    if (shouldResetReplay) {
        context.pulseScene("shift");
    }

    try {
        const submissionsPromise = state.currentUser
            ? fetchJson(`/api/submissions?page=0&size=10&problemId=${problemId}`, {
                headers: authHeaders(context)
            })
            : fetchJson(`/api/problems/${problemId}/submissions?page=0&size=10`);
        const workspacePromise = state.currentUser
            ? fetchJson(`/api/workspace/problems/${problemId}`, {
                headers: authHeaders(context)
            })
            : Promise.resolve(null);

        const [problem, testCases, submissionsPage, workspaceSummary, problemLeaderboard, problemStats] = await Promise.all([
            fetchJson(`/api/problems/${problemId}`, {
                headers: authHeaders(context)
            }),
            fetchJson(`/api/problems/${problemId}/testcases`),
            submissionsPromise,
            workspacePromise,
            fetchJson(`/api/problems/${problemId}/leaderboard`, {
                headers: authHeaders(context)
            }),
            fetchJson(`/api/problems/${problemId}/stats`, {
                headers: authHeaders(context)
            })
        ]);

        state.selectedProblem = problem;
        state.workspaceSummary = workspaceSummary;
        state.visibleTestCases = testCases;
        state.submissions = submissionsPage.content || [];
        state.problemLeaderboard = problemLeaderboard;
        state.problemStats = problemStats;
        context.applyProblemScene(problem);
        context.renderSelectedProblem();
        context.renderProblemLeaderboard();
        context.renderProblemStats();
        context.renderWorkspaceSummary();
        context.renderSamples();
        context.renderSubmissions();
        context.updateEditorNote();

        if (shouldResetReplay) {
            context.resetReplayPanel();
        }

        if (shouldResetReplay) {
            context.syncEditorForSelectedProblem({ announceDraftRestore: true });
        } else if (!refs.sourceCode.value.trim()) {
            context.syncEditorForSelectedProblem();
        } else {
            context.renderDraftStatus();
        }
    } catch (error) {
        state.problemLeaderboard = null;
        state.problemStats = null;
        context.renderProblemLeaderboard();
        context.renderProblemStats();
        showFeedback(context, error.message, "error");
    }
}

export async function login(context, event) {
    event.preventDefault();

    const credentials = readAuthCredentials(context.refs);
    if (!credentials) {
        showAuthFeedback(context, "Username ve password gerekli.", "error");
        return;
    }

    try {
        const response = await fetchJson("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
        });

        applyAuthResponse(context, response, `${response.username} olarak giris yapildi.`);
        await loadProblems(context, context.state.selectedProblemId);
    } catch (error) {
        showAuthFeedback(context, error.message, "error");
    }
}

export async function register(context) {
    const credentials = readAuthCredentials(context.refs);
    if (!credentials) {
        showAuthFeedback(context, "Register icin username ve password gerekli.", "error");
        return;
    }

    try {
        const response = await fetchJson("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
        });

        applyAuthResponse(context, response, `${response.username} hesabi olusturuldu.`);
        await loadProblems(context, context.state.selectedProblemId);
    } catch (error) {
        showAuthFeedback(context, error.message, "error");
    }
}

export async function logout(context) {
    clearAuthState(context, true);
    await loadProblems(context, context.state.selectedProblemId);
}

export function renderProblemEmptyState(context, message = "Henuz listelenecek problem yok.") {
    const { state, refs, DEFAULT_TIME_LIMIT_MS, DEFAULT_MEMORY_LIMIT_MB } = context;
    context.flushDraftSaveTimer();
    state.selectedProblemId = null;
    state.selectedProblem = null;
    state.problemLeaderboard = null;
    state.problemStats = null;
    state.workspaceSummary = null;
    state.visibleTestCases = [];
    state.submissions = [];
    syncArenaUrl(context, null);
    context.applyProblemScene(null);
    context.applyWorkspaceMode(null);
    refs.problemTitle.textContent = "Problem bekleniyor";
    refs.problemDifficulty.textContent = "-";
    refs.problemDifficulty.className = "difficulty difficulty--muted";
    refs.problemDescription.textContent = message;
    refs.problemConstraints.textContent = "Constraint bilgisi yok.";
    refs.problemInputFormat.textContent = "Input format bilgisi yok.";
    refs.problemOutputFormat.textContent = "Output format bilgisi yok.";
    refs.problemHintHeading.textContent = "Hint";
    refs.problemHintState.textContent = "Ilk gonderimden sonra acilir.";
    refs.problemHint.innerHTML = renderEmptyState("Hint bilgisi yok.");
    refs.problemEditorialHeading.textContent = "Editorial";
    refs.problemEditorialState.textContent = "Accepted gonderimden sonra acilir.";
    refs.problemEditorial.innerHTML = renderEmptyState("Editorial bilgisi yok.");
    refs.problemLeaderboardCard.innerHTML = renderEmptyState("Problem leaderboard verisi yok.");
    context.renderProblemBookmarkButton();
    refs.visibleTestcaseCount.textContent = "0";
    refs.submissionCount.textContent = "0";
    refs.viewerStatus.textContent = "Login";
    refs.problemTimeLimit.textContent = `${DEFAULT_TIME_LIMIT_MS} ms`;
    refs.problemMemoryLimit.textContent = `${DEFAULT_MEMORY_LIMIT_MB} MB`;
    refs.problemTags.innerHTML = renderEmptyState("Tag yok.");
    refs.problemExampleList.innerHTML = renderEmptyState("Gosterilecek ornek yok.");
    refs.sampleList.innerHTML = renderEmptyState(message);
    refs.submissionList.innerHTML = renderEmptyState("Gosterilecek gonderim yok.");
    refs.workspaceSummaryCard.innerHTML = renderEmptyState("Workspace bilgisi yok.");
    refs.workspaceDebugCard.innerHTML = renderEmptyState("Failure diagnostigi yok.");
    refs.submissionPanelEyebrow.textContent = "Echo log";
    refs.submissionPanelTitle.textContent = "Submission Echoes";
    context.resetReplayPanel();
    context.updateEditorNote();
    context.renderEditorForgeStatus();
    context.renderProblemFacets();
    context.renderContinuumGate();
    context.renderProgressSummary();
    context.renderDraftStatus();
}

export function showFeedback(context, message, type = "idle", sceneKind = null) {
    applyFeedbackSurface(context.refs.submissionFeedback, buildGenericFeedbackSpec(message, type, sceneKind), context.pulseScene);
}

export function authHeaders(context, extraHeaders = {}) {
    return buildAuthHeaders(context.state.authToken, extraHeaders);
}

export function syncArenaUrl(context, problemId) {
    const { state } = context;
    replaceCurrentUrl((url) => {
        setUrlSearchParam(url, "problemId", problemId || null);
        setUrlSearchParam(url, "scope", state.problemScope && state.problemScope !== "ALL" ? state.problemScope : null);
        setUrlSearchParam(url, "difficulty", state.problemDifficultyFilter && state.problemDifficultyFilter !== "ALL"
            ? state.problemDifficultyFilter
            : null);
        setUrlSearchParam(url, "tag", state.problemTagFilter && state.problemTagFilter !== "ALL"
            ? state.problemTagFilter
            : null);
        setUrlSearchParam(url, "search", context.refs.problemSearch?.value?.trim() || null);
        setUrlSearchParam(url, "submissionId", null);
        setUrlSearchParam(url, "language", null);
        setUrlSearchParam(url, "primeSample", null);
        setUrlSearchParam(url, "source", null);
    });
}

function readInitialArenaContext() {
    const params = new URLSearchParams(window.location.search);
    return {
        problemId: readPositiveNumber(params.get("problemId")),
        submissionId: readPositiveNumber(params.get("submissionId")),
        suggestedLanguage: normalizeProgrammingLanguage(params.get("language")),
        primeSample: params.get("primeSample") === "true",
        scope: normalizeProblemScope(params.get("scope")),
        difficulty: normalizeProblemDifficulty(params.get("difficulty")),
        tag: params.get("tag")?.trim() || null,
        search: params.get("search")?.trim() || "",
        source: params.get("source") || null
    };
}

async function applyInitialArenaContext(context, initialContext) {
    const { state, refs } = context;
    if (!initialContext || !state.selectedProblemId) {
        return;
    }

    if (initialContext.suggestedLanguage && refs.language.value !== initialContext.suggestedLanguage) {
        refs.language.value = initialContext.suggestedLanguage;
        context.handleLanguageChange();
    }

    const replayPrimed = initialContext.primeSample ? context.primeReplayFromFirstSample() : false;

    if (initialContext.submissionId && state.currentUser && state.authToken) {
        await context.loadSubmissionIntoEditor(
            initialContext.submissionId,
            initialContext.source === "continuum" ? "Continuum" : "Linked submission"
        );
        return;
    }

    const feedbackParts = [];
    if (initialContext.source === "continuum") {
        feedbackParts.push("Continuum rotasi arena'ya tasindi.");
    }
    if (initialContext.suggestedLanguage) {
        feedbackParts.push(`${initialContext.suggestedLanguage} odagi editor'e uygulandi.`);
    }
    if (replayPrimed) {
        feedbackParts.push("Ilk sample replay paneline tasindi.");
    }
    if (feedbackParts.length > 0) {
        showFeedback(context, feedbackParts.join(" "), "success");
    }
}

function bindEvents(context) {
    const { refs } = context;
    refs.problemSearch.addEventListener("input", context.handleProblemSearchInput);
    refs.problemBookmarkButton.addEventListener("click", () => {
        void context.toggleProblemBookmark();
    });
    bindAuthControls(refs, {
        onLogin: (event) => {
            void login(context, event);
        },
        onRegister: () => {
            void register(context);
        },
        onLogout: () => {
            void logout(context);
        }
    });
    refs.language.addEventListener("change", context.handleLanguageChange);
    refs.sourceCode.addEventListener("input", context.scheduleDraftSave);
    refs.templateButton.addEventListener("click", () => context.applyStarterTemplate({ confirmOverwrite: true }));
    refs.submissionForm.addEventListener("submit", (event) => {
        void context.submitSolution(event);
    });
    refs.editorForgeStatus.addEventListener("click", (event) => {
        handleEditorForgeStatusClick(context, event);
    });
    refs.editorLanguageRecommendation.addEventListener("click", (event) => {
        handleEditorLanguageRecommendationClick(context, event);
    });
    refs.editorRuntimeAssist.addEventListener("click", (event) => {
        handleEditorRuntimeAssistClick(context, event);
    });
    refs.replayForm.addEventListener("submit", (event) => {
        void context.runReplay(event);
    });
    refs.replayClearButton.addEventListener("click", context.resetReplayPanel);
    refs.runnerHealthCard.addEventListener("click", (event) => {
        handleRunnerHealthCardClick(context, event);
    });
}

async function hydrateAuth(context) {
    const { state } = context;
    if (!state.authToken) {
        renderAuthState(context);
        return;
    }

    try {
        state.currentUser = await fetchJson("/api/auth/me", {
            headers: authHeaders(context)
        });
        showAuthFeedback(context, `${state.currentUser.username} oturumu hazir.`, "success");
    } catch (error) {
        clearAuthState(context, false);
        showAuthFeedback(context, "Oturum gecersiz. Tekrar giris yap.", "error");
    }

    renderAuthState(context);
}

async function fetchAllProblems(context) {
    const pageSize = 50;
    let pageNumber = 0;
    let totalPages = 1;
    const problems = [];

    while (pageNumber < totalPages) {
        const page = await fetchJson(`/api/problems?page=${pageNumber}&size=${pageSize}`, {
            headers: authHeaders(context)
        });
        problems.push(...(page.content || []));
        totalPages = Math.max(page.totalPages || 1, 1);
        pageNumber += 1;
    }

    return problems;
}

function renderAuthState(context) {
    applyAuthPanelState({
        refs: context.refs,
        authToken: context.state.authToken,
        currentUser: context.state.currentUser,
        authenticatedStatusText: "Oturum acik"
    });
    context.renderContinuumGate();
    context.renderProblemLeaderboard();
    context.renderProblemStats();
    context.renderProblemBookmarkButton();
    context.renderReplayBaseline();
    context.renderReplayComparison();
    context.renderDraftStatus();
}

function showAuthFeedback(context, message, type = "idle") {
    applyAuthFeedback(context.refs, message, type);
}

function applyAuthResponse(context, response, message) {
    const { state, refs } = context;
    state.authToken = response.token;
    state.currentUser = {
        userId: response.userId,
        username: response.username,
        role: response.role
    };
    state.problemLeaderboard = null;

    setAuthToken(state.authToken);
    clearAuthPassword(refs);
    renderAuthState(context);
    showAuthFeedback(context, message, "success");
}

function clearAuthState(context, showMessage) {
    const { state } = context;
    context.clearPendingDashboardRefresh();
    state.authToken = null;
    state.currentUser = null;
    state.userDashboard = null;
    state.problemLeaderboard = null;
    state.problemScope = "ALL";
    state.problemDifficultyFilter = "ALL";
    state.problemTagFilter = "ALL";
    clearAuthToken();
    context.resetReplayPanel();
    renderAuthState(context);

    if (showMessage) {
        showAuthFeedback(context, "Oturum kapatildi.", "idle");
    }
}
