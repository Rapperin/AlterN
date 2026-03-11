const AUTH_TOKEN_STORAGE_KEY = "altern.auth.token";
const EDITOR_DRAFT_STORAGE_KEY = "altern.editor.drafts.v1";

const state = {
    problems: [],
    filteredProblems: [],
    selectedProblemId: null,
    selectedProblem: null,
    workspaceSummary: null,
    userDashboard: null,
    globalLeaderboard: null,
    problemLeaderboard: null,
    problemScope: "ALL",
    problemDifficultyFilter: "ALL",
    problemTagFilter: "ALL",
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
    draftSaveTimerId: null
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
    adminPanel: document.getElementById("adminPanel"),
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
    communityLeaderboardCard: document.getElementById("communityLeaderboardCard"),
    progressSummary: document.getElementById("progressSummary"),
    problemList: document.getElementById("problemList"),
    problemTitle: document.getElementById("problemTitle"),
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
    problemTags: document.getElementById("problemTags"),
    problemExampleList: document.getElementById("problemExampleList"),
    visibleTestcaseCount: document.getElementById("visibleTestcaseCount"),
    submissionCount: document.getElementById("submissionCount"),
    viewerStatus: document.getElementById("viewerStatus"),
    problemTimeLimit: document.getElementById("problemTimeLimit"),
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
    editorNote: document.getElementById("editorNote"),
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
    await hydrateAuth();
    updateEditorNote();
    applyStarterTemplate();
    await Promise.all([
        loadProblems(),
        loadGlobalLeaderboard()
    ]);
}

function bindEvents() {
    refs.problemSearch.addEventListener("input", renderProblemList);
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
    refs.replayForm.addEventListener("submit", runReplay);
    refs.replayClearButton.addEventListener("click", resetReplayPanel);
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
        }
    } catch (error) {
        showFeedback(error.message, "error");
        renderProblemEmptyState("Problem listesi yuklenemedi.");
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

async function loadUserDashboard() {
    if (!state.currentUser || !state.authToken) {
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

        const [problem, testCases, submissionsPage, workspaceSummary, problemLeaderboard] = await Promise.all([
            fetchJson(`/api/problems/${problemId}`, {
                headers: authHeaders()
            }),
            fetchJson(`/api/problems/${problemId}/testcases`),
            submissionsPromise,
            workspacePromise,
            fetchJson(`/api/problems/${problemId}/leaderboard`, {
                headers: authHeaders()
            })
        ]);

        state.selectedProblem = problem;
        state.workspaceSummary = workspaceSummary;
        state.visibleTestCases = testCases;
        state.submissions = submissionsPage.content || [];
        state.problemLeaderboard = problemLeaderboard;
        populateProblemForm(problem);
        resetTestCaseEditor();
        renderSelectedProblem();
        renderProblemLeaderboard();
        renderWorkspaceSummary();
        renderSamples();
        renderSubmissions();
        await loadAdminTestCases(problemId);
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
        renderProblemLeaderboard();
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
            && matchesProblemTag(problem);
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
                <span class="badge">${problem.timeLimitMs ?? 5000} ms</span>
                <span class="badge">${problem.submissionCount} submission</span>
                ${state.currentUser ? `<span class="badge ${statusPillClass(problem.viewerStatus)}">You: ${escapeHtml(formatViewerStatus(problem.viewerStatus))}</span>` : ""}
                ${hasProblemDraft(problem.id) ? `<span class="badge badge--accent">Draft</span>` : ""}
                ${continueProblemId === problem.id ? `<span class="badge badge--accent">Continue</span>` : ""}
                ${suggestedProblemId === problem.id ? `<span class="badge badge--accent-soft">Next</span>` : ""}
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
                        class="dashboard-card__item leaderboard-item ${entry.recentAcceptedProblemId ? "dashboard-card__item--interactive" : ""} ${entry.viewer ? "leaderboard-item--viewer" : ""}"
                        ${entry.recentAcceptedProblemId ? `data-leaderboard-problem-id="${entry.recentAcceptedProblemId}"` : ""}
                        ${entry.recentAcceptedProblemTitle ? `data-leaderboard-label="${escapeHtml(entry.recentAcceptedProblemTitle)}"` : ""}>
                        <strong>#${entry.rank} ${escapeHtml(entry.username || "User")}</strong>
                        <p>${entry.solvedProblems ?? 0} solved | ${entry.acceptanceRate ?? 0}% accepted | ${escapeHtml(entry.mostUsedLanguage || "-")}</p>
                        <p>${entry.recentAcceptedProblemTitle ? `Son solved: ${escapeHtml(entry.recentAcceptedProblemTitle)} | ${formatDate(entry.recentAcceptedAt)}` : "Henuz accepted problemi yok."}</p>
                    </article>
                `).join("")}
            </div>
        </div>
    `;

    refs.communityLeaderboardCard.querySelectorAll("[data-leaderboard-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void openDashboardProblem(
                Number(entry.dataset.leaderboardProblemId),
                null,
                entry.dataset.leaderboardLabel || "Hall of Fame"
            );
        });
    });
}

