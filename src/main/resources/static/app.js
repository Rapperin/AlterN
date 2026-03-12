const AUTH_TOKEN_STORAGE_KEY = "altern.auth.token";
const EDITOR_DRAFT_STORAGE_KEY = "altern.editor.drafts.v1";
const DEFAULT_TIME_LIMIT_MS = 5000;
const DEFAULT_MEMORY_LIMIT_MB = 256;
const SUBMISSION_POLL_INTERVAL_MS = 1500;
const SUBMISSION_POLL_MAX_ATTEMPTS = 40;
const DASHBOARD_PENDING_REFRESH_MS = 2500;
const CATALOG_ATTENTION_ORDER = [
    "NEEDS_HIDDEN_DEPTH",
    "LOW_TOTAL_CASE_COVERAGE",
    "NEEDS_PUBLIC_SAMPLE",
    "LOW_EXAMPLE_DEPTH",
    "MISSING_HINT",
    "MISSING_EDITORIAL"
];

const state = {
    problems: [],
    filteredProblems: [],
    selectedProblemId: null,
    selectedProblem: null,
    workspaceSummary: null,
    catalogHealth: null,
    runnerHealth: null,
    userDashboard: null,
    globalLeaderboard: null,
    selectedUserProfile: null,
    problemLeaderboard: null,
    problemStats: null,
    problemScope: "ALL",
    problemDifficultyFilter: "ALL",
    problemTagFilter: "ALL",
    adminAttentionFilter: "ALL",
    selectedCompareSubmission: null,
    replayComparison: null,
    replayResult: null,
    visibleTestCases: [],
    adminTestCases: [],
    editingTestCaseId: null,
    submissions: [],
    authToken: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
    currentUser: null,
    editorDrafts: loadEditorDrafts(),
    editorLanguageContext: "JAVA",
    draftSaveTimerId: null,
    runnerHealthRefreshing: false,
    pendingDashboardRefreshTimerId: null
};

const refs = {
    authStatus: document.getElementById("authStatus"),
    authForm: document.getElementById("authForm"),
    authUsername: document.getElementById("authUsername"),
    authPassword: document.getElementById("authPassword"),
    registerButton: document.getElementById("registerButton"),
    logoutButton: document.getElementById("logoutButton"),
    authCurrent: document.getElementById("authCurrent"),
    authCurrentUsername: document.getElementById("authCurrentUsername"),
    authCurrentRole: document.getElementById("authCurrentRole"),
    authFeedback: document.getElementById("authFeedback"),
    preflightBanner: document.getElementById("preflightBanner"),
    adminPanel: document.getElementById("adminPanel"),
    catalogHealthCard: document.getElementById("catalogHealthCard"),
    authoringFocusCard: document.getElementById("authoringFocusCard"),
    problemCreateForm: document.getElementById("problemCreateForm"),
    problemCreateTitle: document.getElementById("problemCreateTitle"),
    problemCreateDescription: document.getElementById("problemCreateDescription"),
    problemCreateConstraints: document.getElementById("problemCreateConstraints"),
    problemCreateInputFormat: document.getElementById("problemCreateInputFormat"),
    problemCreateOutputFormat: document.getElementById("problemCreateOutputFormat"),
    problemCreateHintTitle: document.getElementById("problemCreateHintTitle"),
    problemCreateHintContent: document.getElementById("problemCreateHintContent"),
    problemCreateEditorialTitle: document.getElementById("problemCreateEditorialTitle"),
    problemCreateEditorialContent: document.getElementById("problemCreateEditorialContent"),
    problemCreateDifficulty: document.getElementById("problemCreateDifficulty"),
    problemCreateTimeLimit: document.getElementById("problemCreateTimeLimit"),
    problemCreateMemoryLimit: document.getElementById("problemCreateMemoryLimit"),
    problemCreateTags: document.getElementById("problemCreateTags"),
    problemCreateExamples: document.getElementById("problemCreateExamples"),
    problemCreateStarterCodes: document.getElementById("problemCreateStarterCodes"),
    problemUpdateButton: document.getElementById("problemUpdateButton"),
    problemDeleteButton: document.getElementById("problemDeleteButton"),
    problemBulkForm: document.getElementById("problemBulkForm"),
    problemBulkPayload: document.getElementById("problemBulkPayload"),
    testCaseCreateForm: document.getElementById("testCaseCreateForm"),
    adminSelectedProblem: document.getElementById("adminSelectedProblem"),
    adminSelectedTestCase: document.getElementById("adminSelectedTestCase"),
    testCaseInput: document.getElementById("testCaseInput"),
    testCaseExpectedOutput: document.getElementById("testCaseExpectedOutput"),
    testCaseHidden: document.getElementById("testCaseHidden"),
    testCaseSubmitButton: document.getElementById("testCaseSubmitButton"),
    testCaseCancelButton: document.getElementById("testCaseCancelButton"),
    testCaseBulkForm: document.getElementById("testCaseBulkForm"),
    testCaseBulkPayload: document.getElementById("testCaseBulkPayload"),
    adminTestCaseList: document.getElementById("adminTestCaseList"),
    authorFeedback: document.getElementById("authorFeedback"),
    problemCount: document.getElementById("problemCount"),
    problemSearch: document.getElementById("problemSearch"),
    problemFacetCard: document.getElementById("problemFacetCard"),
    userDashboardCard: document.getElementById("userDashboardCard"),
    runnerHealthCard: document.getElementById("runnerHealthCard"),
    communityLeaderboardCard: document.getElementById("communityLeaderboardCard"),
    userProfileCard: document.getElementById("userProfileCard"),
    progressSummary: document.getElementById("progressSummary"),
    problemList: document.getElementById("problemList"),
    problemTitle: document.getElementById("problemTitle"),
    problemBookmarkButton: document.getElementById("problemBookmarkButton"),
    problemDifficulty: document.getElementById("problemDifficulty"),
    problemDescription: document.getElementById("problemDescription"),
    problemConstraints: document.getElementById("problemConstraints"),
    problemInputFormat: document.getElementById("problemInputFormat"),
    problemOutputFormat: document.getElementById("problemOutputFormat"),
    problemHintHeading: document.getElementById("problemHintHeading"),
    problemHintState: document.getElementById("problemHintState"),
    problemHint: document.getElementById("problemHint"),
    problemEditorialHeading: document.getElementById("problemEditorialHeading"),
    problemEditorialState: document.getElementById("problemEditorialState"),
    problemEditorial: document.getElementById("problemEditorial"),
    problemLeaderboardCard: document.getElementById("problemLeaderboardCard"),
    problemStatsCard: document.getElementById("problemStatsCard"),
    problemTags: document.getElementById("problemTags"),
    problemExampleList: document.getElementById("problemExampleList"),
    visibleTestcaseCount: document.getElementById("visibleTestcaseCount"),
    submissionCount: document.getElementById("submissionCount"),
    viewerStatus: document.getElementById("viewerStatus"),
    problemTimeLimit: document.getElementById("problemTimeLimit"),
    problemMemoryLimit: document.getElementById("problemMemoryLimit"),
    submissionPanelEyebrow: document.getElementById("submissionPanelEyebrow"),
    submissionPanelTitle: document.getElementById("submissionPanelTitle"),
    workspaceSummaryCard: document.getElementById("workspaceSummaryCard"),
    workspaceDebugCard: document.getElementById("workspaceDebugCard"),
    sampleList: document.getElementById("sampleList"),
    language: document.getElementById("language"),
    sourceCode: document.getElementById("sourceCode"),
    submissionForm: document.getElementById("submissionForm"),
    submitButton: document.getElementById("submitButton"),
    replayForm: document.getElementById("replayForm"),
    replayInput: document.getElementById("replayInput"),
    replayExpectedOutput: document.getElementById("replayExpectedOutput"),
    replayRunButton: document.getElementById("replayRunButton"),
    replayClearButton: document.getElementById("replayClearButton"),
    replayBaselineCard: document.getElementById("replayBaselineCard"),
    replayResultCard: document.getElementById("replayResultCard"),
    replayCompareCard: document.getElementById("replayCompareCard"),
    templateButton: document.getElementById("templateButton"),
    editorLanguageRecommendation: document.getElementById("editorLanguageRecommendation"),
    editorNote: document.getElementById("editorNote"),
    editorRuntimeAssist: document.getElementById("editorRuntimeAssist"),
    draftStatusCard: document.getElementById("draftStatusCard"),
    submissionFeedback: document.getElementById("submissionFeedback"),
    submissionList: document.getElementById("submissionList")
};

document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
});

async function bootstrap() {
    bindEvents();
    state.editorLanguageContext = refs.language.value;
    renderUserProfile();
    renderProblemStats();
    await hydrateAuth();
    updateEditorNote();
    applyStarterTemplate();
    await Promise.all([
        loadProblems(),
        loadGlobalLeaderboard(),
        loadRunnerHealth()
    ]);
    await refreshSelectedUserProfile();
}

function bindEvents() {
    refs.problemSearch.addEventListener("input", renderProblemList);
    refs.problemBookmarkButton.addEventListener("click", toggleProblemBookmark);
    refs.authForm.addEventListener("submit", login);
    refs.registerButton.addEventListener("click", register);
    refs.logoutButton.addEventListener("click", logout);
    refs.problemCreateForm.addEventListener("submit", createProblem);
    refs.problemUpdateButton.addEventListener("click", updateProblem);
    refs.problemDeleteButton.addEventListener("click", deleteProblem);
    refs.problemBulkForm.addEventListener("submit", bulkCreateProblems);
    refs.testCaseCreateForm.addEventListener("submit", createTestCase);
    refs.testCaseCancelButton.addEventListener("click", resetTestCaseEditor);
    refs.testCaseBulkForm.addEventListener("submit", bulkCreateTestCases);
    refs.language.addEventListener("change", handleLanguageChange);
    refs.sourceCode.addEventListener("input", scheduleDraftSave);
    refs.templateButton.addEventListener("click", () => applyStarterTemplate({ confirmOverwrite: true }));
    refs.submissionForm.addEventListener("submit", submitSolution);
    refs.editorLanguageRecommendation.addEventListener("click", handleEditorLanguageRecommendationClick);
    refs.editorRuntimeAssist.addEventListener("click", handleEditorRuntimeAssistClick);
    refs.replayForm.addEventListener("submit", runReplay);
    refs.replayClearButton.addEventListener("click", resetReplayPanel);
    refs.runnerHealthCard.addEventListener("click", handleRunnerHealthCardClick);
}

async function hydrateAuth() {
    if (!state.authToken) {
        renderAuthState();
        return;
    }

    try {
        state.currentUser = await fetchJson("/api/auth/me", {
            headers: authHeaders()
        });
        showAuthFeedback(`${state.currentUser.username} oturumu hazir.`, "success");
    } catch (error) {
        clearAuthState(false);
        showAuthFeedback("Oturum gecersiz. Tekrar giris yap.", "error");
    }

    renderAuthState();
}

async function loadProblems(preferredProblemId = state.selectedProblemId) {
    try {
        state.problems = await fetchAllProblems();
        state.filteredProblems = [...state.problems];
        refs.problemCount.textContent = `${state.problems.length} problem`;
        renderProblemFacets();
        renderProblemList();
        renderProgressSummary();

        if (state.problems.length > 0) {
            const nextProblemId = state.problems.some((problem) => problem.id === preferredProblemId)
                ? preferredProblemId
                : state.problems[0].id;
            await selectProblem(nextProblemId);
        } else {
            renderProblemEmptyState();
            await loadCatalogHealth();
        }
    } catch (error) {
        showFeedback(error.message, "error");
        renderProblemEmptyState("Problem listesi yuklenemedi.");
        await loadCatalogHealth();
    }

    await loadUserDashboard();
}

async function loadGlobalLeaderboard() {
    try {
        state.globalLeaderboard = await fetchJson("/api/leaderboard", {
            headers: authHeaders()
        });
    } catch (error) {
        state.globalLeaderboard = null;
    }

    renderGlobalLeaderboard();
}

async function loadRunnerHealth(options = {}) {
    const refresh = Boolean(options.refresh);
    state.runnerHealthRefreshing = refresh;
    renderRunnerHealth();

    try {
        state.runnerHealth = await fetchJson(refresh ? "/api/health?refresh=true" : "/api/health", {
            headers: authHeaders()
        });
    } catch (error) {
        state.runnerHealth = null;
    } finally {
        state.runnerHealthRefreshing = false;
    }

    renderRunnerHealth();
    refreshLanguageAvailability();
    renderPreflightBanner();
}

function handleRunnerHealthCardClick(event) {
    const refreshButton = event.target.closest("[data-runner-health-refresh]");
    if (refreshButton) {
        if (state.runnerHealthRefreshing) {
            return;
        }

        void loadRunnerHealth({ refresh: true });
        return;
    }

    const copyButton = event.target.closest("[data-copy-runtime-command]");
    if (!copyButton) {
        return;
    }

    void copyRuntimeCommand(copyButton.dataset.copyRuntimeCommand, copyButton.dataset.copyRuntimeLanguage);
}

function handleEditorRuntimeAssistClick(event) {
    const switchButton = event.target.closest("[data-editor-runtime-switch-language]");
    if (switchButton) {
        switchEditorLanguage(switchButton.dataset.editorRuntimeSwitchLanguage);
        return;
    }

    const copyButton = event.target.closest("[data-copy-runtime-command]");
    if (copyButton) {
        void copyRuntimeCommand(copyButton.dataset.copyRuntimeCommand, copyButton.dataset.copyRuntimeLanguage);
        return;
    }

    const refreshButton = event.target.closest("[data-runner-health-refresh]");
    if (refreshButton && !state.runnerHealthRefreshing) {
        void loadRunnerHealth({ refresh: true });
    }
}

function handleEditorLanguageRecommendationClick(event) {
    const recommendationButton = event.target.closest("[data-editor-recommended-language]");
    if (!recommendationButton) {
        return;
    }

    switchEditorLanguage(recommendationButton.dataset.editorRecommendedLanguage);
}

async function refreshSelectedUserProfile() {
    if (!state.selectedUserProfile?.username) {
        renderUserProfile();
        return;
    }

    try {
        state.selectedUserProfile = await fetchJson(`/api/users/${encodeURIComponent(state.selectedUserProfile.username)}/profile`, {
            headers: authHeaders()
        });
    } catch (error) {
        state.selectedUserProfile = null;
    }

    renderUserProfile();
}

async function loadUserDashboard() {
    if (!state.currentUser || !state.authToken) {
        clearPendingDashboardRefresh();
        state.userDashboard = null;
        renderUserDashboard();
        renderProblemList();
        return;
    }

    try {
        state.userDashboard = await fetchJson("/api/dashboard", {
            headers: authHeaders()
        });
    } catch (error) {
        state.userDashboard = null;
    }

    renderUserDashboard();
    renderProblemList();
    schedulePendingDashboardRefresh();
}

async function loadCatalogHealth() {
    if (!state.currentUser || !state.authToken || !isAdmin()) {
        state.catalogHealth = null;
        state.adminAttentionFilter = "ALL";
        renderCatalogHealth();
        return;
    }

    try {
        state.catalogHealth = await fetchJson("/api/admin/catalog/health", {
            headers: authHeaders()
        });
        normalizeAdminAttentionFilter();
    } catch (error) {
        state.catalogHealth = null;
        showAuthorFeedback(error.message, "error");
    }

    renderCatalogHealth();
}

async function fetchAllProblems() {
    const pageSize = 50;
    let pageNumber = 0;
    let totalPages = 1;
    const problems = [];

    while (pageNumber < totalPages) {
        const page = await fetchJson(`/api/problems?page=${pageNumber}&size=${pageSize}`, {
            headers: authHeaders()
        });
        problems.push(...(page.content || []));
        totalPages = Math.max(page.totalPages || 1, 1);
        pageNumber += 1;
    }

    return problems;
}

async function selectProblem(problemId) {
    const previousProblemId = state.selectedProblemId;
    if (previousProblemId && previousProblemId !== problemId) {
        flushCurrentDraft();
    }

    const shouldResetReplay = problemId !== state.selectedProblemId;
    state.selectedProblemId = problemId;
    renderProblemList();

    try {
        const submissionsPromise = state.currentUser
            ? fetchJson(`/api/submissions?page=0&size=10&problemId=${problemId}`, {
                headers: authHeaders()
            })
            : fetchJson(`/api/problems/${problemId}/submissions?page=0&size=10`);
        const workspacePromise = state.currentUser
            ? fetchJson(`/api/workspace/problems/${problemId}`, {
                headers: authHeaders()
            })
            : Promise.resolve(null);

        const [problem, testCases, submissionsPage, workspaceSummary, problemLeaderboard, problemStats] = await Promise.all([
            fetchJson(`/api/problems/${problemId}`, {
                headers: authHeaders()
            }),
            fetchJson(`/api/problems/${problemId}/testcases`),
            submissionsPromise,
            workspacePromise,
            fetchJson(`/api/problems/${problemId}/leaderboard`, {
                headers: authHeaders()
            }),
            fetchJson(`/api/problems/${problemId}/stats`, {
                headers: authHeaders()
            })
        ]);

        state.selectedProblem = problem;
        state.workspaceSummary = workspaceSummary;
        state.visibleTestCases = testCases;
        state.submissions = submissionsPage.content || [];
        state.problemLeaderboard = problemLeaderboard;
        state.problemStats = problemStats;
        populateProblemForm(problem);
        resetTestCaseEditor();
        renderSelectedProblem();
        renderProblemLeaderboard();
        renderProblemStats();
        renderWorkspaceSummary();
        renderSamples();
        renderSubmissions();
        await loadAdminTestCases(problemId);
        await loadCatalogHealth();
        updateEditorNote();

        if (shouldResetReplay) {
            resetReplayPanel();
        }

        if (shouldResetReplay) {
            syncEditorForSelectedProblem({ announceDraftRestore: true });
        } else if (!refs.sourceCode.value.trim()) {
            syncEditorForSelectedProblem();
        } else {
            renderDraftStatus();
        }
    } catch (error) {
        state.problemLeaderboard = null;
        state.problemStats = null;
        renderProblemLeaderboard();
        renderProblemStats();
        showFeedback(error.message, "error");
    }
}

function renderProblemList() {
    const query = refs.problemSearch.value.trim().toLowerCase();
    const continueProblemId = state.userDashboard?.continueAttempt?.problemId;
    const suggestedProblemId = state.userDashboard?.suggestedProblem?.problemId;
    state.filteredProblems = state.problems.filter((problem) => {
        const searchable = `${problem.title} ${problem.difficulty} ${(problem.tags || []).join(" ")}`.toLowerCase();
        return searchable.includes(query)
            && matchesProblemScope(problem)
            && matchesProblemDifficulty(problem)
            && matchesProblemTag(problem)
            && matchesProblemAttention(problem);
    });

    if (state.filteredProblems.length === 0) {
        refs.problemList.innerHTML = `<div class="empty-state">Filtreye uygun problem bulunamadi.</div>`;
        return;
    }

    refs.problemList.innerHTML = state.filteredProblems.map((problem) => `
        <article class="problem-card ${problem.id === state.selectedProblemId ? "is-active" : ""}" data-problem-id="${problem.id}">
            <h3>${escapeHtml(problem.title)}</h3>
            <p>${escapeHtml(shorten(problem.description, 120))}</p>
            <div class="problem-card__meta">
                <span class="difficulty ${difficultyClass(problem.difficulty)}">${problem.difficulty}</span>
                <span class="badge">${problem.testCaseCount} sample</span>
                <span class="badge">${problem.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS} ms</span>
                <span class="badge">${problem.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB} MB</span>
                <span class="badge">${problem.submissionCount} submission</span>
                ${state.currentUser ? `<span class="badge ${statusPillClass(problem.viewerStatus)}">You: ${escapeHtml(formatViewerStatus(problem.viewerStatus))}</span>` : ""}
                ${state.currentUser && problem.viewerBookmarked ? `<span class="badge badge--accent-soft">Saved</span>` : ""}
                ${hasProblemDraft(problem.id) ? `<span class="badge badge--accent">Draft</span>` : ""}
                ${continueProblemId === problem.id ? `<span class="badge badge--accent">Continue</span>` : ""}
                ${suggestedProblemId === problem.id ? `<span class="badge badge--accent-soft">Next</span>` : ""}
                ${renderProblemAttentionBadges(problem)}
                ${(problem.tags || []).slice(0, 2).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}
            </div>
        </article>
    `).join("");

    refs.problemList.querySelectorAll("[data-problem-id]").forEach((card) => {
        card.addEventListener("click", () => selectProblem(Number(card.dataset.problemId)));
    });
}