function renderProblemFacets() {
    const tags = [...new Set(
        state.problems.flatMap((problem) => problem.tags || [])
    )].sort((left, right) => left.localeCompare(right));

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
    refs.problemTimeLimit.textContent = `${state.selectedProblem.timeLimitMs ?? 5000} ms`;
    renderProblemTags();
    renderProblemExamples();
    renderHint();
    renderEditorial();
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
                <article class="dashboard-card__item leaderboard-item ${entry.viewer ? "leaderboard-item--viewer" : ""}">
                    <strong>#${entry.rank} ${escapeHtml(entry.username || "User")}</strong>
                    <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${entry.memoryUsage ?? 0} MB</p>
                    <p>${formatDate(entry.acceptedAt)}</p>
                </article>
            `).join("")}
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

        showFeedback(
            [
                `${submission.status}`,
                `${submission.passedTestCount}/${submission.totalTestCount} tests`,
                `${submission.executionTime ?? 0} ms`,
                `${submission.memoryUsage ?? 0} MB`,
                submission.verdictMessage
            ].filter(Boolean).join(" | "),
            submission.status === "ACCEPTED" ? "success" : "error"
        );

        await Promise.all([
            selectProblem(state.selectedProblemId),
            loadUserDashboard(),
            loadGlobalLeaderboard()
        ]);
    } catch (error) {
        showFeedback(error.message, "error");
    } finally {
        refs.submitButton.disabled = false;
        refs.submitButton.textContent = "Submit";
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
        refs.problemCreateTimeLimit.value = "5000";
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
    const timeLimitMs = state.selectedProblem?.timeLimitMs ?? 5000;

    if (refs.language.value === "JAVA") {
        refs.editorNote.textContent = `JAVA gercek derlenir. Sure limiti: ${timeLimitMs} ms. Beklenen format: Solution.solve(...) veya Solution.main(...).`;
        return;
    }

    if (refs.language.value === "PYTHON") {
        refs.editorNote.textContent = `PYTHON gercek calisir. Sure limiti: ${timeLimitMs} ms. stdin oku ve sonucu stdout'a yazdir.`;
        return;
    }

    refs.editorNote.textContent = `CPP gercek derlenir. Sure limiti: ${timeLimitMs} ms. stdin oku ve sonucu stdout'a yazdir.`;
}

function renderProblemEmptyState(message = "Henuz listelenecek problem yok.") {
    flushDraftSaveTimer();
    state.selectedProblemId = null;
    state.selectedProblem = null;
    state.problemLeaderboard = null;
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
    refs.visibleTestcaseCount.textContent = "0";
    refs.submissionCount.textContent = "0";
    refs.viewerStatus.textContent = "Login";
    refs.problemTimeLimit.textContent = "5000 ms";
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
    renderReplayBaseline();
    renderReplayComparison();
    renderDraftStatus();
}

function renderAdminPanel() {
    const adminMode = isAdmin();
    refs.adminPanel.hidden = !adminMode;

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

function showFeedback(message, type = "idle") {
    refs.submissionFeedback.textContent = message;
    refs.submissionFeedback.className = `feedback feedback--${type}`;
}

function showAuthFeedback(message, type = "idle") {
    refs.authFeedback.textContent = message;
    refs.authFeedback.className = `auth-feedback auth-feedback--${type}`;
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
    state.globalLeaderboard = null;
    state.problemLeaderboard = null;

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, state.authToken);
    refs.authPassword.value = "";
    renderAuthState();
    showAuthFeedback(message, "success");
}

function clearAuthState(showMessage) {
    state.authToken = null;
    state.currentUser = null;
    state.userDashboard = null;
    state.globalLeaderboard = null;
    state.problemLeaderboard = null;
    state.problemScope = "ALL";
    state.problemDifficultyFilter = "ALL";
    state.problemTagFilter = "ALL";
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
        timeLimitMs: Number(refs.problemCreateTimeLimit.value || 5000),
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
    refs.problemCreateTimeLimit.value = String(problem.timeLimitMs ?? 5000);
    refs.problemCreateTags.value = (problem.tags || []).join(", ");
    refs.problemCreateExamples.value = JSON.stringify(problem.examples || [], null, 2);
    refs.problemCreateStarterCodes.value = JSON.stringify(problem.starterCodes || {}, null, 2);
}

function clearProblemForm() {
    refs.problemCreateForm.reset();
    refs.problemCreateDifficulty.value = "EASY";
    refs.problemCreateTimeLimit.value = "5000";
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
    const recentAccepted = dashboard.recentAccepted || [];

    refs.userDashboardCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Your Dashboard</p>
                <h3>${escapeHtml(dashboard.username || "User")}</h3>
            </div>
            <span class="badge">${dashboard.acceptanceRate ?? 0}% accepted</span>
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
                <span>Remaining</span>
                <strong>${dashboard.remainingProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Main lang</span>
                <strong>${escapeHtml(dashboard.mostUsedLanguage || "-")}</strong>
            </article>
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
                entry.dataset.dashboardSubmissionId ? Number(entry.dataset.dashboardSubmissionId) : null,
                entry.dataset.dashboardLabel || "Dashboard"
            );
        });
    });
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
        </div>
        <div class="filter-group">
            ${renderProblemScopeButton("ALL", "Tum")}
            ${renderProblemScopeButton("REMAINING", "Remaining")}
            ${renderProblemScopeButton("ATTEMPTED", "Attempted")}
            ${renderProblemScopeButton("SOLVED", "Solved")}
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

    refs.replayBaselineCard.innerHTML = `
        <div class="replay-baseline">
            <div>
                <p class="workspace-debug__eyebrow">Submission Baseline</p>
                <p><strong>#${state.selectedCompareSubmission.id}</strong> | ${escapeHtml(state.selectedCompareSubmission.status)} | ${escapeHtml(state.selectedCompareSubmission.language)}</p>
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
        timeLimitMs: Number(payload.timeLimitMs || 5000),
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

async function openDashboardProblem(problemId, submissionId, label) {
    if (!problemId) {
        return;
    }

    await selectProblem(problemId);

    if (submissionId && state.currentUser && state.authToken) {
        await loadSubmissionIntoEditor(submissionId, label);
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

    return true;
}

function matchesProblemDifficulty(problem) {
    return state.problemDifficultyFilter === "ALL" || problem.difficulty === state.problemDifficultyFilter;
}

function matchesProblemTag(problem) {
    return state.problemTagFilter === "ALL" || (problem.tags || []).includes(state.problemTagFilter);
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

    return status.replaceAll("_", " ");
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
        default:
            return "status-pill--login";
    }
}

function isAdmin() {
    return state.currentUser?.role === "ADMIN";
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

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