function renderGlobalLeaderboard() {
    const leaderboard = state.globalLeaderboard;
    if (!leaderboard || !Array.isArray(leaderboard.entries) || leaderboard.entries.length === 0) {
        refs.communityLeaderboardCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Community</p>
                    <h3>Hall of Fame</h3>
                </div>
            </div>
            <div class="empty-state">Henuz public leaderboard verisi yok.</div>
        `;
        return;
    }

    refs.communityLeaderboardCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Community</p>
                <h3>Hall of Fame</h3>
            </div>
            <span class="badge">${leaderboard.totalRankedUsers ?? leaderboard.entries.length} aktif user</span>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Accepted volume</p>
            <div class="workspace-card__breakdown">
                <span class="badge">${leaderboard.totalAcceptedSubmissions ?? 0} accepted</span>
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Top solvers</p>
                <div class="dashboard-card__list">
                    ${leaderboard.entries.map((entry) => `
                    <article
                        class="dashboard-card__item leaderboard-item dashboard-card__item--interactive ${entry.viewer ? "leaderboard-item--viewer" : ""}"
                        data-profile-username="${escapeHtml(entry.username || "")}">
                        <strong>#${entry.rank} ${escapeHtml(entry.username || "User")}</strong>
                        <p>${entry.solvedProblems ?? 0} solved | ${entry.acceptanceRate ?? 0}% accepted | ${escapeHtml(entry.mostUsedLanguage || "-")}</p>
                        <p>${entry.recentAcceptedProblemTitle ? `Son solved: ${escapeHtml(entry.recentAcceptedProblemTitle)} | ${formatDate(entry.recentAcceptedAt)}` : "Henuz accepted problemi yok."}</p>
                        <span class="dashboard-card__hint">Public profile ac</span>
                    </article>
                `).join("")}
            </div>
        </div>
    `;

    refs.communityLeaderboardCard.querySelectorAll("[data-profile-username]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void openUserProfile(entry.dataset.profileUsername, { scrollIntoView: true });
        });
    });
}

function renderRunnerHealth() {
    const health = state.runnerHealth;
    if (!health || !health.runner) {
        refs.runnerHealthCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Infra</p>
                    <h3>Execution Runtime</h3>
                </div>
                <button
                    type="button"
                    class="button button--ghost button--small"
                    data-runner-health-refresh
                    ${state.runnerHealthRefreshing ? "disabled" : ""}>
                    ${state.runnerHealthRefreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>
            <div class="empty-state">Runner health bilgisi yuklenemedi.</div>
        `;
        return;
    }

    const runner = health.runner;
    const judgeQueue = health.judgeQueue || null;
    const requestedMode = runner.requestedMode || (runner.dockerEnabled ? "DOCKER" : "LOCAL");
    const modeLabel = runner.mode || "LOCAL";
    const dockerState = runner.dockerEnabled
        ? (runner.dockerAvailable ? "Docker ready" : "Docker unavailable")
        : "Docker off";
    const judgeMode = health.judgeMode || "SYNC";
    const message = runner.message || "Runner durumu hazir.";
    const profiles = Array.isArray(health.profiles) && health.profiles.length > 0
        ? health.profiles.join(", ")
        : "default";
    const checkedAt = runner.checkedAt ? formatDate(runner.checkedAt) : "Bilinmiyor";
    const queueMarkup = judgeQueue ? `
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Judge queue</p>
            <div class="workspace-card__breakdown">
                <span class="badge ${judgeQueue.pressure === "BACKLOGGED" ? "badge--accent-soft" : ""}">${escapeHtml(judgeQueue.pressure || "IDLE")}</span>
                <span class="badge">${judgeQueue.pendingSubmissions ?? 0} pending</span>
                ${judgeQueue.oldestPendingAgeSeconds != null ? `<span class="badge">Oldest ${judgeQueue.oldestPendingAgeSeconds}s</span>` : ""}
            </div>
            <p class="dashboard-card__hint">${escapeHtml(judgeQueue.message || "Judge queue durumu hazir.")}</p>
        </div>
    ` : "";
    const localToolchains = Array.isArray(runner.localToolchains) ? runner.localToolchains : [];
    const toolchainMarkup = localToolchains.length > 0
        ? `
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Local toolchains</p>
                <div class="dashboard-card__list">
                    ${localToolchains.map((toolchain) => `
                        <article class="dashboard-card__item">
                            <strong>${escapeHtml(toolchain.language || "LANG")}</strong>
                            <p>${escapeHtml(toolchain.available ? "Ready" : "Missing")} | ${escapeHtml(toolchain.command || "-")}</p>
                            <p>${escapeHtml(toolchain.version || toolchain.message || "No version info")}</p>
                            ${toolchain.available || !toolchain.setupSummary ? "" : `<p>${escapeHtml(toolchain.setupSummary)}</p>`}
                            ${toolchain.available || !toolchain.setupCommand ? "" : `
                                <div class="dashboard-card__command">
                                    <code>${escapeHtml(toolchain.setupCommand)}</code>
                                    <button
                                        type="button"
                                        class="button button--ghost button--small"
                                        data-copy-runtime-command="${escapeHtml(toolchain.setupCommand)}"
                                        data-copy-runtime-language="${escapeHtml(toolchain.language || "Runtime")}">
                                        Copy fix
                                    </button>
                                </div>
                            `}
                        </article>
                    `).join("")}
                </div>
            </div>
        `
        : "";

    refs.runnerHealthCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Infra</p>
                <h3>Execution Runtime</h3>
            </div>
            <div class="dashboard-card__actions">
                <span class="badge ${runner.readiness === "READY" ? "badge--accent-soft" : ""}">${escapeHtml(runner.readiness || modeLabel)}</span>
                <button
                    type="button"
                    class="button button--ghost button--small"
                    data-runner-health-refresh
                    ${state.runnerHealthRefreshing ? "disabled" : ""}>
                    ${state.runnerHealthRefreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Runner mode</p>
            <div class="workspace-card__breakdown">
                <span class="badge">Judge: ${escapeHtml(judgeMode)}</span>
                <span class="badge">Requested: ${escapeHtml(requestedMode)}</span>
                <span class="badge ${runner.sandboxActive ? "badge--accent-soft" : ""}">Effective: ${escapeHtml(modeLabel)}</span>
                <span class="badge">${escapeHtml(dockerState)}</span>
                <span class="badge">Fallback: ${escapeHtml(runner.fallbackMode || "LOCAL")}</span>
                <span class="badge">${runner.availableLanguageCount ?? 0}/${runner.supportedLanguageCount ?? 0} languages</span>
                ${runner.dockerVersion ? `<span class="badge">Docker ${escapeHtml(runner.dockerVersion)}</span>` : ""}
            </div>
            <p class="dashboard-card__hint">Profile: ${escapeHtml(profiles)}</p>
            <p class="dashboard-card__hint">Last checked: ${escapeHtml(checkedAt)}</p>
            <p class="dashboard-card__hint">${escapeHtml(message)}</p>
            ${runner.actionRequired && runner.actionMessage ? `<p class="dashboard-card__hint">${escapeHtml(runner.actionMessage)}</p>` : ""}
        </div>
        ${queueMarkup}
        ${toolchainMarkup}
    `;
}

function renderPreflightBanner() {
    if (!refs.preflightBanner) {
        return;
    }

    const runner = getRunnerHealthDescriptor();
    if (!runner) {
        refs.preflightBanner.hidden = true;
        return;
    }

    const readiness = runner.readiness || "READY";
    const queue = state.runnerHealth?.judgeQueue || null;
    const available = runner.availableLanguageCount ?? 0;
    const supported = runner.supportedLanguageCount ?? 0;
    const headline = readiness === "READY"
        ? "Runtime ready"
        : readiness === "DEGRADED"
            ? "Runtime degraded"
            : "Runtime blocked";
    const summary = readiness === "READY"
        ? `Solve akisi hazir. ${available}/${supported} dil aktif.`
        : readiness === "DEGRADED"
            ? `Ortam kismen hazir. ${available}/${supported} dil aktif.`
            : "Desteklenen diller icin calisabilir runtime bulunamadi.";
    const firstMissingToolchain = Array.isArray(runner.localToolchains)
        ? runner.localToolchains.find((toolchain) => toolchain.available === false)
        : null;

    refs.preflightBanner.hidden = false;
    refs.preflightBanner.className = `preflight-banner preflight-banner--${readiness.toLowerCase()}`;
    refs.preflightBanner.innerHTML = `
        <strong>${escapeHtml(headline)}</strong>
        <p>${escapeHtml(summary)}</p>
        ${queue && (queue.pendingSubmissions ?? 0) > 0 ? `<p>Judge queue: ${escapeHtml(queue.message || `${queue.pendingSubmissions} pending`)}</p>` : ""}
        ${runner.actionMessage ? `<p>${escapeHtml(runner.actionMessage)}</p>` : ""}
        ${firstMissingToolchain?.setupCommand ? `<p>Quick fix: ${escapeHtml(firstMissingToolchain.language)} -> <code>${escapeHtml(firstMissingToolchain.setupCommand)}</code></p>` : ""}
    `;
}

function getRunnerHealthDescriptor() {
    return state.runnerHealth?.runner || null;
}

function isDockerExecutionActive() {
    const runner = getRunnerHealthDescriptor();
    return Boolean(runner?.sandboxActive && runner?.mode === "DOCKER");
}

function getLocalToolchainHealth(language) {
    const runner = getRunnerHealthDescriptor();
    if (!runner || !Array.isArray(runner.localToolchains)) {
        return null;
    }

    return runner.localToolchains.find((toolchain) => toolchain.language === language) || null;
}

function getMissingLocalToolchains() {
    const runner = getRunnerHealthDescriptor();
    if (!runner || !Array.isArray(runner.localToolchains)) {
        return [];
    }

    return runner.localToolchains.filter((toolchain) => toolchain.available === false);
}

function getFirstAvailableLanguage(excludedLanguage = null) {
    const options = Array.from(refs.language.options);
    const nextAvailable = options.find((option) => option.value !== excludedLanguage && isLanguageExecutionAvailable(option.value));
    return nextAvailable?.value || null;
}

function resolveEditorLanguageRecommendation() {
    if (!state.selectedProblemId) {
        return null;
    }

    const tried = new Set();
    const pushCandidate = (language, reason, priority, actionLabel = null) => {
        if (!language || tried.has(language) || !isLanguageExecutionAvailable(language)) {
            return null;
        }
        tried.add(language);
        return { language, reason, priority, actionLabel };
    };

    const draftCandidate = listProblemDraftLanguages(state.selectedProblemId)
        .find((entry) => isLanguageExecutionAvailable(entry.language));

    const candidates = [
        pushCandidate(
            draftCandidate?.language,
            draftCandidate?.updatedAt
                ? `Bu problemde son draftin ${formatDate(draftCandidate.updatedAt)} kaydedildi`
                : "Bu problemde kayitli bir draftin var",
            0,
            draftCandidate?.language ? `Resume ${draftCandidate.language} draft` : null
        ),
        pushCandidate(
            state.workspaceSummary?.lastAcceptedLanguage,
            "Bu problemde son accepted dilin",
            1
        ),
        pushCandidate(
            state.workspaceSummary?.lastSubmissionLanguage,
            "Bu problemde son deneme dilin",
            2
        ),
        pushCandidate(
            state.userDashboard?.journeyFocus?.problemId === state.selectedProblemId
                ? state.userDashboard?.journeyFocus?.suggestedLanguage
                : null,
            "Journey focus onerisi",
            3
        ),
        pushCandidate(
            state.problemStats?.mostUsedLanguage,
            "Bu problemde toplulugun en sik kullandigi hazir dil",
            4
        ),
        pushCandidate(
            state.userDashboard?.mostSuccessfulLanguage,
            "Accepted performansinin en guclu oldugu hazir dil",
            5
        ),
        pushCandidate(
            state.userDashboard?.mostUsedLanguage,
            "En cok kullandigin hazir dil",
            6
        ),
        pushCandidate(
            getFirstAvailableLanguage(null),
            "Bu ortamda hemen calisabilecek dil",
            7
        )
    ].filter(Boolean);

    return candidates.sort((left, right) => left.priority - right.priority)[0] || null;
}

function isLanguageExecutionAvailable(language) {
    const runner = getRunnerHealthDescriptor();
    if (!runner) {
        return true;
    }

    if (isDockerExecutionActive()) {
        return true;
    }

    const toolchain = getLocalToolchainHealth(language);
    return toolchain ? Boolean(toolchain.available) : true;
}

function getLanguageExecutionMessage(language) {
    const toolchain = getLocalToolchainHealth(language);
    if (toolchain?.available === false) {
        const parts = [
            toolchain.message || `${language} runtime hazir degil.`,
            toolchain.setupSummary || null,
            toolchain.setupCommand ? `Try: ${toolchain.setupCommand}` : null
        ].filter(Boolean);
        return parts.join(" ");
    }

    const runner = getRunnerHealthDescriptor();
    if (runner?.dockerEnabled && !runner.dockerAvailable) {
        return runner.message || "Docker sandbox istenmis ama hazir degil.";
    }

    return null;
}

async function copyRuntimeCommand(command, language) {
    if (!command) {
        showFeedback("Kopyalanacak kurulum komutu bulunamadi.", "error");
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(command);
        } else {
            copyTextFallback(command);
        }
        showFeedback(`${language || "Runtime"} icin fix komutu kopyalandi. Kurulumdan sonra Refresh ile tekrar kontrol et.`, "success");
    } catch (error) {
        showFeedback("Komut kopyalanamadi. Elle secip kopyalayabilirsin.", "error");
    }
}

function switchEditorLanguage(language) {
    if (!language || refs.language.value === language) {
        return;
    }

    const previousLanguage = state.editorLanguageContext || refs.language.value;
    persistDraftForContext(state.selectedProblemId, previousLanguage, refs.sourceCode.value);
    refs.language.value = language;
    state.editorLanguageContext = language;
    updateEditorNote();
    syncEditorForSelectedProblem();
    showFeedback(`${language} secildi. Hazir runtime ile devam edebilirsin.`, "success");
}

function copyTextFallback(value) {
    const probe = document.createElement("textarea");
    probe.value = value;
    probe.setAttribute("readonly", "readonly");
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);
    probe.select();
    document.execCommand("copy");
    document.body.removeChild(probe);
}

function refreshLanguageAvailability() {
    const options = Array.from(refs.language.options);
    const currentLanguage = refs.language.value;

    options.forEach((option) => {
        const available = isLanguageExecutionAvailable(option.value);
        option.disabled = !available;
        option.textContent = available ? option.value : `${option.value} (unavailable)`;
    });

    if (!isLanguageExecutionAvailable(currentLanguage)) {
        const nextAvailable = options.find((option) => !option.disabled);
        if (nextAvailable) {
            const previousLanguage = state.editorLanguageContext || currentLanguage;
            persistDraftForContext(state.selectedProblemId, previousLanguage, refs.sourceCode.value);
            refs.language.value = nextAvailable.value;
            state.editorLanguageContext = nextAvailable.value;
            updateEditorNote();
            syncEditorForSelectedProblem();
            showFeedback(`${currentLanguage} bu ortamda hazir degil. ${nextAvailable.value} secildi.`, "idle");
        }
    }

    updateEditorNote();
    renderReplayBaseline();
}

function renderUserProfile() {
    const profile = state.selectedUserProfile;
    if (!profile) {
        refs.userProfileCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Community</p>
                    <h3>Public Profile</h3>
                </div>
            </div>
            <div class="empty-state">Hall of Fame veya problem leaderboard'dan bir kullanici sec.</div>
        `;
        return;
    }

    const solvedByDifficulty = Object.entries(profile.solvedByDifficulty || {});
    const recentAccepted = profile.recentAccepted || [];
    const achievements = profile.achievements || [];
    const journey = profile.journey;
    const rankCopy = profile.globalRank
        ? `#${profile.globalRank} / ${profile.totalRankedUsers ?? profile.globalRank}`
        : "Henuz rank almadi";

    refs.userProfileCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Community</p>
                <h3>Public Profile</h3>
            </div>
            <div class="workspace-card__actions">
                ${profile.viewer ? `<span class="badge badge--accent-soft">You</span>` : ""}
                <button type="button" class="button button--ghost button--small" data-clear-user-profile>Kapat</button>
            </div>
        </div>
        <article class="dashboard-card__spotlight">
            <strong>${escapeHtml(profile.username || "User")}</strong>
            <p>${escapeHtml(rankCopy)} | ${escapeHtml(profile.mostUsedLanguage || "-")} | Joined ${formatDate(profile.joinedAt)}</p>
            <span>${profile.lastSubmissionAt ? `Last active ${formatDate(profile.lastSubmissionAt)}` : "Henuz public aktivite yok."}</span>
        </article>
        <div class="dashboard-card__grid">
            <article class="dashboard-card__stat">
                <span>Solved</span>
                <strong>${profile.solvedProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Attempts</span>
                <strong>${profile.totalSubmissions ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Accepted rate</span>
                <strong>${profile.acceptanceRate ?? 0}%</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Active days</span>
                <strong>${profile.activeDays ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Current streak</span>
                <strong>${profile.currentAcceptedStreakDays ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Best streak</span>
                <strong>${profile.longestAcceptedStreakDays ?? 0}</strong>
            </article>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Solved by difficulty</p>
            <div class="workspace-card__breakdown">
                ${solvedByDifficulty.map(([difficulty, count]) => `<span class="badge ${difficultyClass(difficulty)}">${escapeHtml(difficulty)}: ${count}</span>`).join("")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Journey</p>
            ${renderJourneySection(journey, "profile")}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Achievements</p>
            ${achievements.length > 0 ? `
                <div class="dashboard-card__list">
                    ${achievements.map((achievement) => `
                        <article class="dashboard-card__item">
                            <strong>${escapeHtml(achievement.title || "Badge")}</strong>
                            <p>${escapeHtml(achievement.description || "")}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz rozet yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Recent solved</p>
            ${recentAccepted.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentAccepted.map((entry) => `
                        <article class="dashboard-card__item ${entry.problemId ? "dashboard-card__item--interactive" : ""}" ${entry.problemId ? `data-profile-problem-id="${entry.problemId}"` : ""}>
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${formatDate(entry.acceptedAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz accepted problem yok.</p>`}
        </div>
    `;

    refs.userProfileCard.querySelector("[data-clear-user-profile]")?.addEventListener("click", () => {
        clearUserProfile();
    });
    refs.userProfileCard.querySelectorAll("[data-profile-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void openDashboardProblem(Number(entry.dataset.profileProblemId), null, "Public Profile");
        });
    });
}

function renderProblemFacets() {
    const tags = [...new Set(
        state.problems.flatMap((problem) => problem.tags || [])
    )].sort((left, right) => left.localeCompare(right));
    const attentionBreakdown = buildCatalogAttentionBreakdown();

    refs.problemFacetCard.innerHTML = `
        <div class="facet-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Problem focus</p>
                <h3>Difficulty & Tags</h3>
            </div>
        </div>
        <div class="facet-card__section">
            <p class="facet-card__label">Difficulty</p>
            <div class="filter-group">
                ${renderFacetButton("difficulty", "ALL", "Tum", state.problemDifficultyFilter)}
                ${renderFacetButton("difficulty", "EASY", "Easy", state.problemDifficultyFilter)}
                ${renderFacetButton("difficulty", "MEDIUM", "Medium", state.problemDifficultyFilter)}
                ${renderFacetButton("difficulty", "HARD", "Hard", state.problemDifficultyFilter)}
            </div>
        </div>
        <div class="facet-card__section">
            <p class="facet-card__label">Tags</p>
            <div class="filter-group">
                ${renderFacetButton("tag", "ALL", "Tum", state.problemTagFilter)}
                ${tags.length > 0
                    ? tags.map((tag) => renderFacetButton("tag", tag, tag, state.problemTagFilter)).join("")
                    : `<span class="badge">Tag yok</span>`}
            </div>
        </div>
        ${isAdmin() ? `
            <div class="facet-card__section">
                <p class="facet-card__label">Catalog curation</p>
                <div class="filter-group">
                    ${renderAdminAttentionButton("ALL", "Tum problemler")}
                    ${renderAdminAttentionButton("ATTENTION", `Need attention (${state.catalogHealth?.problemsNeedingAttention ?? 0})`)}
                    ${attentionBreakdown.length > 0
                        ? attentionBreakdown.map(([flag, count]) => renderAdminAttentionButton(flag, `${formatCatalogAttentionFlag(flag)} (${count})`)).join("")
                        : `<span class="badge">Attention yok</span>`}
                </div>
            </div>
        ` : ""}
    `;

    refs.problemFacetCard.querySelectorAll("[data-difficulty-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemDifficultyFilter(button.dataset.difficultyFilter);
        });
    });

    refs.problemFacetCard.querySelectorAll("[data-tag-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemTagFilter(button.dataset.tagFilter);
        });
    });

    refs.problemFacetCard.querySelectorAll("[data-admin-attention-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            setAdminAttentionFilter(button.dataset.adminAttentionFilter);
        });
    });
}

function renderSelectedProblem() {
    if (!state.selectedProblem) {
        renderProblemEmptyState();
        return;
    }

    refs.problemTitle.textContent = state.selectedProblem.title;
    refs.problemDifficulty.textContent = state.selectedProblem.difficulty;
    refs.problemDifficulty.className = `difficulty ${difficultyClass(state.selectedProblem.difficulty)}`;
    refs.problemDescription.textContent = state.selectedProblem.description;
    refs.problemConstraints.textContent = state.selectedProblem.constraints || "Constraint belirtilmedi.";
    refs.problemInputFormat.textContent = state.selectedProblem.inputFormat || "Input format belirtilmedi.";
    refs.problemOutputFormat.textContent = state.selectedProblem.outputFormat || "Output format belirtilmedi.";
    refs.visibleTestcaseCount.textContent = state.selectedProblem.testCaseCount;
    refs.submissionCount.textContent = state.selectedProblem.submissionCount;
    refs.viewerStatus.textContent = state.currentUser
        ? formatViewerStatus(state.selectedProblem.viewerStatus)
        : "Login";
    refs.problemTimeLimit.textContent = `${state.selectedProblem.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS} ms`;
    refs.problemMemoryLimit.textContent = `${state.selectedProblem.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB} MB`;
    renderProblemBookmarkButton();
    renderProblemTags();
    renderProblemExamples();
    renderHint();
    renderEditorial();
}

function renderProblemBookmarkButton() {
    if (!state.currentUser || !state.selectedProblem) {
        refs.problemBookmarkButton.hidden = true;
        refs.problemBookmarkButton.disabled = true;
        refs.problemBookmarkButton.className = "button button--ghost button--small";
        refs.problemBookmarkButton.textContent = "Save for later";
        return;
    }

    const bookmarked = Boolean(state.selectedProblem.viewerBookmarked);
    refs.problemBookmarkButton.hidden = false;
    refs.problemBookmarkButton.disabled = false;
    refs.problemBookmarkButton.className = `button button--ghost button--small ${bookmarked ? "button--soft" : ""}`;
    refs.problemBookmarkButton.textContent = bookmarked ? "Saved" : "Save for later";
}

function renderProblemLeaderboard() {
    const leaderboard = state.problemLeaderboard;
    if (!state.selectedProblemId) {
        refs.problemLeaderboardCard.innerHTML = `<div class="empty-state">Problem secildiginde leaderboard burada gorunecek.</div>`;
        return;
    }

    if (!leaderboard || !Array.isArray(leaderboard.entries) || leaderboard.entries.length === 0) {
        refs.problemLeaderboardCard.innerHTML = `<p class="workspace-card__lead">Bu problem icin henuz public accepted run yok.</p>`;
        return;
    }

    refs.problemLeaderboardCard.innerHTML = `
        <div class="workspace-card__grid">
            <article class="workspace-card__stat">
                <span>Accepted users</span>
                <strong>${leaderboard.totalAcceptedUsers ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Accepted runs</span>
                <strong>${leaderboard.totalAcceptedSubmissions ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Top runtime</span>
                <strong>${leaderboard.entries[0]?.executionTime ?? 0} ms</strong>
            </article>
        </div>
        <div class="dashboard-card__list">
            ${leaderboard.entries.map((entry) => `
                <article class="dashboard-card__item dashboard-card__item--interactive leaderboard-item ${entry.viewer ? "leaderboard-item--viewer" : ""}" data-profile-username="${escapeHtml(entry.username || "")}">
                    <strong>#${entry.rank} ${escapeHtml(entry.username || "User")}</strong>
                    <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${entry.memoryUsage ?? 0} MB</p>
                    <p>${formatDate(entry.acceptedAt)}</p>
                    <span class="dashboard-card__hint">Public profile ac</span>
                </article>
            `).join("")}
        </div>
    `;

    refs.problemLeaderboardCard.querySelectorAll("[data-profile-username]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void openUserProfile(entry.dataset.profileUsername, { scrollIntoView: true });
        });
    });
}

function renderProblemStats() {
    const stats = state.problemStats;
    if (!state.selectedProblemId) {
        refs.problemStatsCard.innerHTML = `<div class="empty-state">Problem secildiginde community snapshot burada gorunecek.</div>`;
        return;
    }

    if (!stats) {
        refs.problemStatsCard.innerHTML = `<p class="workspace-card__lead">Bu problem icin community stats verisi yuklenemedi.</p>`;
        return;
    }

    const languageBreakdown = Object.entries(stats.languageBreakdown || {}).filter(([, count]) => count > 0);

    refs.problemStatsCard.innerHTML = `
        <div class="workspace-card__grid">
            <article class="workspace-card__stat">
                <span>Public submissions</span>
                <strong>${stats.totalSubmissions ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Accepted users</span>
                <strong>${stats.acceptedUsers ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Acceptance rate</span>
                <strong>${stats.acceptanceRate ?? 0}%</strong>
            </article>
        </div>
        <p class="workspace-card__lead">
            ${stats.mostUsedLanguage ? `En aktif dil ${escapeHtml(stats.mostUsedLanguage)}.` : "Henuz public user submission'i yok."}
            ${stats.latestAcceptedAt ? ` Son accepted: ${formatDate(stats.latestAcceptedAt)}.` : ""}
        </p>
        <div class="workspace-card__breakdown">
            <span class="badge">Accepted runs: ${stats.acceptedSubmissions ?? 0}</span>
            <span class="badge">Fastest: ${stats.fastestExecutionTime ?? "-"}${stats.fastestExecutionTime != null ? " ms" : ""}</span>
            <span class="badge">Lowest memory: ${stats.lowestMemoryUsage ?? "-"}${stats.lowestMemoryUsage != null ? " MB" : ""}</span>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Language mix</p>
            ${languageBreakdown.length > 0
                ? `<div class="workspace-card__breakdown">${languageBreakdown.map(([language, count]) => `<span class="badge">${escapeHtml(language)}: ${count}</span>`).join("")}</div>`
                : `<p class="workspace-card__meta">Bu problem icin public dil verisi henuz yok.</p>`}
        </div>
    `;
}

async function loadAdminTestCases(problemId) {
    if (!isAdmin()) {
        state.adminTestCases = [];
        state.editingTestCaseId = null;
        renderAdminPanel();
        return;
    }

    try {
        state.adminTestCases = await fetchJson(`/api/problems/${problemId}/testcases/admin`, {
            headers: authHeaders()
        });
    } catch (error) {
        state.adminTestCases = [];
        showAuthorFeedback(error.message, "error");
    }

    renderAdminPanel();
}

function renderSamples() {
    if (state.visibleTestCases.length === 0) {
        refs.sampleList.innerHTML = `<div class="empty-state">Bu problem icin su anda public sample yok.</div>`;
        return;
    }

    refs.sampleList.innerHTML = state.visibleTestCases.map((testCase, index) => `
        <article class="sample-card">
            <div class="sample-card__header">
                <strong>Sample ${index + 1}</strong>
                ${state.currentUser ? `<div class="sample-card__actions"><button type="button" class="button button--ghost button--small" data-load-sample-replay-index="${index}">Replay'e al</button></div>` : ""}
            </div>
            <p><code>input: ${escapeHtml(testCase.input)}</code></p>
            <p><code>expected: ${escapeHtml(testCase.expectedOutput)}</code></p>
        </article>
    `).join("");

    refs.sampleList.querySelectorAll("[data-load-sample-replay-index]").forEach((button) => {
        button.addEventListener("click", () => {
            const sample = state.visibleTestCases[Number(button.dataset.loadSampleReplayIndex)];
            if (sample) {
                loadReplayFromCase(sample.input, sample.expectedOutput, "Sample case");
            }
        });
    });
}

function renderSubmissions() {
    if (state.submissions.length === 0) {
        refs.submissionList.innerHTML = `<div class="empty-state">${state.currentUser && !isAdmin() ? "Bu problem icin henuz kendi gonderimin yok." : "Bu problem icin henuz gonderim yok."}</div>`;
        return;
    }

    refs.submissionList.innerHTML = state.submissions.map((submission) => `
        <article class="submission-card">
            <h3>${escapeHtml(submission.status)}</h3>
            <div class="submission-card__meta">
                <span class="badge">${escapeHtml(submission.language)}</span>
                <span class="badge">${submission.passedTestCount}/${submission.totalTestCount} tests</span>
                <span class="badge">${submission.executionTime ?? 0} ms</span>
                <span class="badge">${submission.memoryUsage ?? 0} MB</span>
            </div>
            <p>Created: ${formatDate(submission.createdAt)}</p>
            ${submission.verdictMessage ? `<p>${escapeHtml(submission.verdictMessage)}</p>` : ""}
            ${state.currentUser ? `
                <div class="submission-card__actions">
                    ${submission.status !== "PENDING" ? `
                        <button type="button" class="button button--ghost button--small" data-resubmit-submission-id="${submission.id}">
                            Tekrar gonder
                        </button>
                    ` : ""}
                    <button type="button" class="button button--ghost button--small ${state.selectedCompareSubmission?.id === submission.id ? "button--soft" : ""}" data-compare-submission-id="${submission.id}">
                        ${state.selectedCompareSubmission?.id === submission.id ? "Secili baseline" : "Baseline sec"}
                    </button>
                    <button type="button" class="button button--ghost button--small" data-load-submission-id="${submission.id}">
                        Editor'e yukle
                    </button>
                </div>
            ` : ""}
        </article>
    `).join("");

    refs.submissionList.querySelectorAll("[data-load-submission-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void loadSubmissionIntoEditor(Number(button.dataset.loadSubmissionId), "Secilen gonderim");
        });
    });

    refs.submissionList.querySelectorAll("[data-resubmit-submission-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void resubmitExistingSubmission(Number(button.dataset.resubmitSubmissionId));
        });
    });

    refs.submissionList.querySelectorAll("[data-compare-submission-id]").forEach((button) => {
        button.addEventListener("click", () => {
            selectReplayBaseline(Number(button.dataset.compareSubmissionId));
        });
    });
}

async function submitSolution(event) {
    event.preventDefault();

    if (!state.selectedProblemId) {
        showFeedback("Once bir problem sec.", "error");
        return;
    }

    if (!state.currentUser || !state.authToken) {
        showFeedback("Gonderim icin once giris yap.", "error");
        return;
    }

    if (!isLanguageExecutionAvailable(refs.language.value)) {
        showFeedback(getLanguageExecutionMessage(refs.language.value) || "Secili dil bu ortamda hazir degil.", "error");
        return;
    }

    const payload = {
        problemId: state.selectedProblemId,
        language: refs.language.value,
        sourceCode: refs.sourceCode.value
    };

    try {
        refs.submitButton.disabled = true;
        refs.submitButton.textContent = "Submitting...";

        const submission = await fetchJson("/api/submissions", {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        if (submission.status === "PENDING") {
            showFeedback("PENDING | Submission queue'ya alindi. Verdict bekleniyor...", "idle");
            await selectProblem(state.selectedProblemId);
            void pollSubmissionUntilSettled(submission.id, state.selectedProblemId);
        } else {
            showFeedback(buildSubmissionFeedbackMessage(submission), submission.status === "ACCEPTED" ? "success" : "error");

            await Promise.all([
                selectProblem(state.selectedProblemId),
                loadUserDashboard(),
                loadGlobalLeaderboard()
            ]);
        }
    } catch (error) {
        showFeedback(error.message, "error");
    } finally {
        refs.submitButton.disabled = false;
        refs.submitButton.textContent = "Submit";
    }
}

async function resubmitExistingSubmission(submissionId) {
    if (!state.currentUser || !state.authToken) {
        showFeedback("Bu islem icin once giris yap.", "error");
        return;
    }

    try {
        const submission = await fetchJson(`/api/submissions/${submissionId}/resubmit`, {
            method: "POST",
            headers: authHeaders()
        });

        if (submission.status === "PENDING") {
            showFeedback("PENDING | Submission tekrar queue'ya alindi. Verdict bekleniyor...", "idle");
            await selectProblem(state.selectedProblemId);
            void pollSubmissionUntilSettled(submission.id, state.selectedProblemId);
            return;
        }

        showFeedback(
            buildSubmissionFeedbackMessage(submission),
            submission.status === "ACCEPTED" ? "success" : "error"
        );

        await Promise.all([
            selectProblem(state.selectedProblemId),
            loadUserDashboard(),
            loadGlobalLeaderboard()
        ]);
    } catch (error) {
        showFeedback(error.message, "error");
    }
}

async function login(event) {
    event.preventDefault();

    const credentials = readAuthCredentials();
    if (!credentials) {
        showAuthFeedback("Username ve password gerekli.", "error");
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

        applyAuthResponse(response, `${response.username} olarak giris yapildi.`);
        await Promise.all([
            loadProblems(state.selectedProblemId),
            loadGlobalLeaderboard()
        ]);
        await refreshSelectedUserProfile();
    } catch (error) {
        showAuthFeedback(error.message, "error");
    }
}

async function register() {
    const credentials = readAuthCredentials();
    if (!credentials) {
        showAuthFeedback("Register icin username ve password gerekli.", "error");
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

        applyAuthResponse(response, `${response.username} hesabi olusturuldu.`);
        await Promise.all([
            loadProblems(state.selectedProblemId),
            loadGlobalLeaderboard()
        ]);
        await refreshSelectedUserProfile();
    } catch (error) {
        showAuthFeedback(error.message, "error");
    }
}

async function logout() {
    clearAuthState(true);
    await Promise.all([
        loadProblems(state.selectedProblemId),
        loadGlobalLeaderboard()
    ]);
    await refreshSelectedUserProfile();
}

async function createProblem(event) {
    event.preventDefault();

    if (!isAdmin()) {
        showAuthorFeedback("Problem olusturmak icin admin olman gerekir.", "error");
        return;
    }

    try {
        const payload = readProblemPayload();
        const problem = await fetchJson("/api/problems", {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        refs.problemCreateForm.reset();
        refs.problemCreateDifficulty.value = "EASY";
        refs.problemCreateTimeLimit.value = String(DEFAULT_TIME_LIMIT_MS);
        refs.problemCreateMemoryLimit.value = String(DEFAULT_MEMORY_LIMIT_MB);
        showAuthorFeedback(`Problem olusturuldu: ${problem.title}`, "success");
        await loadProblems(problem.id);
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

async function createTestCase(event) {
    event.preventDefault();

    if (!isAdmin()) {
        showAuthorFeedback("Test case eklemek icin admin olman gerekir.", "error");
        return;
    }

    if (!state.selectedProblemId) {
        showAuthorFeedback("Once bir problem sec.", "error");
        return;
    }

    const payload = {
        input: refs.testCaseInput.value,
        expectedOutput: refs.testCaseExpectedOutput.value,
        hidden: refs.testCaseHidden.checked
    };

    try {
        const isEditing = Boolean(state.editingTestCaseId);
        const url = isEditing
            ? `/api/problems/${state.selectedProblemId}/testcases/${state.editingTestCaseId}`
            : `/api/problems/${state.selectedProblemId}/testcases`;

        await fetchJson(url, {
            method: isEditing ? "PUT" : "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        resetTestCaseEditor();
        showAuthorFeedback(isEditing ? "Test case guncellendi." : "Test case kaydedildi.", "success");
        await selectProblem(state.selectedProblemId);
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

function applyStarterTemplate(options = {}) {
    const nextSource = selectedProblemStarterCode(refs.language.value);
    const shouldConfirm = Boolean(options.confirmOverwrite)
        && refs.sourceCode.value.trim()
        && refs.sourceCode.value !== nextSource;

    if (shouldConfirm) {
        const confirmed = window.confirm("Starter code editor'e yuklensin mi? Mevcut bu dil taslagi degisecek.");
        if (!confirmed) {
            return;
        }
    }

    refs.sourceCode.value = nextSource;
    state.editorLanguageContext = refs.language.value;
    persistDraftForContext(state.selectedProblemId, refs.language.value, refs.sourceCode.value);
    renderDraftStatus();
}

function updateEditorNote() {
    const timeLimitMs = state.selectedProblem?.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS;
    const memoryLimitMb = state.selectedProblem?.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB;
    const runtimeMessage = getLanguageExecutionMessage(refs.language.value);

    if (runtimeMessage && !isLanguageExecutionAvailable(refs.language.value)) {
        refs.editorNote.textContent = `${refs.language.value} su anda kullanilamiyor. ${runtimeMessage}`;
        renderEditorLanguageRecommendation();
        renderEditorRuntimeAssist();
        return;
    }

    if (refs.language.value === "JAVA") {
        refs.editorNote.textContent = `JAVA gercek derlenir. Hedef limitler: ${timeLimitMs} ms / ${memoryLimitMb} MB. Beklenen format: Solution.solve(...) veya Solution.main(...).`;
        renderEditorLanguageRecommendation();
        renderEditorRuntimeAssist();
        return;
    }

    if (refs.language.value === "PYTHON") {
        refs.editorNote.textContent = `PYTHON gercek calisir. Hedef limitler: ${timeLimitMs} ms / ${memoryLimitMb} MB. stdin oku ve sonucu stdout'a yazdir.`;
        renderEditorLanguageRecommendation();
        renderEditorRuntimeAssist();
        return;
    }

    refs.editorNote.textContent = `CPP gercek derlenir. Hedef limitler: ${timeLimitMs} ms / ${memoryLimitMb} MB. stdin oku ve sonucu stdout'a yazdir.`;
    renderEditorLanguageRecommendation();
    renderEditorRuntimeAssist();
}

function renderEditorLanguageRecommendation() {
    const container = refs.editorLanguageRecommendation;
    if (!container) {
        return;
    }

    const recommendation = resolveEditorLanguageRecommendation();
    if (!recommendation) {
        container.hidden = true;
        container.innerHTML = "";
        return;
    }

    const currentLanguage = refs.language.value;
    const active = recommendation.language === currentLanguage;
    container.hidden = false;
    container.innerHTML = `
        <span class="badge badge--accent-soft">${active ? "Recommended active" : "Recommended now"}</span>
        <p class="editor-language-recommendation__copy">
            <strong>${escapeHtml(recommendation.language)}</strong>
            ${escapeHtml(recommendation.reason)}.
        </p>
        ${active ? "" : `
            <button
                type="button"
                class="button button--ghost button--small"
                data-editor-recommended-language="${escapeHtml(recommendation.language)}">
                ${escapeHtml(recommendation.actionLabel || `Use ${recommendation.language}`)}
            </button>
        `}
    `;
}

function renderEditorRuntimeAssist() {
    const assist = refs.editorRuntimeAssist;
    if (!assist) {
        return;
    }

    const missingToolchains = getMissingLocalToolchains();
    const currentLanguage = refs.language.value;
    const currentAvailable = isLanguageExecutionAvailable(currentLanguage);
    const alternateLanguage = currentAvailable ? null : getFirstAvailableLanguage(currentLanguage);

    if (missingToolchains.length === 0) {
        assist.hidden = true;
        assist.innerHTML = "";
        return;
    }

    const lead = currentAvailable
        ? `${currentLanguage} ile devam edebilirsin. Eksik runtime'lari acmak icin hizli fix aksiyonlari hazir.`
        : `${currentLanguage} bu ortamda hazir degil. Alternatif bir dile gecebilir veya kurulum komutunu kopyalayabilirsin.`;

    const switchAction = alternateLanguage
        ? `<button type="button" class="button button--ghost button--small" data-editor-runtime-switch-language="${escapeHtml(alternateLanguage)}">Use ${escapeHtml(alternateLanguage)}</button>`
        : "";
    const fixActions = missingToolchains
        .filter((toolchain) => toolchain.setupCommand)
        .map((toolchain) => `
            <button
                type="button"
                class="button button--ghost button--small"
                data-copy-runtime-command="${escapeHtml(toolchain.setupCommand)}"
                data-copy-runtime-language="${escapeHtml(toolchain.language || "Runtime")}">
                Copy ${escapeHtml(toolchain.language || "fix")} fix
            </button>
        `)
        .join("");

    assist.hidden = false;
    assist.innerHTML = `
        <p class="editor-runtime-assist__copy">${escapeHtml(lead)}</p>
        <div class="workspace-card__actions">
            ${switchAction}
            ${fixActions}
            <button
                type="button"
                class="button button--ghost button--small"
                data-runner-health-refresh
                ${state.runnerHealthRefreshing ? "disabled" : ""}>
                ${state.runnerHealthRefreshing ? "Refreshing..." : "Refresh runtime"}
            </button>
        </div>
    `;
}

function renderProblemEmptyState(message = "Henuz listelenecek problem yok.") {
    flushDraftSaveTimer();
    state.selectedProblemId = null;
    state.selectedProblem = null;
    state.problemLeaderboard = null;
    state.problemStats = null;
    state.workspaceSummary = null;
    state.visibleTestCases = [];
    state.submissions = [];
    state.adminTestCases = [];
    state.editingTestCaseId = null;
    refs.problemTitle.textContent = "Problem bekleniyor";
    refs.problemDifficulty.textContent = "-";
    refs.problemDifficulty.className = "difficulty difficulty--muted";
    refs.problemDescription.textContent = message;
    refs.problemConstraints.textContent = "Constraint bilgisi yok.";
    refs.problemInputFormat.textContent = "Input format bilgisi yok.";
    refs.problemOutputFormat.textContent = "Output format bilgisi yok.";
    refs.problemHintHeading.textContent = "Hint";
    refs.problemHintState.textContent = "Ilk gonderimden sonra acilir.";
    refs.problemHint.innerHTML = `<div class="empty-state">Hint bilgisi yok.</div>`;
    refs.problemEditorialHeading.textContent = "Editorial";
    refs.problemEditorialState.textContent = "Accepted gonderimden sonra acilir.";
    refs.problemEditorial.innerHTML = `<div class="empty-state">Editorial bilgisi yok.</div>`;
    refs.problemLeaderboardCard.innerHTML = `<div class="empty-state">Problem leaderboard verisi yok.</div>`;
    renderProblemBookmarkButton();
    refs.visibleTestcaseCount.textContent = "0";
    refs.submissionCount.textContent = "0";
    refs.viewerStatus.textContent = "Login";
    refs.problemTimeLimit.textContent = `${DEFAULT_TIME_LIMIT_MS} ms`;
    refs.problemMemoryLimit.textContent = `${DEFAULT_MEMORY_LIMIT_MB} MB`;
    refs.problemTags.innerHTML = `<div class="empty-state">Tag yok.</div>`;
    refs.problemExampleList.innerHTML = `<div class="empty-state">Gosterilecek ornek yok.</div>`;
    refs.sampleList.innerHTML = `<div class="empty-state">${message}</div>`;
    refs.submissionList.innerHTML = `<div class="empty-state">Gosterilecek gonderim yok.</div>`;
    refs.workspaceSummaryCard.innerHTML = `<div class="empty-state">Workspace bilgisi yok.</div>`;
    refs.workspaceDebugCard.innerHTML = `<div class="empty-state">Failure diagnostigi yok.</div>`;
    refs.submissionPanelEyebrow.textContent = "Akis";
    refs.submissionPanelTitle.textContent = "Son Gonderimler";
    resetReplayPanel();
    renderProblemFacets();
    renderUserDashboard();
    renderProgressSummary();
    renderDraftStatus();
    clearProblemForm();
    resetTestCaseEditor();
    renderAdminPanel();
}

function renderAuthState() {
    const isAuthenticated = Boolean(state.currentUser && state.authToken);

    refs.authForm.hidden = isAuthenticated;
    refs.authCurrent.hidden = !isAuthenticated;
    refs.authStatus.textContent = isAuthenticated ? "Oturum acik" : "Giris yap";
    refs.authCurrentUsername.textContent = state.currentUser?.username ?? "-";
    refs.authCurrentRole.textContent = state.currentUser?.role ?? "-";
    if (isAuthenticated && isAdmin() && state.selectedProblem) {
        populateProblemForm(state.selectedProblem);
    }
    renderAdminPanel();
    renderUserDashboard();
    renderGlobalLeaderboard();
    renderProblemLeaderboard();
    renderProblemStats();
    renderProblemBookmarkButton();
    renderReplayBaseline();
    renderReplayComparison();
    renderDraftStatus();
}

function renderAdminPanel() {
    const adminMode = isAdmin();
    refs.adminPanel.hidden = !adminMode;
    renderCatalogHealth();
    renderAuthoringFocusCard();

    if (!adminMode) {
        return;
    }

    refs.adminSelectedProblem.textContent = state.selectedProblem?.title ?? "-";
    refs.adminSelectedTestCase.textContent = state.editingTestCaseId ? `#${state.editingTestCaseId}` : "Yeni kayit";
    refs.testCaseSubmitButton.textContent = state.editingTestCaseId ? "Test Case Guncelle" : "Test Case Kaydet";
    refs.testCaseSubmitButton.disabled = !state.selectedProblemId;
    refs.testCaseCancelButton.hidden = !state.editingTestCaseId;
    refs.problemUpdateButton.disabled = !state.selectedProblemId;
    refs.problemDeleteButton.disabled = !state.selectedProblemId;

    if (state.adminTestCases.length === 0) {
        refs.adminTestCaseList.innerHTML = `<div class="empty-state">Admin gorunumu icin listelenecek testcase yok.</div>`;
        return;
    }

    refs.adminTestCaseList.innerHTML = state.adminTestCases.map((testCase, index) => `
        <article class="sample-card sample-card--admin">
            <div class="sample-card__header">
                <strong>Case ${index + 1} ${testCase.hidden ? "<span class=\"badge\">HIDDEN</span>" : "<span class=\"badge\">PUBLIC</span>"}</strong>
                <div class="sample-card__actions">
                    <button type="button" class="button button--ghost button--small" data-edit-testcase-id="${testCase.id}">Duzenle</button>
                    <button type="button" class="button button--ghost button--small button--danger" data-delete-testcase-id="${testCase.id}">Sil</button>
                </div>
            </div>
            <p><code>input: ${escapeHtml(testCase.input)}</code></p>
            <p><code>expected: ${escapeHtml(testCase.expectedOutput)}</code></p>
        </article>
    `).join("");

    refs.adminTestCaseList.querySelectorAll("[data-edit-testcase-id]").forEach((button) => {
        button.addEventListener("click", () => beginEditTestCase(Number(button.dataset.editTestcaseId)));
    });

    refs.adminTestCaseList.querySelectorAll("[data-delete-testcase-id]").forEach((button) => {
        button.addEventListener("click", () => deleteTestCase(Number(button.dataset.deleteTestcaseId)));
    });
}

function renderAuthoringFocusCard() {
    if (!isAdmin()) {
        refs.authoringFocusCard.innerHTML = `<div class="empty-state">Authoring Priorities yalnizca admin oturumunda gorunur.</div>`;
        return;
    }

    if (!state.selectedProblem) {
        refs.authoringFocusCard.innerHTML = `<div class="empty-state">Bir problem sec; eksik alanlara hizli gecis burada cikacak.</div>`;
        return;
    }

    const attentionProblem = findCatalogAttentionProblem(state.selectedProblemId);
    const attentionFlags = attentionProblem?.attentionFlags || [];
    const nextAttentionProblem = resolveNextAttentionProblem();

    refs.authoringFocusCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Authoring Priorities</p>
                <h3>${escapeHtml(state.selectedProblem.title || "Selected problem")}</h3>
            </div>
            <span class="badge ${attentionFlags.length === 0 ? "badge--accent-soft" : ""}">${attentionFlags.length === 0 ? "Healthy" : `${attentionFlags.length} gaps`}</span>
        </div>
        ${nextAttentionProblem ? `
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Next weak problem</p>
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-authoring-next-problem-id="${nextAttentionProblem.problemId}">
                    <strong>${escapeHtml(nextAttentionProblem.title || "Problem")}</strong>
                    <p>${escapeHtml(nextAttentionProblem.difficulty || "-")} | ${(nextAttentionProblem.attentionFlags || []).length} gap</p>
                    <span>${escapeHtml((nextAttentionProblem.attentionFlags || []).slice(0, 2).map((flag) => formatCatalogAttentionFlag(flag)).join(" • "))}</span>
                </article>
            </div>
        ` : ""}
        ${attentionFlags.length > 0 ? `
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Jump to missing pieces</p>
                <div class="workspace-card__breakdown">
                    ${attentionFlags.map((flag) => `
                        <button
                            type="button"
                            class="button button--ghost button--small"
                            data-authoring-gap-flag="${escapeHtml(flag)}">
                            ${escapeHtml(formatCatalogAttentionFlag(flag))}
                        </button>
                    `).join("")}
                </div>
            </div>
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Suggested scaffolds</p>
                <div class="workspace-card__breakdown">
                    ${attentionFlags.map((flag) => `
                        <button
                            type="button"
                            class="button button--ghost button--small"
                            data-authoring-scaffold-flag="${escapeHtml(flag)}">
                            ${escapeHtml(formatAuthoringScaffoldLabel(flag))}
                        </button>
                    `).join("")}
                </div>
            </div>
        ` : `
            <p class="workspace-card__lead">Bu problem mevcut kalite esigine gore saglikli gorunuyor. Yine de yeni edge case veya daha guclu editorial eklemek istersen form hazir.</p>
        `}
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Quick jumps</p>
            <div class="workspace-card__breakdown">
                <button type="button" class="button button--ghost button--small" data-authoring-manual-target="STATEMENT">Statement</button>
                <button type="button" class="button button--ghost button--small" data-authoring-manual-target="EXAMPLES">Examples</button>
                <button type="button" class="button button--ghost button--small" data-authoring-manual-target="HINT">Hint</button>
                <button type="button" class="button button--ghost button--small" data-authoring-manual-target="EDITORIAL">Editorial</button>
                <button type="button" class="button button--ghost button--small" data-authoring-manual-target="TESTCASE">Testcases</button>
            </div>
        </div>
    `;

    refs.authoringFocusCard.querySelectorAll("[data-authoring-gap-flag]").forEach((button) => {
        button.addEventListener("click", () => {
            focusAuthoringTarget(button.dataset.authoringGapFlag);
        });
    });

    refs.authoringFocusCard.querySelectorAll("[data-authoring-scaffold-flag]").forEach((button) => {
        button.addEventListener("click", () => {
            applyAuthoringScaffold(button.dataset.authoringScaffoldFlag);
        });
    });

    refs.authoringFocusCard.querySelectorAll("[data-authoring-manual-target]").forEach((button) => {
        button.addEventListener("click", () => {
            focusAuthoringTarget(button.dataset.authoringManualTarget);
        });
    });

    refs.authoringFocusCard.querySelectorAll("[data-authoring-next-problem-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void selectProblem(Number(button.dataset.authoringNextProblemId));
        });
    });
}

function renderCatalogHealth() {
    if (!isAdmin()) {
        refs.catalogHealthCard.innerHTML = `<div class="empty-state">Catalog Health yalnizca admin oturumunda gorunur.</div>`;
        return;
    }

    const health = state.catalogHealth;
    if (!health) {
        refs.catalogHealthCard.innerHTML = `<div class="empty-state">Katalog sagligi yukleniyor.</div>`;
        return;
    }

    const problemsByDifficulty = Object.entries(health.problemsByDifficulty || {});
    const attentionProblems = health.attentionProblems || [];
    const attentionBreakdown = buildCatalogAttentionBreakdown();
    const focusedAttentionProblems = attentionProblems.filter(matchesCatalogAttentionProblem);
    const activeAttentionLabel = state.adminAttentionFilter === "ALL"
        ? "Tum problemler"
        : state.adminAttentionFilter === "ATTENTION"
            ? "Need attention"
            : formatCatalogAttentionFlag(state.adminAttentionFilter);

    refs.catalogHealthCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Catalog Health</p>
                <h3>Content Coverage</h3>
            </div>
            <span class="badge">${state.adminAttentionFilter === "ALL" ? `${health.problemsNeedingAttention ?? 0} attention` : activeAttentionLabel}</span>
        </div>
        <div class="dashboard-card__grid">
            <article class="dashboard-card__stat">
                <span>Problems</span>
                <strong>${health.totalProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Healthy</span>
                <strong>${health.healthyProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Public cases</span>
                <strong>${health.publicTestCases ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Hidden cases</span>
                <strong>${health.hiddenTestCases ?? 0}</strong>
            </article>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Difficulty mix</p>
            <div class="workspace-card__breakdown">
                ${problemsByDifficulty.map(([difficulty, count]) => `<span class="badge ${difficultyClass(difficulty)}">${escapeHtml(difficulty)}: ${count}</span>`).join("")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Attention focus</p>
            <div class="filter-group">
                ${renderAdminAttentionButton("ALL", "Tum problemler")}
                ${renderAdminAttentionButton("ATTENTION", `Need attention (${health.problemsNeedingAttention ?? 0})`)}
                ${attentionBreakdown.length > 0
                    ? attentionBreakdown.map(([flag, count]) => renderAdminAttentionButton(flag, `${formatCatalogAttentionFlag(flag)} (${count})`)).join("")
                    : `<span class="badge">Attention yok</span>`}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Attention queue</p>
            ${focusedAttentionProblems.length > 0 ? `
                <div class="dashboard-card__list">
                    ${focusedAttentionProblems.map((problem) => `
                        <article class="dashboard-card__item dashboard-card__item--attention dashboard-card__item--interactive" data-admin-problem-id="${problem.problemId}">
                            <strong>${escapeHtml(problem.title || "Problem")}</strong>
                            <p>${escapeHtml(problem.difficulty || "-")} | ${problem.totalTestCases ?? 0} total | ${problem.publicTestCases ?? 0} public | ${problem.hiddenTestCases ?? 0} hidden | ${problem.exampleCount ?? 0} examples</p>
                            <div class="workspace-card__breakdown">
                                ${(problem.attentionFlags || []).map((flag) => `
                                    <button
                                        type="button"
                                        class="button button--ghost button--small ${state.adminAttentionFilter === flag ? "button--soft" : ""}"
                                        data-admin-gap-problem-id="${problem.problemId}"
                                        data-admin-gap-flag="${escapeHtml(flag)}">
                                        ${escapeHtml(formatCatalogAttentionFlag(flag))}
                                    </button>
                                `).join("")}
                            </div>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">${state.adminAttentionFilter === "ALL" ? "Su an belirgin dikkat isteyen problem gorunmuyor." : "Bu focus icin queue bos gorunuyor."}</p>`}
        </div>
    `;

    refs.catalogHealthCard.querySelectorAll("[data-admin-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void selectProblem(Number(entry.dataset.adminProblemId));
        });
    });

    refs.catalogHealthCard.querySelectorAll("[data-admin-attention-filter]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            setAdminAttentionFilter(button.dataset.adminAttentionFilter);
        });
    });

    refs.catalogHealthCard.querySelectorAll("[data-admin-gap-flag]").forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.stopPropagation();
            await openAuthoringGap(
                Number(button.dataset.adminGapProblemId),
                button.dataset.adminGapFlag
            );
        });
    });
}

function showFeedback(message, type = "idle") {
    refs.submissionFeedback.textContent = message;
    refs.submissionFeedback.className = `feedback feedback--${type}`;
}

function showAuthFeedback(message, type = "idle") {
    refs.authFeedback.textContent = message;
    refs.authFeedback.className = `auth-feedback auth-feedback--${type}`;
}

async function pollSubmissionUntilSettled(submissionId, problemId) {
    for (let attempt = 0; attempt < SUBMISSION_POLL_MAX_ATTEMPTS; attempt += 1) {
        await wait(SUBMISSION_POLL_INTERVAL_MS);

        let detail;
        try {
            detail = await fetchJson(`/api/submissions/${submissionId}`, {
                headers: authHeaders()
            });
        } catch (error) {
            showFeedback(`Submission durumu alinamadi: ${error.message}`, "error");
            return;
        }

        if (detail.status !== "PENDING") {
            showFeedback(
                buildSubmissionFeedbackMessage(detail),
                detail.status === "ACCEPTED" ? "success" : "error"
            );

            await Promise.all([
                state.selectedProblemId === problemId ? selectProblem(problemId) : Promise.resolve(),
                loadUserDashboard(),
                loadGlobalLeaderboard()
            ]);
            return;
        }
    }

    showFeedback("Submission hala queue'da. Biraz sonra tekrar bakabilir ya da listeyi yenileyebilirsin.", "idle");
    if (state.selectedProblemId === problemId) {
        await selectProblem(problemId);
    }
}

function buildSubmissionFeedbackMessage(submission) {
    return [
        submission.status,
        typeof submission.passedTestCount === "number" && typeof submission.totalTestCount === "number"
            ? `${submission.passedTestCount}/${submission.totalTestCount} tests`
            : null,
        typeof submission.executionTime === "number" ? `${submission.executionTime} ms` : null,
        typeof submission.memoryUsage === "number" ? `${submission.memoryUsage} MB` : null,
        submission.verdictMessage
    ].filter(Boolean).join(" | ");
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        if (body && typeof body === "object") {
            throw new Error(body.error || Object.values(body).join(", ") || "Bir hata olustu.");
        }
        throw new Error(typeof body === "string" && body ? body : "Bir hata olustu.");
    }

    return body;
}

function wait(durationMs) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

function readAuthCredentials() {
    const username = refs.authUsername.value.trim();
    const password = refs.authPassword.value;

    if (!username || !password) {
        return null;
    }

    return { username, password };
}

function applyAuthResponse(response, message) {
    state.authToken = response.token;
    state.currentUser = {
        userId: response.userId,
        username: response.username,
        role: response.role
    };
    state.adminAttentionFilter = "ALL";
    state.catalogHealth = null;
    state.globalLeaderboard = null;
    state.problemLeaderboard = null;

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, state.authToken);
    refs.authPassword.value = "";
    renderAuthState();
    showAuthFeedback(message, "success");
}

function clearAuthState(showMessage) {
    clearPendingDashboardRefresh();
    state.authToken = null;
    state.currentUser = null;
    state.catalogHealth = null;
    state.userDashboard = null;
    state.globalLeaderboard = null;
    state.problemLeaderboard = null;
    state.problemScope = "ALL";
    state.problemDifficultyFilter = "ALL";
    state.problemTagFilter = "ALL";
    state.adminAttentionFilter = "ALL";
    state.adminTestCases = [];
    state.editingTestCaseId = null;
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    resetReplayPanel();
    renderAuthState();

    if (showMessage) {
        showAuthFeedback("Oturum kapatildi.", "idle");
    }
}

function authHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (state.authToken) {
        headers.Authorization = `Bearer ${state.authToken}`;
    }
    return headers;
}

function showAuthorFeedback(message, type = "idle") {
    refs.authorFeedback.textContent = message;
    refs.authorFeedback.className = `feedback feedback--${type}`;
}

async function updateProblem() {
    if (!isAdmin()) {
        showAuthorFeedback("Problem guncellemek icin admin olman gerekir.", "error");
        return;
    }

    if (!state.selectedProblemId) {
        showAuthorFeedback("Guncellenecek bir problem sec.", "error");
        return;
    }

    try {
        const payload = readProblemPayload();
        const updatedProblem = await fetchJson(`/api/problems/${state.selectedProblemId}`, {
            method: "PUT",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        showAuthorFeedback(`Problem guncellendi: ${updatedProblem.title}`, "success");
        await loadProblems(updatedProblem.id);
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

async function deleteProblem() {
    if (!isAdmin()) {
        showAuthorFeedback("Problem silmek icin admin olman gerekir.", "error");
        return;
    }

    if (!state.selectedProblemId || !state.selectedProblem) {
        showAuthorFeedback("Silinecek bir problem sec.", "error");
        return;
    }

    const confirmed = window.confirm(`"${state.selectedProblem.title}" silinsin mi? Submission varsa islem engellenir.`);
    if (!confirmed) {
        return;
    }

    try {
        await fetchJson(`/api/problems/${state.selectedProblemId}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        showAuthorFeedback("Problem silindi.", "success");
        await loadProblems();
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

async function bulkCreateProblems(event) {
    event.preventDefault();

    if (!isAdmin()) {
        showAuthorFeedback("Problem bulk import icin admin olman gerekir.", "error");
        return;
    }

    let problems;
    try {
        const parsed = JSON.parse(refs.problemBulkPayload.value);
        const rawProblems = Array.isArray(parsed) ? parsed : parsed?.problems;
        if (!Array.isArray(rawProblems) || rawProblems.length === 0) {
            throw new Error("JSON array veya { problems: [] } bekleniyor.");
        }

        problems = rawProblems.map((problem) => normalizeProblemPayload(problem));
    } catch (error) {
        showAuthorFeedback(error.message || "Problem bulk payload parse edilemedi.", "error");
        return;
    }

    try {
        const createdProblems = await fetchJson("/api/problems/bulk", {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({ problems })
        });

        refs.problemBulkForm.reset();
        showAuthorFeedback(`${createdProblems.length} problem import edildi.`, "success");
        await loadProblems(createdProblems[0]?.id ?? state.selectedProblemId);
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

async function bulkCreateTestCases(event) {
    event.preventDefault();

    if (!isAdmin()) {
        showAuthorFeedback("Bulk import icin admin olman gerekir.", "error");
        return;
    }

    if (!state.selectedProblemId) {
        showAuthorFeedback("Once bir problem sec.", "error");
        return;
    }

    let payload;
    try {
        const parsed = JSON.parse(refs.testCaseBulkPayload.value);
        const testCases = Array.isArray(parsed) ? parsed : parsed?.testCases;
        if (!Array.isArray(testCases) || testCases.length === 0) {
            throw new Error("JSON array veya { testCases: [] } bekleniyor.");
        }

        payload = {
            testCases: testCases.map((testCase) => ({
                input: String(testCase.input ?? ""),
                expectedOutput: String(testCase.expectedOutput ?? ""),
                hidden: Boolean(testCase.hidden)
            }))
        };
    } catch (error) {
        showAuthorFeedback(error.message || "Bulk JSON parse edilemedi.", "error");
        return;
    }

    try {
        const created = await fetchJson(`/api/problems/${state.selectedProblemId}/testcases/bulk`, {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        refs.testCaseBulkForm.reset();
        showAuthorFeedback(`${created.length} test case import edildi.`, "success");
        await selectProblem(state.selectedProblemId);
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

function beginEditTestCase(testCaseId) {
    const testCase = state.adminTestCases.find((entry) => entry.id === testCaseId);
    if (!testCase) {
        showAuthorFeedback("Test case bulunamadi.", "error");
        return;
    }

    state.editingTestCaseId = testCaseId;
    refs.testCaseInput.value = testCase.input;
    refs.testCaseExpectedOutput.value = testCase.expectedOutput;
    refs.testCaseHidden.checked = Boolean(testCase.hidden);
    renderAdminPanel();
}

async function deleteTestCase(testCaseId) {
    if (!isAdmin()) {
        showAuthorFeedback("Test case silmek icin admin olman gerekir.", "error");
        return;
    }

    const confirmed = window.confirm(`Test case #${testCaseId} silinsin mi?`);
    if (!confirmed) {
        return;
    }

    try {
        await fetchJson(`/api/problems/${state.selectedProblemId}/testcases/${testCaseId}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (state.editingTestCaseId === testCaseId) {
            resetTestCaseEditor();
        }

        showAuthorFeedback("Test case silindi.", "success");
        await selectProblem(state.selectedProblemId);
    } catch (error) {
        showAuthorFeedback(error.message, "error");
    }
}

function readProblemPayload() {
    const payload = {
        title: refs.problemCreateTitle.value.trim(),
        description: refs.problemCreateDescription.value.trim(),
        constraints: refs.problemCreateConstraints.value.trim() || null,
        inputFormat: refs.problemCreateInputFormat.value.trim() || null,
        outputFormat: refs.problemCreateOutputFormat.value.trim() || null,
        hintTitle: refs.problemCreateHintTitle.value.trim() || null,
        hintContent: refs.problemCreateHintContent.value.trim() || null,
        editorialTitle: refs.problemCreateEditorialTitle.value.trim() || null,
        editorialContent: refs.problemCreateEditorialContent.value.trim() || null,
        difficulty: refs.problemCreateDifficulty.value,
        timeLimitMs: Number(refs.problemCreateTimeLimit.value || DEFAULT_TIME_LIMIT_MS),
        memoryLimitMb: Number(refs.problemCreateMemoryLimit.value || DEFAULT_MEMORY_LIMIT_MB),
        tags: refs.problemCreateTags.value,
        examples: parseExamplesJson(refs.problemCreateExamples.value),
        starterCodes: parseStarterCodesJson(refs.problemCreateStarterCodes.value)
    };

    return normalizeProblemPayload(payload);
}

function populateProblemForm(problem) {
    if (!problem) {
        clearProblemForm();
        return;
    }

    refs.problemCreateTitle.value = problem.title ?? "";
    refs.problemCreateDescription.value = problem.description ?? "";
    refs.problemCreateConstraints.value = problem.constraints ?? "";
    refs.problemCreateInputFormat.value = problem.inputFormat ?? "";
    refs.problemCreateOutputFormat.value = problem.outputFormat ?? "";
    refs.problemCreateHintTitle.value = problem.hintTitle ?? "";
    refs.problemCreateHintContent.value = problem.hintContent ?? "";
    refs.problemCreateEditorialTitle.value = problem.editorialTitle ?? "";
    refs.problemCreateEditorialContent.value = problem.editorialContent ?? "";
    refs.problemCreateDifficulty.value = problem.difficulty ?? "EASY";
    refs.problemCreateTimeLimit.value = String(problem.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS);
    refs.problemCreateMemoryLimit.value = String(problem.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB);
    refs.problemCreateTags.value = (problem.tags || []).join(", ");
    refs.problemCreateExamples.value = JSON.stringify(problem.examples || [], null, 2);
    refs.problemCreateStarterCodes.value = JSON.stringify(problem.starterCodes || {}, null, 2);
}

function clearProblemForm() {
    refs.problemCreateForm.reset();
    refs.problemCreateDifficulty.value = "EASY";
    refs.problemCreateTimeLimit.value = String(DEFAULT_TIME_LIMIT_MS);
    refs.problemCreateMemoryLimit.value = String(DEFAULT_MEMORY_LIMIT_MB);
}

function resetTestCaseEditor() {
    state.editingTestCaseId = null;
    refs.testCaseCreateForm.reset();
    renderAdminPanel();
}

function renderProblemTags() {
    const tags = state.selectedProblem?.tags || [];
    if (tags.length === 0) {
        refs.problemTags.innerHTML = `<div class="empty-state">Tag belirtilmedi.</div>`;
        return;
    }

    refs.problemTags.innerHTML = tags
        .map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`)
        .join("");
}

function renderProblemExamples() {
    const examples = state.selectedProblem?.examples || [];
    if (examples.length === 0) {
        refs.problemExampleList.innerHTML = `<div class="empty-state">Bu problem icin statement ornegi yok.</div>`;
        return;
    }

    refs.problemExampleList.innerHTML = examples.map((example, index) => `
        <article class="sample-card">
            <strong>Example ${index + 1}</strong>
            <p><code>input: ${escapeHtml(example.input)}</code></p>
            <p><code>output: ${escapeHtml(example.output)}</code></p>
            ${example.explanation ? `<p>${escapeHtml(example.explanation)}</p>` : ""}
        </article>
    `).join("");
}

function renderWorkspaceSummary() {
    if (!state.currentUser) {
        refs.submissionPanelEyebrow.textContent = "Public feed";
        refs.submissionPanelTitle.textContent = "Son Gonderimler";
        refs.workspaceSummaryCard.innerHTML = `
            <p class="workspace-card__lead">
                Giris yaptiginda bu problemdeki kendi deneme gecmisini, failure trend'ini ve son accepted kaydini goreceksin.
            </p>
        `;
        renderWorkspaceDiagnostics(null);
        renderReplayComparison();
        return;
    }

    refs.submissionPanelEyebrow.textContent = isAdmin() ? "Admin workspace" : "Senin workspace'in";
    refs.submissionPanelTitle.textContent = isAdmin() ? "Problem Gonderimleri" : "Kendi Gonderimlerin";

    const summary = state.workspaceSummary;
    if (!summary) {
        refs.workspaceSummaryCard.innerHTML = `<div class="empty-state">Workspace ozeti yuklenemedi.</div>`;
        renderWorkspaceDiagnostics(null);
        renderReplayComparison();
        return;
    }

    const failureEntries = Object.entries(summary.failureBreakdown || {});
    const lastAcceptedMeta = summary.lastAcceptedAt
        ? `Son accepted: ${formatDate(summary.lastAcceptedAt)} | ${summary.lastAcceptedLanguage ?? "-"} | ${summary.lastAcceptedExecutionTime ?? 0} ms | ${summary.lastAcceptedMemoryUsage ?? 0} MB`
        : "Henuz accepted gonderim yok.";
    const actionButtons = [
        summary.lastSubmissionId
            ? `<button type="button" class="button button--ghost button--small" data-load-latest-submission-id="${summary.lastSubmissionId}">Son denemeyi yukle</button>`
            : "",
        summary.lastAcceptedSubmissionId
            ? `<button type="button" class="button button--ghost button--small" data-resume-accepted-submission-id="${summary.lastAcceptedSubmissionId}">Accepted'dan devam et</button>`
            : ""
    ].filter(Boolean).join("");

    refs.workspaceSummaryCard.innerHTML = `
        <div class="workspace-card__grid">
            <article class="workspace-card__stat">
                <span>Attempts</span>
                <strong>${summary.attemptCount}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Last status</span>
                <strong>${escapeHtml(formatViewerStatus(summary.lastStatus))}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Solved</span>
                <strong>${summary.solved ? "Yes" : "No"}</strong>
            </article>
        </div>
        ${actionButtons ? `<div class="workspace-card__actions">${actionButtons}</div>` : ""}
        <p class="workspace-card__meta">${escapeHtml(lastAcceptedMeta)}</p>
        ${isAdmin() ? `<p class="workspace-card__lead">Workspace ozeti kendi hesabina ait, alttaki liste ise secili problemin gonderim akisidir.</p>` : ""}
        ${failureEntries.length > 0 ? `
            <div class="workspace-card__breakdown">
                ${failureEntries.map(([status, count]) => `<span class="badge ${statusPillClass(status)}">${escapeHtml(formatViewerStatus(status))}: ${count}</span>`).join("")}
            </div>
        ` : `<p class="workspace-card__lead">Failure trend henuz olusmadi.</p>`}
    `;

    refs.workspaceSummaryCard.querySelectorAll("[data-load-latest-submission-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void loadSubmissionIntoEditor(Number(button.dataset.loadLatestSubmissionId), "Son deneme");
        });
    });

    refs.workspaceSummaryCard.querySelectorAll("[data-resume-accepted-submission-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void loadSubmissionIntoEditor(Number(button.dataset.resumeAcceptedSubmissionId), "Accepted snapshot");
        });
    });

    renderWorkspaceDiagnostics(summary);
    renderReplayComparison();
}

function renderUserDashboard() {
    if (!state.currentUser) {
        refs.userDashboardCard.innerHTML = `
            <div class="empty-state">
                Giris yaptiginda genel ilerleme ozeti ve son solved problemler burada gorunecek.
            </div>
        `;
        return;
    }

    const dashboard = state.userDashboard;
    if (!dashboard) {
        refs.userDashboardCard.innerHTML = `<div class="empty-state">Dashboard yuklenemedi.</div>`;
        return;
    }

    const solvedByDifficulty = Object.entries(dashboard.solvedByDifficulty || {});
    const languageBreakdown = Object.entries(dashboard.languageBreakdown || {}).filter(([, count]) => count > 0);
    const continueAttempt = dashboard.continueAttempt;
    const suggestedProblem = dashboard.suggestedProblem;
    const recentAttempted = dashboard.recentAttempted || [];
    const recentPending = dashboard.recentPending || [];
    const recentBookmarked = dashboard.recentBookmarked || [];
    const recentAccepted = dashboard.recentAccepted || [];
    const recentActivity = dashboard.recentActivity || [];
    const achievements = dashboard.achievements || [];
    const journey = dashboard.journey;
    const journeyFocus = dashboard.journeyFocus;

    refs.userDashboardCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Your Dashboard</p>
                <h3>${escapeHtml(dashboard.username || "User")}</h3>
            </div>
            <div class="workspace-card__actions">
                <span class="badge">${dashboard.acceptanceRate ?? 0}% accepted</span>
                <button type="button" class="button button--ghost button--small" data-dashboard-profile-username="${escapeHtml(dashboard.username || "")}">Public profile</button>
            </div>
        </div>
        <div class="dashboard-card__grid">
            <article class="dashboard-card__stat">
                <span>Solved</span>
                <strong>${dashboard.solvedProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Attempts</span>
                <strong>${dashboard.totalSubmissions ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Pending</span>
                <strong>${dashboard.pendingSubmissions ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Remaining</span>
                <strong>${dashboard.remainingProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Saved</span>
                <strong>${dashboard.bookmarkedProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Main lang</span>
                <strong>${escapeHtml(dashboard.mostUsedLanguage || "-")}</strong>
            </article>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Momentum</p>
            <p class="workspace-card__lead">
                ${dashboard.activeDays ?? 0} active day | current streak ${dashboard.currentAcceptedStreakDays ?? 0} | best ${dashboard.longestAcceptedStreakDays ?? 0}
            </p>
            ${recentActivity.length > 0 ? `
                <div class="activity-strip">
                    ${recentActivity.map((entry) => `
                        <article class="activity-cell ${activityCellClass(entry)}">
                            <span>${escapeHtml(formatShortDate(entry.date))}</span>
                            <strong>${entry.submissions ?? 0}</strong>
                            <small>${entry.accepted ?? 0} acc</small>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Aktivite akisi henuz olusmadi.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Pending queue</p>
            ${recentPending.length > 0 ? `
                <p class="workspace-card__lead">Async judge calisiyor. Queue otomatik yenileniyor.</p>
                <div class="dashboard-card__list">
                    ${recentPending.map((entry) => `
                        <article
                            class="dashboard-card__item dashboard-card__item--interactive"
                            data-dashboard-problem-id="${entry.problemId}"
                            data-dashboard-submission-id="${entry.submissionId}"
                            data-dashboard-label="Pending queue">
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.language || "-")} | ${escapeHtml(formatViewerStatus(entry.status))} | ${formatDate(entry.lastActivityAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Bekleyen submission yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Journey</p>
            ${renderJourneySection(journey, "dashboard")}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Journey Focus</p>
            ${journeyFocus ? `
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-dashboard-problem-id="${journeyFocus.problemId}"
                    data-dashboard-language="${escapeHtml(journeyFocus.suggestedLanguage || "")}"
                    data-dashboard-prime-sample="true"
                    data-dashboard-label="Journey focus">
                    <strong>${escapeHtml(journeyFocus.problemTitle || "Problem")}</strong>
                    <p>${escapeHtml(journeyFocus.goalTitle || "Journey goal")} | ${escapeHtml(journeyFocus.difficulty || "-")} | ${escapeHtml(formatViewerStatus(journeyFocus.status))}</p>
                    <span>${escapeHtml(journeyFocus.reason || "")}</span>
                    ${journeyFocus.suggestedLanguage ? `<span class="badge badge--accent-soft">Try ${escapeHtml(journeyFocus.suggestedLanguage)}</span>` : ""}
                </article>
            ` : `<p class="workspace-card__lead">Journey hedefine gore ozel bir focus onerisi henuz yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Achievements</p>
            ${achievements.length > 0 ? `
                <div class="workspace-card__breakdown">
                    ${achievements.map((achievement) => `<span class="badge badge--accent-soft" title="${escapeHtml(achievement.description || "")}">${escapeHtml(achievement.title || "Badge")}</span>`).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Ilk accepted ile ilk rozetini acacaksin.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Continue where you left off</p>
            ${continueAttempt ? `
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-dashboard-problem-id="${continueAttempt.problemId}"
                    data-dashboard-submission-id="${continueAttempt.submissionId}"
                    data-dashboard-label="Continue attempt">
                    <strong>${escapeHtml(continueAttempt.problemTitle || "Problem")}</strong>
                    <p>${escapeHtml(continueAttempt.difficulty || "-")} | ${escapeHtml(formatViewerStatus(continueAttempt.status))} | ${escapeHtml(continueAttempt.language || "-")}</p>
                    <span>${formatDate(continueAttempt.lastActivityAt)}</span>
                </article>
            ` : `<p class="workspace-card__lead">Acik bir deneme akisi yok. Solved olmayan ilk problem siradaki aday olacak.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Suggested next</p>
            ${suggestedProblem ? `
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-dashboard-problem-id="${suggestedProblem.problemId}"
                    data-dashboard-label="Suggested problem">
                    <strong>${escapeHtml(suggestedProblem.problemTitle || "Problem")}</strong>
                    <p>${escapeHtml(suggestedProblem.difficulty || "-")} | ${escapeHtml(formatViewerStatus(suggestedProblem.status))}</p>
                </article>
            ` : `<p class="workspace-card__lead">Tum problemler solved gorunuyor.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Solved by difficulty</p>
            <div class="workspace-card__breakdown">
                ${solvedByDifficulty.map(([difficulty, count]) => `<span class="badge ${difficultyClass(difficulty)}">${escapeHtml(difficulty)}: ${count}</span>`).join("")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Recent attempted</p>
            ${recentAttempted.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentAttempted.map((entry) => `
                        <article
                            class="dashboard-card__item dashboard-card__item--interactive"
                            data-dashboard-problem-id="${entry.problemId}"
                            data-dashboard-submission-id="${entry.submissionId}"
                            data-dashboard-label="Recent attempt">
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(formatViewerStatus(entry.status))} | ${escapeHtml(entry.language || "-")} | ${formatDate(entry.lastActivityAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz solved olmayan deneme yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Saved queue</p>
            ${recentBookmarked.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentBookmarked.map((entry) => `
                        <article
                            class="dashboard-card__item dashboard-card__item--interactive"
                            data-dashboard-problem-id="${entry.problemId}"
                            data-dashboard-label="Saved queue">
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.difficulty || "-")} | ${escapeHtml(formatViewerStatus(entry.status))} | Saved ${formatDate(entry.bookmarkedAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Kaydedilen problem yok. Bir problemi Save for later ile kuyruğa ekleyebilirsin.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Language mix</p>
            ${languageBreakdown.length > 0
                ? `<div class="workspace-card__breakdown">${languageBreakdown.map(([language, count]) => `<span class="badge">${escapeHtml(language)}: ${count}</span>`).join("")}</div>`
                : `<p class="workspace-card__lead">Henuz submission yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Recent solved</p>
            ${recentAccepted.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentAccepted.map((entry) => `
                        <article class="dashboard-card__item ${entry.problemId ? "dashboard-card__item--interactive" : ""}" ${entry.problemId ? `data-dashboard-problem-id="${entry.problemId}"` : ""}>
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${formatDate(entry.acceptedAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz solved problem yok.</p>`}
        </div>
    `;

    refs.userDashboardCard.querySelectorAll("[data-dashboard-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void openDashboardProblem(
                Number(entry.dataset.dashboardProblemId),
                {
                    submissionId: entry.dataset.dashboardSubmissionId ? Number(entry.dataset.dashboardSubmissionId) : null,
                    label: entry.dataset.dashboardLabel || "Dashboard",
                    suggestedLanguage: entry.dataset.dashboardLanguage || null,
                    primeSample: entry.dataset.dashboardPrimeSample === "true"
                }
            );
        });
    });
    refs.userDashboardCard.querySelector("[data-dashboard-profile-username]")?.addEventListener("click", () => {
        void openUserProfile(dashboard.username, { scrollIntoView: true });
    });
}

function clearPendingDashboardRefresh() {
    if (state.pendingDashboardRefreshTimerId) {
        window.clearTimeout(state.pendingDashboardRefreshTimerId);
        state.pendingDashboardRefreshTimerId = null;
    }
}

function schedulePendingDashboardRefresh() {
    clearPendingDashboardRefresh();

    if (!state.currentUser || !state.userDashboard || (state.userDashboard.pendingSubmissions ?? 0) < 1) {
        return;
    }

    state.pendingDashboardRefreshTimerId = window.setTimeout(() => {
        state.pendingDashboardRefreshTimerId = null;
        void refreshPendingSubmissionViews();
    }, DASHBOARD_PENDING_REFRESH_MS);
}

async function refreshPendingSubmissionViews() {
    if (!state.currentUser || !state.authToken) {
        clearPendingDashboardRefresh();
        return;
    }

    const shouldRefreshSelectedProblem = Boolean(
        state.selectedProblemId && (
            state.workspaceSummary?.lastStatus === "PENDING"
            || (state.submissions || []).some((submission) => submission.status === "PENDING")
        )
    );

    await loadUserDashboard();

    if (shouldRefreshSelectedProblem && state.selectedProblemId) {
        await selectProblem(state.selectedProblemId);
    }

    if ((state.userDashboard?.pendingSubmissions ?? 0) === 0) {
        await loadGlobalLeaderboard();
    }
}

function renderDraftStatus() {
    if (!state.selectedProblemId) {
        refs.draftStatusCard.textContent = "Local Drafts secili problemde otomatik kaydedilir.";
        refs.draftStatusCard.className = "feedback feedback--idle";
        return;
    }

    const currentLanguage = refs.language.value;
    const currentDraft = getEditorDraft(state.selectedProblemId, currentLanguage);
    const draftLanguages = listProblemDraftLanguages(state.selectedProblemId);
    const alternateDrafts = draftLanguages.filter((entry) => entry.language !== currentLanguage);
    const summaryCopy = currentDraft
        ? `${currentLanguage} taslagi ${formatDate(currentDraft.updatedAt)} kaydedildi.`
        : "Bu dil icin kayitli taslak yok. Editori bosaltirsan mevcut taslak da silinir.";

    refs.draftStatusCard.innerHTML = `
        <div class="draft-status">
            <div class="draft-status__copy">
                <p class="workspace-debug__eyebrow">Local Drafts</p>
                <p>${escapeHtml(summaryCopy)}</p>
                ${alternateDrafts.length > 0 ? `
                    <div class="workspace-card__breakdown">
                        ${alternateDrafts.map((entry) => `
                            <button
                                type="button"
                                class="button button--ghost button--small"
                                data-load-problem-draft-language="${entry.language}">
                                ${escapeHtml(entry.language)} taslagi
                            </button>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
            <div class="workspace-card__actions">
                ${currentDraft ? `<button type="button" class="button button--ghost button--small" data-clear-current-draft>Bu dili temizle</button>` : ""}
                ${draftLanguages.length > 0 ? `<button type="button" class="button button--ghost button--small" data-clear-problem-drafts>Tum draftlari sil</button>` : ""}
            </div>
        </div>
    `;
    refs.draftStatusCard.className = `feedback feedback--${currentDraft ? "success" : "idle"}`;

    refs.draftStatusCard.querySelectorAll("[data-load-problem-draft-language]").forEach((button) => {
        button.addEventListener("click", () => {
            loadProblemDraftIntoEditor(state.selectedProblemId, button.dataset.loadProblemDraftLanguage);
        });
    });

    refs.draftStatusCard.querySelectorAll("[data-clear-current-draft]").forEach((button) => {
        button.addEventListener("click", () => {
            clearDraftForContext(state.selectedProblemId, refs.language.value, true);
        });
    });

    refs.draftStatusCard.querySelectorAll("[data-clear-problem-drafts]").forEach((button) => {
        button.addEventListener("click", () => {
            clearAllDraftsForProblem(state.selectedProblemId, true);
        });
    });
}

function renderProgressSummary() {
    if (!state.currentUser) {
        refs.progressSummary.innerHTML = `
            <p class="progress-summary__lead">
                Giris yaptiginda hangi problemleri cozdun ve hangilerinde kaldigini burada goreceksin.
            </p>
        `;
        return;
    }

    const solved = state.problems.filter((problem) => problem.viewerSolved).length;
    const attempted = state.problems.filter((problem) =>
        problem.viewerStatus
        && problem.viewerStatus !== "NOT_STARTED"
        && problem.viewerStatus !== "ACCEPTED"
    ).length;
    const bookmarked = state.problems.filter((problem) => problem.viewerBookmarked).length;
    const remaining = Math.max(state.problems.length - solved, 0);

    refs.progressSummary.innerHTML = `
        <div class="progress-summary__grid">
            <article class="progress-summary__card">
                <span>Solved</span>
                <strong>${solved}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Attempted</span>
                <strong>${attempted}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Remaining</span>
                <strong>${remaining}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Saved</span>
                <strong>${bookmarked}</strong>
            </article>
        </div>
        <div class="filter-group">
            ${renderProblemScopeButton("ALL", "Tum")}
            ${renderProblemScopeButton("REMAINING", "Remaining")}
            ${renderProblemScopeButton("ATTEMPTED", "Attempted")}
            ${renderProblemScopeButton("SOLVED", "Solved")}
            ${renderProblemScopeButton("BOOKMARKED", "Saved")}
        </div>
    `;

    refs.progressSummary.querySelectorAll("[data-problem-scope]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemScope(button.dataset.problemScope);
        });
    });
}

function resetReplayPanel() {
    state.selectedCompareSubmission = null;
    state.replayComparison = null;
    state.replayResult = null;
    refs.replayInput.value = "";
    refs.replayExpectedOutput.value = "";
    renderReplayBaseline();
    renderReplayResult(null);
    renderReplayComparison();
}

function loadReplayFromCase(input, expectedOutput, label) {
    state.replayComparison = null;
    state.replayResult = null;
    refs.replayInput.value = input ?? "";
    refs.replayExpectedOutput.value = expectedOutput ?? "";
    renderReplayResult({
        state: "prefilled",
        message: `${label} replay paneline tasindi.`
    });
    renderReplayComparison();
}

function primeReplayFromFirstSample() {
    if (state.visibleTestCases.length === 0) {
        return false;
    }

    if (refs.replayInput.value.trim() || refs.replayExpectedOutput.value.trim()) {
        return false;
    }

    const sample = state.visibleTestCases[0];
    if (!sample) {
        return false;
    }

    loadReplayFromCase(sample.input, sample.expectedOutput, "Ilk sample");
    return true;
}

function loadReplayFromFailure(summary) {
    if (!summary?.lastFailedVisible || !summary.lastFailedInputPreview) {
        return;
    }

    state.replayComparison = null;
    state.replayResult = null;
    refs.replayInput.value = summary.lastFailedInputPreview;
    refs.replayExpectedOutput.value = summary.lastFailedExpectedOutputPreview || "";
    renderReplayResult({
        state: "prefilled",
        message: "Son visible failure replay paneline tasindi."
    });
    renderReplayComparison();
}

function selectReplayBaseline(submissionId) {
    const submission = state.submissions.find((entry) => entry.id === submissionId);
    if (!submission) {
        showFeedback("Karsilastirma icin submission bulunamadi.", "error");
        return;
    }

    if (state.selectedCompareSubmission?.id === submissionId) {
        clearReplayBaseline(true);
        return;
    }

    state.selectedCompareSubmission = {
        id: submission.id,
        status: submission.status,
        language: submission.language,
        createdAt: submission.createdAt
    };
    state.replayComparison = null;
    state.replayResult = null;
    renderReplayBaseline();
    renderReplayResult({
        state: "prefilled",
        message: `Baseline olarak #${submission.id} secildi. Simdi custom replay'i tekrar calistir.`
    });
    renderReplayComparison();
    renderSubmissions();
}

function clearReplayBaseline(showMessage = false) {
    state.selectedCompareSubmission = null;
    state.replayComparison = null;
    renderReplayBaseline();
    renderReplayComparison();
    renderSubmissions();

    if (showMessage) {
        showFeedback("Submission baseline temizlendi.", "idle");
    }
}

function renderReplayBaseline() {
    if (!state.currentUser) {
        refs.replayBaselineCard.textContent = "Submission compare icin once giris yap.";
        refs.replayBaselineCard.className = "feedback feedback--idle";
        return;
    }

    if (!state.selectedCompareSubmission) {
        refs.replayBaselineCard.textContent = "Submission Baseline secersen custom replay ayni inputta eski gonderiminle karsilastirilir.";
        refs.replayBaselineCard.className = "feedback feedback--idle";
        return;
    }

    const baselineAvailable = isLanguageExecutionAvailable(state.selectedCompareSubmission.language);
    const baselineWarning = baselineAvailable
        ? ""
        : `<p class="workspace-card__hint">${escapeHtml(getLanguageExecutionMessage(state.selectedCompareSubmission.language) || "Bu dil su anda hazir degil.")}</p>`;

    refs.replayBaselineCard.innerHTML = `
        <div class="replay-baseline">
            <div>
                <p class="workspace-debug__eyebrow">Submission Baseline</p>
                <p><strong>#${state.selectedCompareSubmission.id}</strong> | ${escapeHtml(state.selectedCompareSubmission.status)} | ${escapeHtml(state.selectedCompareSubmission.language)}</p>
                ${baselineWarning}
            </div>
            <button type="button" class="button button--ghost button--small" data-clear-replay-baseline>Baseline'i temizle</button>
        </div>
    `;
    refs.replayBaselineCard.className = "feedback feedback--idle";

    refs.replayBaselineCard.querySelector("[data-clear-replay-baseline]").addEventListener("click", () => {
        clearReplayBaseline(true);
    });
}

function renderWorkspaceDiagnostics(summary) {
    if (!state.currentUser) {
        refs.workspaceDebugCard.innerHTML = `
            <div class="empty-state">
                Giris yaptiginda son hatali denemendeki visible testcase diagnostigini burada goreceksin.
            </div>
        `;
        return;
    }

    if (!summary) {
        refs.workspaceDebugCard.innerHTML = `<div class="empty-state">Failure diagnostigi yuklenemedi.</div>`;
        return;
    }

    const failureStatuses = new Set(["WRONG_ANSWER", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED", "COMPILATION_ERROR"]);
    if (!failureStatuses.has(summary.lastStatus)) {
        refs.workspaceDebugCard.innerHTML = `
            <div class="empty-state">
                Son denemendeki failure diagnostigi burada gosterilecek.
            </div>
        `;
        return;
    }

    const visibilityCopy = summary.lastFailedVisible === true
        ? `Visible case #${summary.lastFailedTestIndex ?? "-"} uzerinden debug bilgisi acildi.`
        : summary.lastFailedVisible === false
            ? `Son failure hidden case #${summary.lastFailedTestIndex ?? "-"} uzerinde oldu. Icerik gizli tutulur.`
            : "Bu status icin testcase preview paylasilmiyor.";

    const blocks = summary.lastFailedVisible === true
        ? [
            renderWorkspaceDebugBlock("Input", summary.lastFailedInputPreview),
            renderWorkspaceDebugBlock("Expected", summary.lastFailedExpectedOutputPreview),
            renderWorkspaceDebugBlock("Actual", summary.lastFailedActualOutputPreview)
        ].filter(Boolean).join("")
        : "";

    refs.workspaceDebugCard.innerHTML = `
        <article class="workspace-debug">
            <div class="workspace-debug__header">
                <div>
                    <p class="workspace-debug__eyebrow">Latest failure</p>
                    <h3>${escapeHtml(formatViewerStatus(summary.lastStatus))}</h3>
                </div>
                ${summary.lastFailedTestIndex ? `<span class="badge">${summary.lastFailedTestIndex}. case</span>` : ""}
            </div>
            <p class="workspace-card__lead">${escapeHtml(visibilityCopy)}</p>
            ${summary.lastVerdictMessage ? `<p class="workspace-card__meta">${escapeHtml(summary.lastVerdictMessage)}</p>` : ""}
            ${summary.lastFailedVisible === true && summary.lastFailedInputPreview ? `
                <div class="workspace-card__actions">
                    <button type="button" class="button button--ghost button--small" data-replay-latest-failure>Bu case'i replay'e al</button>
                </div>
            ` : ""}
            ${blocks ? `<div class="workspace-debug__grid">${blocks}</div>` : ""}
        </article>
    `;

    refs.workspaceDebugCard.querySelectorAll("[data-replay-latest-failure]").forEach((button) => {
        button.addEventListener("click", () => loadReplayFromFailure(summary));
    });
}

function renderReplayResult(result) {
    if (!state.currentUser) {
        refs.replayResultCard.textContent = "Custom replay icin once giris yap.";
        refs.replayResultCard.className = "feedback feedback--idle";
        return;
    }

    if (!result) {
        refs.replayResultCard.textContent = "Sample veya custom input ile tek seferlik run sonucu burada gorunecek.";
        refs.replayResultCard.className = "feedback feedback--idle";
        return;
    }

    if (result.state === "prefilled") {
        refs.replayResultCard.textContent = result.message;
        refs.replayResultCard.className = "feedback feedback--idle";
        return;
    }

    const resultClass = result.status === "SUCCESS" && result.matchedExpected !== false
        ? "success"
        : result.status === "SUCCESS"
            ? "idle"
            : "error";

    const expectation = result.expectedOutput
        ? `<p>Expected match: <strong>${result.matchedExpected ? "Yes" : "No"}</strong></p>`
        : "";
    const outputBlock = result.output != null
        ? `<p><strong>Output</strong></p><pre>${escapeHtml(result.output)}</pre>`
        : "";
    const expectedBlock = result.expectedOutput != null
        ? `<p><strong>Expected</strong></p><pre>${escapeHtml(result.expectedOutput)}</pre>`
        : "";

    refs.replayResultCard.innerHTML = `
        <div class="replay-result">
            <div class="submission-card__meta">
                <span class="badge ${statusPillClass(result.status === "SUCCESS" ? "ACCEPTED" : result.status)}">${escapeHtml(formatReplayStatus(result.status))}</span>
                <span class="badge">${result.executionTime ?? 0} ms</span>
                <span class="badge">${result.memoryUsage ?? 0} MB</span>
            </div>
            ${expectation}
            ${result.message ? `<p>${escapeHtml(result.message)}</p>` : ""}
            ${outputBlock}
            ${expectedBlock}
        </div>
    `;
    refs.replayResultCard.className = `feedback feedback--${resultClass}`;
}

function renderReplayComparison() {
    if (state.selectedCompareSubmission) {
        renderSubmissionReplayComparison();
        return;
    }

    const summary = state.workspaceSummary;
    const replay = state.replayResult;

    if (!state.currentUser) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Karsilastirma icin giris yapman gerekir.</div>`;
        return;
    }

    if (!summary?.lastFailedVisible || !summary.lastFailedInputPreview || !summary.lastFailedExpectedOutputPreview) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Visible failure ile karsilastirma icin uygun bir son deneme yok.</div>`;
        return;
    }

    if (!replay) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Replay calistirdiginda son visible failure ile diff burada gorunecek.</div>`;
        return;
    }

    if (!sameCompareValue(refs.replayInput.value, summary.lastFailedInputPreview)) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Son replay farkli bir input ile calisti. Dogrudan karsilastirma icin \"Bu case'i replay'e al\" kullan.</div>`;
        return;
    }

    if (replay.status !== "SUCCESS" || replay.output == null) {
        refs.replayCompareCard.innerHTML = `
            <article class="replay-compare">
                <div class="workspace-debug__header">
                    <div>
                        <p class="workspace-debug__eyebrow">Replay Compare</p>
                        <h3>Replay tamamlanmadi</h3>
                    </div>
                    <span class="badge ${statusPillClass(replay.status)}">${escapeHtml(formatReplayStatus(replay.status))}</span>
                </div>
                <p class="workspace-card__lead">Son visible failure ile birebir diff icin replay'in output uretmesi gerekiyor.</p>
            </article>
        `;
        return;
    }

    const expected = summary.lastFailedExpectedOutputPreview;
    const previousActual = summary.lastFailedActualOutputPreview;
    const currentActual = replay.output;
    const fixed = sameCompareValue(currentActual, expected) && !sameCompareValue(previousActual, expected);
    const unchanged = sameCompareValue(currentActual, previousActual);
    const verdict = fixed
        ? "Current replay son visible failure'i duzeltti."
        : unchanged
            ? "Current replay, onceki hatali ciktiyla ayni sonucu uretti."
            : sameCompareValue(currentActual, expected)
                ? "Current replay beklenen ciktiyi uretti."
                : "Current replay ciktiyi degistirdi ama beklenenle hala eslesmiyor.";

    refs.replayCompareCard.innerHTML = `
        <article class="replay-compare">
            <div class="workspace-debug__header">
                <div>
                    <p class="workspace-debug__eyebrow">Replay Compare</p>
                    <h3>${escapeHtml(verdict)}</h3>
                </div>
                <span class="badge">${summary.lastFailedTestIndex}. case</span>
            </div>
            <div class="replay-compare__grid">
                ${renderReplayCompareBlock("Previous Actual", previousActual || "No output captured")}
                ${renderReplayCompareBlock("Current Output", currentActual)}
                ${renderReplayCompareBlock("Expected", expected)}
            </div>
        </article>
    `;
}

function renderSubmissionReplayComparison() {
    const baselineMeta = state.selectedCompareSubmission;
    const comparison = state.replayComparison;

    if (!state.currentUser) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Karsilastirma icin giris yapman gerekir.</div>`;
        return;
    }

    if (!baselineMeta) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Replay calistirdiginda secili submission baseline'i ile diff burada gorunecek.</div>`;
        return;
    }

    if (!comparison || comparison.baselineRun?.submissionId !== baselineMeta.id) {
        refs.replayCompareCard.innerHTML = `<div class="empty-state">Baseline secildi. Simdi ayni inputta compare calistirmak icin replay'i tekrar kos.</div>`;
        return;
    }

    const currentRun = comparison.currentRun;
    const baselineRun = comparison.baselineRun;
    const expected = comparison.expectedOutput;
    const verdict = buildSubmissionCompareVerdict(currentRun, baselineRun, comparison.sameOutput, expected);

    refs.replayCompareCard.innerHTML = `
        <article class="replay-compare">
            <div class="workspace-debug__header">
                <div>
                    <p class="workspace-debug__eyebrow">Submission Compare</p>
                    <h3>${escapeHtml(verdict)}</h3>
                </div>
                <span class="badge">Baseline #${baselineRun.submissionId}</span>
            </div>
            <div class="workspace-card__breakdown">
                <span class="badge ${replayStatusPillClass(baselineRun.status)}">Baseline: ${escapeHtml(formatReplayStatus(baselineRun.status))}</span>
                <span class="badge">${escapeHtml(baselineRun.language || "-")}</span>
                <span class="badge ${replayStatusPillClass(currentRun.status)}">Current: ${escapeHtml(formatReplayStatus(currentRun.status))}</span>
                <span class="badge">${escapeHtml(refs.language.value)}</span>
            </div>
            <div class="replay-compare__grid">
                ${renderReplayCompareBlock("Baseline Output", baselineRun.output || "No output")}
                ${renderReplayCompareBlock("Current Output", currentRun.output || "No output")}
                ${renderReplayCompareBlock("Expected", expected || "Not provided")}
            </div>
        </article>
    `;
}

function renderEditorial() {
    const problem = state.selectedProblem;

    if (!problem?.editorialAvailable) {
        refs.problemEditorialHeading.textContent = "Editorial";
        refs.problemEditorialState.textContent = "Bu problem icin cozum notu henuz eklenmedi.";
        refs.problemEditorial.innerHTML = `<div class="empty-state">Editorial eklenmedi.</div>`;
        return;
    }

    if (!problem.editorialUnlocked) {
        refs.problemEditorialHeading.textContent = "Editorial kilitli";
        refs.problemEditorialState.textContent = "Accepted gonderimden sonra acilir.";
        refs.problemEditorial.innerHTML = `
            <article class="editorial-card editorial-card--locked">
                <p>${escapeHtml(
                    state.currentUser
                        ? "Bu bolum accepted gonderimden sonra acilir."
                        : "Bu bolum giris yapip problemi accepted ettikten sonra acilir."
                )}</p>
            </article>
        `;
        return;
    }

    refs.problemEditorialHeading.textContent = problem.editorialTitle || "Editorial";
    refs.problemEditorialState.textContent = isAdmin()
        ? "Admin gorunumu."
        : "Accepted gonderim sayesinde acildi.";
    refs.problemEditorial.innerHTML = `
        <article class="editorial-card">
            <p>${escapeHtml(problem.editorialContent || "Editorial icerigi henuz doldurulmadi.")}</p>
        </article>
    `;
}

function renderHint() {
    const problem = state.selectedProblem;

    if (!problem?.hintAvailable) {
        refs.problemHintHeading.textContent = "Hint";
        refs.problemHintState.textContent = "Bu problem icin ipucu eklenmedi.";
        refs.problemHint.innerHTML = `<div class="empty-state">Hint eklenmedi.</div>`;
        return;
    }

    if (!problem.hintUnlocked) {
        refs.problemHintHeading.textContent = "Hint kilitli";
        refs.problemHintState.textContent = "Ilk gonderimden sonra acilir.";
        refs.problemHint.innerHTML = `
            <article class="editorial-card editorial-card--locked">
                <p>${escapeHtml(
                    state.currentUser
                        ? "Ilk denemeni gonderdikten sonra bu ipucu acilir."
                        : "Giris yapip ilk denemeni gonderdikten sonra bu ipucu acilir."
                )}</p>
            </article>
        `;
        return;
    }

    refs.problemHintHeading.textContent = problem.hintTitle || "Hint";
    refs.problemHintState.textContent = isAdmin()
        ? "Admin gorunumu."
        : "Ilk gonderim sayesinde acildi.";
    refs.problemHint.innerHTML = `
        <article class="editorial-card">
            <p>${escapeHtml(problem.hintContent || "Hint icerigi henuz doldurulmadi.")}</p>
        </article>
    `;
}

function normalizeProblemPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Problem payload object olmali.");
    }

    const tags = Array.isArray(payload.tags)
        ? payload.tags
        : String(payload.tags ?? "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

    const examples = Array.isArray(payload.examples) ? payload.examples : [];
    const normalizedExamples = examples.map((example, index) => {
        const input = String(example?.input ?? "").trim();
        const output = String(example?.output ?? "").trim();
        const explanation = String(example?.explanation ?? "").trim();

        if (!input || !output) {
            throw new Error(`Example #${index + 1} icin input ve output zorunlu.`);
        }

        return {
            input,
            output,
            explanation: explanation || null
        };
    });

    const starterCodes = payload.starterCodes && typeof payload.starterCodes === "object" && !Array.isArray(payload.starterCodes)
        ? payload.starterCodes
        : {};
    const normalizedStarterCodes = Object.fromEntries(
        Object.entries(starterCodes)
            .map(([language, code]) => [String(language).trim().toUpperCase(), String(code ?? "").trim()])
            .filter(([language, code]) => language && code)
    );

    const testCases = Array.isArray(payload.testCases) ? payload.testCases : [];
    const normalizedTestCases = testCases.map((testCase, index) => {
        const input = String(testCase?.input ?? "");
        const expectedOutput = String(testCase?.expectedOutput ?? "").trim();

        if (!input.trim() || !expectedOutput) {
            throw new Error(`Test case #${index + 1} icin input ve expectedOutput zorunlu.`);
        }

        return {
            input,
            expectedOutput,
            hidden: Boolean(testCase?.hidden)
        };
    });

    return {
        title: String(payload.title ?? "").trim(),
        description: String(payload.description ?? "").trim(),
        constraints: String(payload.constraints ?? "").trim() || null,
        inputFormat: String(payload.inputFormat ?? "").trim() || null,
        outputFormat: String(payload.outputFormat ?? "").trim() || null,
        hintTitle: String(payload.hintTitle ?? "").trim() || null,
        hintContent: String(payload.hintContent ?? "").trim() || null,
        editorialTitle: String(payload.editorialTitle ?? "").trim() || null,
        editorialContent: String(payload.editorialContent ?? "").trim() || null,
        difficulty: String(payload.difficulty ?? "").trim().toUpperCase(),
        timeLimitMs: Number(payload.timeLimitMs || DEFAULT_TIME_LIMIT_MS),
        memoryLimitMb: Number(payload.memoryLimitMb || DEFAULT_MEMORY_LIMIT_MB),
        tags: tags.map((tag) => String(tag).trim()).filter(Boolean),
        examples: normalizedExamples,
        starterCodes: normalizedStarterCodes,
        testCases: normalizedTestCases
    };
}

function parseExamplesJson(rawExamples) {
    const trimmed = rawExamples.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            throw new Error("Examples alani JSON array olmali.");
        }
        return parsed;
    } catch (error) {
        throw new Error(error.message || "Examples JSON parse edilemedi.");
    }
}

function parseStarterCodesJson(rawStarterCodes) {
    const trimmed = rawStarterCodes.trim();
    if (!trimmed) {
        return {};
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Starter codes alani JSON object olmali.");
        }
        return parsed;
    } catch (error) {
        throw new Error(error.message || "Starter codes JSON parse edilemedi.");
    }
}

function selectedProblemStarterCode(language) {
    const problemStarter = state.selectedProblem?.starterCodes?.[language];
    if (problemStarter && problemStarter.trim()) {
        return problemStarter;
    }

    return starterTemplate(language);
}

async function loadSubmissionIntoEditor(submissionId, label) {
    if (!submissionId) {
        showFeedback("Yuklenecek gonderim bulunamadi.", "error");
        return;
    }

    if (!state.currentUser || !state.authToken) {
        showFeedback("Bu islem icin giris yapman gerekir.", "error");
        return;
    }

    try {
        const detail = await fetchJson(`/api/submissions/${submissionId}`, {
            headers: authHeaders()
        });

        if (detail.problemId !== state.selectedProblemId) {
            showFeedback("Bu gonderim secili probleme ait degil.", "error");
            return;
        }

        const nextSourceCode = detail.sourceCode || "";
        if (!nextSourceCode.trim()) {
            showFeedback("Secilen gonderimin source code kaydi bos.", "error");
            return;
        }

        if (refs.sourceCode.value.trim() && refs.sourceCode.value !== nextSourceCode) {
            const confirmed = window.confirm(`${label} editor'e yuklensin mi? Mevcut kodun degisecek.`);
            if (!confirmed) {
                return;
            }
        }

        flushCurrentDraft();
        if (detail.language) {
            refs.language.value = detail.language;
            state.editorLanguageContext = detail.language;
        }
        refs.sourceCode.value = nextSourceCode;
        updateEditorNote();
        persistDraftForContext(detail.problemId, refs.language.value, refs.sourceCode.value);
        renderDraftStatus();
        refs.sourceCode.focus();
        refs.sourceCode.setSelectionRange(refs.sourceCode.value.length, refs.sourceCode.value.length);

        const debugSummary = submissionDebugSummary(detail);
        showFeedback(
            [
                `${label} editor'e yuklendi.`,
                `${detail.status} | ${detail.language} | ${detail.executionTime ?? 0} ms`,
                debugSummary
            ].filter(Boolean).join(" | "),
            "success"
        );
    } catch (error) {
        showFeedback(error.message, "error");
    }
}

async function openDashboardProblem(problemId, options = {}) {
    if (!problemId) {
        return;
    }

    const submissionId = options.submissionId ?? null;
    const label = options.label || "Dashboard";
    const suggestedLanguage = options.suggestedLanguage || null;
    const primeSample = options.primeSample === true;

    await selectProblem(problemId);

    if (suggestedLanguage && refs.language.value !== suggestedLanguage) {
        refs.language.value = suggestedLanguage;
        handleLanguageChange();
    }

    const replayPrimed = primeSample ? primeReplayFromFirstSample() : false;

    refs.sourceCode.scrollIntoView({ behavior: "smooth", block: "center" });
    refs.sourceCode.focus();

    if (submissionId && state.currentUser && state.authToken) {
        await loadSubmissionIntoEditor(submissionId, label);
        return;
    }

    const feedbackParts = [`${label} acildi.`];
    if (suggestedLanguage) {
        feedbackParts.push(`${suggestedLanguage} odagi editor'e uygulandi.`);
    }
    if (replayPrimed) {
        feedbackParts.push("Ilk sample replay paneline tasindi.");
    }
    showFeedback(feedbackParts.join(" "), "success");
}

async function openUserProfile(username, options = {}) {
    if (!username) {
        return;
    }

    try {
        state.selectedUserProfile = await fetchJson(`/api/users/${encodeURIComponent(username)}/profile`, {
            headers: authHeaders()
        });
        renderUserProfile();
        if (options.scrollIntoView !== false) {
            refs.userProfileCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } catch (error) {
        state.selectedUserProfile = null;
        renderUserProfile();
        showFeedback(error.message, "error");
    }
}

function clearUserProfile() {
    state.selectedUserProfile = null;
    renderUserProfile();
}

async function toggleProblemBookmark() {
    if (!state.currentUser || !state.authToken) {
        showFeedback("Save for later icin once giris yap.", "error");
        return;
    }

    if (!state.selectedProblemId || !state.selectedProblem) {
        showFeedback("Once bir problem sec.", "error");
        return;
    }

    const bookmarked = Boolean(state.selectedProblem.viewerBookmarked);

    try {
        refs.problemBookmarkButton.disabled = true;
        refs.problemBookmarkButton.textContent = bookmarked ? "Removing..." : "Saving...";

        await fetchJson(`/api/problems/${state.selectedProblemId}/bookmark`, {
            method: bookmarked ? "DELETE" : "POST",
            headers: authHeaders()
        });

        showFeedback(
            bookmarked
                ? "Problem saved queue'dan cikarildi."
                : "Problem save for later kuyruguna eklendi.",
            "success"
        );

        await loadProblems(state.selectedProblemId);
    } catch (error) {
        renderProblemBookmarkButton();
        showFeedback(error.message, "error");
    }
}

async function runReplay(event) {
    event.preventDefault();

    if (!state.selectedProblemId) {
        renderReplayResult({ state: "prefilled", message: "Once bir problem sec." });
        return;
    }

    if (!state.currentUser || !state.authToken) {
        renderReplayResult(null);
        showFeedback("Custom replay icin once giris yap.", "error");
        return;
    }

    if (!refs.sourceCode.value.trim()) {
        renderReplayResult({ state: "prefilled", message: "Replay icin editor bos olamaz." });
        return;
    }

    if (!isLanguageExecutionAvailable(refs.language.value)) {
        const message = getLanguageExecutionMessage(refs.language.value) || "Secili dil bu ortamda hazir degil.";
        renderReplayResult({ state: "prefilled", message });
        showFeedback(message, "error");
        return;
    }

    if (state.selectedCompareSubmission && !isLanguageExecutionAvailable(state.selectedCompareSubmission.language)) {
        const baselineMessage = getLanguageExecutionMessage(state.selectedCompareSubmission.language)
            || `${state.selectedCompareSubmission.language} baseline'i bu ortamda calisamiyor.`;
        renderReplayResult({ state: "prefilled", message: baselineMessage });
        showFeedback(baselineMessage, "error");
        return;
    }

    const payload = {
        language: refs.language.value,
        sourceCode: refs.sourceCode.value,
        input: refs.replayInput.value,
        expectedOutput: refs.replayExpectedOutput.value
    };

    try {
        refs.replayRunButton.disabled = true;
        refs.replayRunButton.textContent = "Running...";

        const hasBaseline = Boolean(state.selectedCompareSubmission?.id);
        const endpoint = hasBaseline
            ? `/api/workspace/problems/${state.selectedProblemId}/compare`
            : `/api/workspace/problems/${state.selectedProblemId}/replay`;
        const body = hasBaseline
            ? {
                baselineSubmissionId: state.selectedCompareSubmission.id,
                ...payload
            }
            : payload;
        const result = await fetchJson(endpoint, {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(body)
        });

        state.replayComparison = hasBaseline ? result : null;
        state.replayResult = hasBaseline ? result.currentRun : result;
        renderReplayBaseline();
        renderReplayResult(state.replayResult);
        renderReplayComparison();
    } catch (error) {
        state.replayComparison = null;
        state.replayResult = null;
        refs.replayResultCard.textContent = error.message;
        refs.replayResultCard.className = "feedback feedback--error";
        renderReplayComparison();
    } finally {
        refs.replayRunButton.disabled = false;
        refs.replayRunButton.textContent = "Run custom input";
    }
}

function submissionDebugSummary(detail) {
    if (detail.failedVisible === true) {
        return `Visible case #${detail.failedTestIndex ?? "-"} diagnostigi hazir.`;
    }

    if (detail.failedVisible === false && detail.failedTestIndex) {
        return `Hidden case #${detail.failedTestIndex} fail oldu.`;
    }

    if (detail.status === "COMPILATION_ERROR" && detail.verdictMessage) {
        return shorten(detail.verdictMessage, 120);
    }

    return null;
}

function formatReplayStatus(status) {
    if (status === "SUCCESS") {
        return "Success";
    }

    return formatViewerStatus(status);
}

function renderWorkspaceDebugBlock(title, value) {
    if (!value) {
        return "";
    }

    return `
        <article class="workspace-debug__block">
            <span>${escapeHtml(title)}</span>
            <code>${escapeHtml(value)}</code>
        </article>
    `;
}

function renderReplayCompareBlock(title, value) {
    return `
        <article class="workspace-debug__block">
            <span>${escapeHtml(title)}</span>
            <code>${escapeHtml(value)}</code>
        </article>
    `;
}

function sameCompareValue(left, right) {
    if (left == null || right == null) {
        return false;
    }

    return String(left).trim() === String(right).trim();
}

function matchesProblemScope(problem) {
    if (state.problemScope === "ALL" || !state.currentUser) {
        return true;
    }

    if (state.problemScope === "SOLVED") {
        return Boolean(problem.viewerSolved);
    }

    if (state.problemScope === "ATTEMPTED") {
        return Boolean(problem.viewerStatus)
            && problem.viewerStatus !== "NOT_STARTED"
            && problem.viewerStatus !== "ACCEPTED";
    }

    if (state.problemScope === "REMAINING") {
        return !problem.viewerSolved;
    }

    if (state.problemScope === "BOOKMARKED") {
        return Boolean(problem.viewerBookmarked);
    }

    return true;
}

function matchesProblemDifficulty(problem) {
    return state.problemDifficultyFilter === "ALL" || problem.difficulty === state.problemDifficultyFilter;
}

function matchesProblemTag(problem) {
    return state.problemTagFilter === "ALL" || (problem.tags || []).includes(state.problemTagFilter);
}

function matchesProblemAttention(problem) {
    if (!isAdmin() || state.adminAttentionFilter === "ALL") {
        return true;
    }

    const attentionFlags = problemAttentionFlags(problem.id);
    if (state.adminAttentionFilter === "ATTENTION") {
        return attentionFlags.length > 0;
    }

    return attentionFlags.includes(state.adminAttentionFilter);
}

function setProblemScope(scope) {
    state.problemScope = scope || "ALL";
    renderProgressSummary();
    renderProblemList();
}

function setProblemDifficultyFilter(filter) {
    state.problemDifficultyFilter = filter || "ALL";
    renderProblemFacets();
    renderProblemList();
}

function setProblemTagFilter(filter) {
    state.problemTagFilter = filter || "ALL";
    renderProblemFacets();
    renderProblemList();
}

function setAdminAttentionFilter(filter) {
    state.adminAttentionFilter = filter || "ALL";
    renderProblemFacets();
    renderCatalogHealth();
    renderProblemList();
}

function renderProblemScopeButton(scope, label) {
    return `
        <button
            type="button"
            class="button button--ghost button--small ${state.problemScope === scope ? "button--soft" : ""}"
            data-problem-scope="${scope}">
            ${escapeHtml(label)}
        </button>
    `;
}

function renderFacetButton(kind, value, label, selectedValue) {
    const active = selectedValue === value;
    const dataAttribute = kind === "difficulty"
        ? `data-difficulty-filter="${escapeHtml(value)}"`
        : `data-tag-filter="${escapeHtml(value)}"`;

    return `
        <button
            type="button"
            class="button button--ghost button--small ${active ? "button--soft" : ""}"
            ${dataAttribute}>
            ${escapeHtml(label)}
        </button>
    `;
}

function renderAdminAttentionButton(value, label) {
    return `
        <button
            type="button"
            class="button button--ghost button--small ${state.adminAttentionFilter === value ? "button--soft" : ""}"
            data-admin-attention-filter="${escapeHtml(value)}">
            ${escapeHtml(label)}
        </button>
    `;
}

async function openAuthoringGap(problemId, flag) {
    if (!isAdmin()) {
        return;
    }

    if (problemId && state.selectedProblemId !== problemId) {
        await selectProblem(problemId);
    }

    focusAuthoringTarget(flag);
}

function resolveNextAttentionProblem() {
    const queue = (state.catalogHealth?.attentionProblems || []).filter((problem) =>
        problem.problemId !== state.selectedProblemId && matchesCatalogAttentionProblem(problem)
    );

    if (queue.length > 0) {
        return queue[0];
    }

    return (state.catalogHealth?.attentionProblems || []).find((problem) => problem.problemId !== state.selectedProblemId) || null;
}

function applyAuthoringScaffold(flag) {
    const normalizedFlag = String(flag || "").toUpperCase();

    try {
        switch (normalizedFlag) {
            case "LOW_EXAMPLE_DEPTH":
                insertExampleScaffold();
                focusAuthoringTarget("EXAMPLES", { suppressMessage: true });
                return;
            case "MISSING_HINT":
                insertHintScaffold();
                focusAuthoringTarget("HINT", { suppressMessage: true });
                return;
            case "MISSING_EDITORIAL":
                insertEditorialScaffold();
                focusAuthoringTarget("EDITORIAL", { suppressMessage: true });
                return;
            case "NEEDS_PUBLIC_SAMPLE":
                insertTestCaseScaffold(buildPublicSampleScaffold());
                focusAuthoringTarget("NEEDS_PUBLIC_SAMPLE", { suppressMessage: true });
                return;
            case "NEEDS_HIDDEN_DEPTH":
                insertTestCaseScaffold(buildHiddenDepthScaffold());
                focusAuthoringTarget("NEEDS_HIDDEN_DEPTH", { suppressMessage: true });
                return;
            case "LOW_TOTAL_CASE_COVERAGE":
                insertTestCaseScaffold(buildCoverageScaffold());
                focusAuthoringTarget("LOW_TOTAL_CASE_COVERAGE", { suppressMessage: true });
                return;
            default:
                focusAuthoringTarget(normalizedFlag);
        }
    } catch (error) {
        showAuthorFeedback(error.message || "Scaffold uygulanamadi.", "error");
    }
}

function focusAuthoringTarget(target, options = {}) {
    const normalizedTarget = String(target || "").toUpperCase();
    const suppressMessage = Boolean(options.suppressMessage);
    let input = null;
    let message = null;

    switch (normalizedTarget) {
        case "STATEMENT":
            input = refs.problemCreateDescription;
            message = "Problem statement alani odakta.";
            break;
        case "EXAMPLES":
        case "LOW_EXAMPLE_DEPTH":
            input = refs.problemCreateExamples;
            message = "Example alanina odaklanildi.";
            break;
        case "HINT":
        case "MISSING_HINT":
            input = refs.problemCreateHintTitle;
            message = "Hint alanina odaklanildi.";
            break;
        case "EDITORIAL":
        case "MISSING_EDITORIAL":
            input = refs.problemCreateEditorialTitle;
            message = "Editorial alanina odaklanildi.";
            break;
        case "TESTCASE":
            input = refs.testCaseInput;
            message = "Testcase editoru odakta.";
            break;
        case "NEEDS_PUBLIC_SAMPLE":
            refs.testCaseHidden.checked = false;
            input = refs.testCaseInput;
            message = "Public testcase depth artirmak icin testcase editoru odakta.";
            break;
        case "NEEDS_HIDDEN_DEPTH":
            refs.testCaseHidden.checked = true;
            input = refs.testCaseInput;
            message = "Hidden testcase eklemek icin testcase editoru odakta.";
            break;
        case "LOW_TOTAL_CASE_COVERAGE":
            input = refs.testCaseBulkPayload;
            message = "Case coverage artirmak icin bulk testcase alani odakta.";
            break;
        default:
            input = refs.problemCreateDescription;
            message = "Authoring editoru odakta.";
            break;
    }

    if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus({ preventScroll: true });
    }

    if (message && !suppressMessage) {
        showAuthorFeedback(message, "idle");
    }
}

function insertExampleScaffold() {
    const existingExamples = parseExamplesJson(refs.problemCreateExamples.value);
    const nextIndex = existingExamples.length + 1;
    const scaffold = {
        input: existingExamples.length === 0 ? "REPLACE_WITH_SAMPLE_INPUT" : `REPLACE_WITH_EXAMPLE_${nextIndex}_INPUT`,
        output: existingExamples.length === 0 ? "REPLACE_WITH_SAMPLE_OUTPUT" : `REPLACE_WITH_EXAMPLE_${nextIndex}_OUTPUT`,
        explanation: existingExamples.length === 0
            ? "Aciklamayi problemi anlatacak sekilde guncelle."
            : `Example ${nextIndex} neden onemli, kisaca acikla.`
    };

    refs.problemCreateExamples.value = JSON.stringify([...existingExamples, scaffold], null, 2);
    showAuthorFeedback("Examples alanina yeni bir scaffold eklendi.", "success");
}

function insertHintScaffold() {
    if (!refs.problemCreateHintTitle.value.trim()) {
        refs.problemCreateHintTitle.value = `First step for ${state.selectedProblem?.title || "this problem"}`;
    }

    if (!refs.problemCreateHintContent.value.trim()) {
        refs.problemCreateHintContent.value = [
            "1. Kucuk inputlarla oruntuyu gozlemle.",
            "2. Sonucu direkt hesaplatan bir kalip veya formul aramayi dene.",
            "3. Hidden case'lerde hangi edge durumlarin patlayabilecegini not et."
        ].join("\n");
        showAuthorFeedback("Hint scaffold'i yerlestirildi.", "success");
        return;
    }

    showAuthorFeedback("Hint alani zaten dolu; sadece odaklandi.", "idle");
}

function insertEditorialScaffold() {
    if (!refs.problemCreateEditorialTitle.value.trim()) {
        refs.problemCreateEditorialTitle.value = `${state.selectedProblem?.title || "Problem"} solution outline`;
    }

    if (!refs.problemCreateEditorialContent.value.trim()) {
        refs.problemCreateEditorialContent.value = [
            "Approach:",
            "- Ana fikri bir iki cumlede acikla.",
            "",
            "Why it works:",
            "- Cozumu dogrulayan mantigi yaz.",
            "",
            "Complexity:",
            "- Time complexity:",
            "- Memory complexity:",
            "",
            "Edge cases:",
            "- Hangi sinir durumlarina dikkat edildigini not et."
        ].join("\n");
        showAuthorFeedback("Editorial scaffold'i yerlestirildi.", "success");
        return;
    }

    showAuthorFeedback("Editorial alani zaten dolu; sadece odaklandi.", "idle");
}

function insertTestCaseScaffold(scaffoldCases) {
    const existingCases = parseTestCaseBulkPayload(refs.testCaseBulkPayload.value);
    refs.testCaseBulkPayload.value = JSON.stringify([...existingCases, ...scaffoldCases], null, 2);
    showAuthorFeedback(`${scaffoldCases.length} testcase scaffold'i hazirlandi.`, "success");
}

function parseTestCaseBulkPayload(rawPayload) {
    const trimmed = rawPayload.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        const testCases = Array.isArray(parsed) ? parsed : parsed?.testCases;
        if (!Array.isArray(testCases)) {
            throw new Error("Bulk testcase alani JSON array veya { testCases: [] } olmali.");
        }
        return testCases.map((testCase) => ({
            input: String(testCase?.input ?? ""),
            expectedOutput: String(testCase?.expectedOutput ?? ""),
            hidden: Boolean(testCase?.hidden)
        }));
    } catch (error) {
        throw new Error(error.message || "Bulk testcase JSON parse edilemedi.");
    }
}

function buildPublicSampleScaffold() {
    return [{
        input: "REPLACE_WITH_SAMPLE_INPUT",
        expectedOutput: "REPLACE_WITH_SAMPLE_OUTPUT",
        hidden: false
    }];
}

function buildHiddenDepthScaffold() {
    return [
        {
            input: "REPLACE_WITH_BOUNDARY_INPUT",
            expectedOutput: "REPLACE_WITH_BOUNDARY_OUTPUT",
            hidden: true
        },
        {
            input: "REPLACE_WITH_TRICKY_INPUT",
            expectedOutput: "REPLACE_WITH_TRICKY_OUTPUT",
            hidden: true
        }
    ];
}

function buildCoverageScaffold() {
    const publicCount = state.adminTestCases.filter((testCase) => !testCase.hidden).length;
    const base = publicCount === 0 ? buildPublicSampleScaffold() : [];
    return [
        ...base,
        {
            input: "REPLACE_WITH_EDGE_INPUT",
            expectedOutput: "REPLACE_WITH_EDGE_OUTPUT",
            hidden: true
        },
        {
            input: "REPLACE_WITH_STRESS_INPUT",
            expectedOutput: "REPLACE_WITH_STRESS_OUTPUT",
            hidden: true
        }
    ];
}

function formatAuthoringScaffoldLabel(flag) {
    switch (flag) {
        case "LOW_EXAMPLE_DEPTH":
            return "Add example scaffold";
        case "MISSING_HINT":
            return "Seed hint scaffold";
        case "MISSING_EDITORIAL":
            return "Seed editorial scaffold";
        case "NEEDS_PUBLIC_SAMPLE":
            return "Seed public depth";
        case "NEEDS_HIDDEN_DEPTH":
            return "Seed hidden batch";
        case "LOW_TOTAL_CASE_COVERAGE":
            return "Seed coverage batch";
        default:
            return `Scaffold: ${formatCatalogAttentionFlag(flag)}`;
    }
}

function buildCatalogAttentionBreakdown() {
    const counts = new Map();

    (state.catalogHealth?.attentionProblems || []).forEach((problem) => {
        (problem.attentionFlags || []).forEach((flag) => {
            counts.set(flag, (counts.get(flag) || 0) + 1);
        });
    });

    return CATALOG_ATTENTION_ORDER
        .filter((flag) => counts.has(flag))
        .map((flag) => [flag, counts.get(flag)]);
}

function findCatalogAttentionProblem(problemId) {
    return (state.catalogHealth?.attentionProblems || []).find((problem) => problem.problemId === problemId) || null;
}

function problemAttentionFlags(problemId) {
    return findCatalogAttentionProblem(problemId)?.attentionFlags || [];
}

function matchesCatalogAttentionProblem(problem) {
    if (state.adminAttentionFilter === "ALL") {
        return true;
    }

    if (state.adminAttentionFilter === "ATTENTION") {
        return (problem.attentionFlags || []).length > 0;
    }

    return (problem.attentionFlags || []).includes(state.adminAttentionFilter);
}

function normalizeAdminAttentionFilter() {
    if (!isAdmin() || state.adminAttentionFilter === "ALL") {
        return;
    }

    if (state.adminAttentionFilter === "ATTENTION") {
        if ((state.catalogHealth?.attentionProblems || []).length === 0) {
            state.adminAttentionFilter = "ALL";
        }
        return;
    }

    const availableFlags = new Set(buildCatalogAttentionBreakdown().map(([flag]) => flag));
    if (!availableFlags.has(state.adminAttentionFilter)) {
        state.adminAttentionFilter = "ALL";
    }
}

function renderProblemAttentionBadges(problem) {
    if (!isAdmin()) {
        return "";
    }

    const attentionFlags = problemAttentionFlags(problem.id);
    if (attentionFlags.length === 0) {
        return "";
    }

    const visibleFlags = attentionFlags.slice(0, 2);
    const overflow = attentionFlags.length - visibleFlags.length;
    return `
        ${visibleFlags.map((flag) => `<span class="badge badge--attention">${escapeHtml(formatCatalogAttentionFlag(flag))}</span>`).join("")}
        ${overflow > 0 ? `<span class="badge badge--attention">+${overflow}</span>` : ""}
    `;
}

function replayStatusPillClass(status) {
    return statusPillClass(status === "SUCCESS" ? "ACCEPTED" : status);
}

function buildSubmissionCompareVerdict(currentRun, baselineRun, sameOutput, expected) {
    if (!currentRun || !baselineRun) {
        return "Compare sonucu hazir degil.";
    }

    if (currentRun.status === "SUCCESS" && baselineRun.status === "SUCCESS") {
        if (expected && currentRun.matchedExpected && !baselineRun.matchedExpected) {
            return "Current replay beklenen ciktiyi baseline submission'dan daha iyi yakaladi.";
        }

        if (expected && !currentRun.matchedExpected && baselineRun.matchedExpected) {
            return "Baseline submission bu inputta hala daha iyi sonuc uretiyor.";
        }

        if (sameOutput) {
            return expected && currentRun.matchedExpected
                ? "Iki run da beklenen ciktiyi uretti."
                : "Iki run ayni ciktiyi uretti.";
        }

        return expected && currentRun.matchedExpected
            ? "Current replay beklenen ciktiyi uretti; baseline farkli kaldi."
            : "Iki run farkli ciktilar uretti.";
    }

    if (currentRun.status === "SUCCESS") {
        return "Current replay tamamlandi, baseline submission ise hata verdi.";
    }

    if (baselineRun.status === "SUCCESS") {
        return "Baseline submission tamamlandi, current replay ise hata verdi.";
    }

    return "Iki run da tamamlanmadi; status farklarini kontrol et.";
}

function formatViewerStatus(status) {
    if (!status) {
        return "Login";
    }

    if (status === "NOT_STARTED") {
        return "Not started";
    }

    if (status === "BOOKMARKED") {
        return "Bookmarked";
    }

    return status.replaceAll("_", " ");
}

function activityCellClass(entry) {
    const submissions = Number(entry?.submissions ?? 0);
    const accepted = Number(entry?.accepted ?? 0);

    if (accepted > 0 && submissions >= 3) {
        return "activity-cell--high";
    }

    if (accepted > 0 || submissions >= 2) {
        return "activity-cell--mid";
    }

    if (submissions >= 1) {
        return "activity-cell--low";
    }

    return "activity-cell--idle";
}

function renderJourneySection(journey, mode) {
    if (!journey) {
        return `<p class="workspace-card__lead">Journey bilgisi henuz hazir degil.</p>`;
    }

    const goalList = journey.nextGoals || [];
    const progressPercent = Math.max(0, Math.min(100, Number(journey.progressPercent ?? 0)));
    const nextCopy = journey.maxLevel
        ? "Maksimum tier acildi."
        : `Next: Lv.${journey.nextLevel} ${journey.nextTitle || "-"} at ${journey.nextSolvedTarget ?? 0} solved`;

    return `
        <article class="dashboard-card__spotlight">
            <strong>Lv.${journey.level ?? 1} ${escapeHtml(journey.title || "Journey")}</strong>
            <p>${journey.solvedProblems ?? 0} solved | ${escapeHtml(nextCopy)}</p>
            <div class="journey-meter" aria-hidden="true">
                <span class="journey-meter__fill" style="width: ${progressPercent}%"></span>
            </div>
            <span class="dashboard-card__hint">${progressPercent}% progress</span>
        </article>
        ${goalList.length > 0 ? `
            <div class="dashboard-card__list">
                ${goalList.map((goal) => `
                    <article class="dashboard-card__item ${mode === "dashboard" ? "journey-goal" : ""}">
                        <strong>${escapeHtml(goal.title || "Goal")}</strong>
                        <p>${escapeHtml(goal.description || "")}</p>
                        <span class="dashboard-card__hint">${goal.currentValue ?? 0}/${goal.targetValue ?? 0} ${escapeHtml(goal.unit || "")}</span>
                    </article>
                `).join("")}
            </div>
        ` : `<p class="workspace-card__lead">Su an yakin hedef kalmadi; tum ana milestone'lar tamam.</p>`}
    `;
}

function statusPillClass(status) {
    switch ((status || "LOGIN").toUpperCase()) {
        case "ACCEPTED":
            return "status-pill--accepted";
        case "PENDING":
        case "TIME_LIMIT_EXCEEDED":
            return "status-pill--pending";
        case "WRONG_ANSWER":
            return "status-pill--wrong-answer";
        case "COMPILATION_ERROR":
            return "status-pill--compilation-error";
        case "RUNTIME_ERROR":
            return "status-pill--runtime-error";
        case "NOT_STARTED":
            return "status-pill--not-started";
        case "BOOKMARKED":
            return "status-pill--not-started";
        default:
            return "status-pill--login";
    }
}

function isAdmin() {
    return state.currentUser?.role === "ADMIN";
}

function formatCatalogAttentionFlag(flag) {
    switch (flag) {
        case "NEEDS_PUBLIC_SAMPLE":
            return "Need public depth";
        case "NEEDS_HIDDEN_DEPTH":
            return "Need hidden depth";
        case "LOW_TOTAL_CASE_COVERAGE":
            return "Low case coverage";
        case "LOW_EXAMPLE_DEPTH":
            return "Low example depth";
        case "MISSING_HINT":
            return "Missing hint";
        case "MISSING_EDITORIAL":
            return "Missing editorial";
        default:
            return flag;
    }
}

function starterTemplate(language) {
    switch (language) {
        case "PYTHON":
            return `n = int(input().strip())\ntotal = sum(i for i in range(n) if i % 3 == 0 or i % 5 == 0)\nprint(total)\n`;
        case "CPP":
            return `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n\n    long long total = 0;\n    for (long long i = 0; i < n; i++) {\n        if (i % 3 == 0 || i % 5 == 0) {\n            total += i;\n        }\n    }\n\n    cout << total;\n    return 0;\n}\n`;
        case "JAVA":
        default:
            return `public class Solution {\n    public static int solve(int n) {\n        int total = 0;\n        for (int i = 0; i < n; i++) {\n            if (i % 3 == 0 || i % 5 == 0) {\n                total += i;\n            }\n        }\n        return total;\n    }\n}\n`;
    }
}

function handleLanguageChange() {
    const previousLanguage = state.editorLanguageContext || refs.language.value;
    persistDraftForContext(state.selectedProblemId, previousLanguage, refs.sourceCode.value);
    state.editorLanguageContext = refs.language.value;
    updateEditorNote();
    syncEditorForSelectedProblem({ announceDraftRestore: true });
}

function scheduleDraftSave() {
    flushDraftSaveTimer();
    state.draftSaveTimerId = window.setTimeout(() => {
        persistDraftForContext(state.selectedProblemId, refs.language.value, refs.sourceCode.value);
    }, 300);
}

function flushCurrentDraft() {
    flushDraftSaveTimer();
    persistDraftForContext(state.selectedProblemId, state.editorLanguageContext || refs.language.value, refs.sourceCode.value);
}

function flushDraftSaveTimer() {
    if (state.draftSaveTimerId) {
        window.clearTimeout(state.draftSaveTimerId);
        state.draftSaveTimerId = null;
    }
}

function syncEditorForSelectedProblem(options = {}) {
    if (!state.selectedProblemId) {
        renderDraftStatus();
        return;
    }

    const currentLanguage = refs.language.value;
    state.editorLanguageContext = currentLanguage;
    const draft = getEditorDraft(state.selectedProblemId, currentLanguage);
    refs.sourceCode.value = draft?.sourceCode || selectedProblemStarterCode(currentLanguage);
    renderDraftStatus();

    if (draft && options.announceDraftRestore) {
        showFeedback(`${currentLanguage} taslagi editor'e geri yuklendi.`, "idle");
    }
}

function loadProblemDraftIntoEditor(problemId, language) {
    if (!problemId || !language) {
        return;
    }

    const draft = getEditorDraft(problemId, language);
    if (!draft?.sourceCode) {
        showFeedback("Secilen draft bulunamadi.", "error");
        return;
    }

    flushCurrentDraft();
    refs.language.value = language;
    state.editorLanguageContext = language;
    refs.sourceCode.value = draft.sourceCode;
    updateEditorNote();
    renderDraftStatus();
    refs.sourceCode.focus();
    refs.sourceCode.setSelectionRange(refs.sourceCode.value.length, refs.sourceCode.value.length);
    showFeedback(`${language} taslagi editor'e yuklendi.`, "success");
}

function persistDraftForContext(problemId, language, sourceCode) {
    if (!problemId || !language) {
        renderDraftStatus();
        return;
    }

    const problemKey = String(problemId);
    const previousProblemHasDraft = hasProblemDraft(problemId);
    const nextDrafts = {
        ...state.editorDrafts
    };
    const draftGroup = {
        ...(nextDrafts[problemKey] || {})
    };
    const normalizedSource = String(sourceCode ?? "");
    const existingDraft = draftGroup[language];

    if (!normalizedSource.trim() || !shouldPersistDraft(problemId, language, normalizedSource, existingDraft)) {
        delete draftGroup[language];
    } else {
        draftGroup[language] = {
            sourceCode: normalizedSource,
            updatedAt: new Date().toISOString()
        };
    }

    if (Object.keys(draftGroup).length === 0) {
        delete nextDrafts[problemKey];
    } else {
        nextDrafts[problemKey] = draftGroup;
    }

    state.editorDrafts = nextDrafts;
    persistEditorDrafts();
    renderDraftStatus();

    if (previousProblemHasDraft !== hasProblemDraft(problemId)) {
        renderProblemList();
    }
}

function clearDraftForContext(problemId, language, showMessage = false) {
    if (!problemId || !language) {
        return;
    }

    persistDraftForContext(problemId, language, "");
    refs.sourceCode.value = selectedProblemStarterCode(language);
    updateEditorNote();
    renderDraftStatus();

    if (showMessage) {
        showFeedback(`${language} taslagi temizlendi.`, "idle");
    }
}

function clearAllDraftsForProblem(problemId, showMessage = false) {
    if (!problemId) {
        return;
    }

    const previousProblemHasDraft = hasProblemDraft(problemId);
    const problemKey = String(problemId);
    const nextDrafts = {
        ...state.editorDrafts
    };
    delete nextDrafts[problemKey];
    state.editorDrafts = nextDrafts;
    persistEditorDrafts();

    refs.sourceCode.value = selectedProblemStarterCode(refs.language.value);
    renderDraftStatus();
    if (previousProblemHasDraft) {
        renderProblemList();
    }

    if (showMessage) {
        showFeedback("Secili problemdeki tum draftlar silindi.", "idle");
    }
}

function hasProblemDraft(problemId) {
    const problemKey = String(problemId ?? "");
    return Object.keys(state.editorDrafts[problemKey] || {}).length > 0;
}

function getEditorDraft(problemId, language) {
    if (!problemId || !language) {
        return null;
    }

    return state.editorDrafts[String(problemId)]?.[language] || null;
}

function listProblemDraftLanguages(problemId) {
    if (!problemId) {
        return [];
    }

    return Object.entries(state.editorDrafts[String(problemId)] || {})
        .map(([language, draft]) => ({
            language,
            updatedAt: draft?.updatedAt || null
        }))
        .sort((left, right) => {
            if (!left.updatedAt && !right.updatedAt) {
                return left.language.localeCompare(right.language);
            }
            if (!left.updatedAt) {
                return 1;
            }
            if (!right.updatedAt) {
                return -1;
            }
            return right.updatedAt.localeCompare(left.updatedAt);
        });
}

function loadEditorDrafts() {
    try {
        const rawDrafts = localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY);
        if (!rawDrafts) {
            return {};
        }

        const parsed = JSON.parse(rawDrafts);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
    } catch (error) {
        return {};
    }
}

function persistEditorDrafts() {
    localStorage.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(state.editorDrafts));
}

function shouldPersistDraft(problemId, language, sourceCode, existingDraft) {
    const starterSource = resolveProblemStarterCode(problemId, language);
    return Boolean(existingDraft) || String(sourceCode ?? "") !== starterSource;
}

function resolveProblemStarterCode(problemId, language) {
    const selectedProblemMatches = state.selectedProblem?.id === problemId;
    const problem = selectedProblemMatches
        ? state.selectedProblem
        : state.problems.find((entry) => entry.id === problemId);

    const problemStarter = problem?.starterCodes?.[language];
    if (problemStarter && String(problemStarter).trim()) {
        return String(problemStarter);
    }

    return starterTemplate(language);
}

function difficultyClass(difficulty) {
    switch ((difficulty || "").toUpperCase()) {
        case "EASY":
            return "difficulty--easy";
        case "MEDIUM":
            return "difficulty--medium";
        case "HARD":
            return "difficulty--hard";
        default:
            return "difficulty--muted";
    }
}

function shorten(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || "";
    }
    return `${text.slice(0, maxLength - 1)}...`;
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}

function formatShortDate(value) {
    if (!value) {
        return "-";
    }

    const date = typeof value === "string"
        ? new Date(value.length > 10 ? value : `${value}T00:00:00`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit"
    }).format(date);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
