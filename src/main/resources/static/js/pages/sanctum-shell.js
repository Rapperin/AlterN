import { fetchJson } from "../shared/api.js";
import { bindAuthControls, readAuthCredentials } from "../shared/auth-form.js";
import { applyAuthPanelState } from "../shared/auth-ui.js";
import { normalizeProblemDifficulty, readPositiveNumber } from "../shared/arena-links.js";
import { replaceCurrentUrl, setUrlSearchParam } from "../shared/page-links.js";
import { authHeaders as buildAuthHeaders, clearAuthToken, setAuthToken } from "../shared/session.js";
import { renderEmptyState } from "../shared/ui.js";

export async function bootstrap(context) {
    bindEvents(context);
    await hydrateAuth(context);
    const initialContext = readInitialCatalogContext();
    context.state.problemDifficultyFilter = initialContext.difficulty || "ALL";
    context.state.problemTagFilter = initialContext.tag || "ALL";
    context.state.adminAttentionFilter = initialContext.attention || "ALL";
    context.refs.problemSearch.value = initialContext.search;
    await loadProblems(context, initialContext.problemId);
    await loadCatalogHealth(context);
}

export async function loadProblems(context, preferredProblemId = context.state.selectedProblemId) {
    const { state, refs } = context;
    try {
        state.problems = await fetchAllProblems(context);
        await refreshCatalogView(context, { preferredProblemId });
    } catch (error) {
        state.problems = [];
        state.filteredProblems = [];
        refs.problemCount.textContent = "0 problem";
        refs.problemList.innerHTML = renderEmptyState("Problem listesi yuklenemedi.");
        context.showAuthorFeedback(error.message || "Problem listesi yuklenemedi.", "error");
    }
}

export async function refreshCatalogView(context, options = {}) {
    const { state, refs } = context;
    const preferredProblemId = options.preferredProblemId ?? state.selectedProblemId;

    context.renderProblemList();
    context.renderProblemFacets();
    context.renderCatalogHealth();
    context.renderAuthoringFocusCard();

    if (refs.problemCount) {
        refs.problemCount.textContent = state.filteredProblems.length === state.problems.length
            ? `${state.problems.length} problem`
            : `${state.filteredProblems.length}/${state.problems.length} problem`;
    }

    if (state.problems.length === 0) {
        clearSelectedProblemState(context);
        return;
    }

    if (state.filteredProblems.length === 0) {
        clearSelectedProblemState(context);
        syncSanctumUrl(context, null);
        return;
    }

    const preferredVisible = preferredProblemId
        ? state.filteredProblems.some((problem) => problem.id === preferredProblemId)
        : false;
    const nextProblemId = preferredVisible
        ? preferredProblemId
        : state.filteredProblems[0]?.id ?? null;

    if (!nextProblemId) {
        clearSelectedProblemState(context);
        syncSanctumUrl(context, null);
        return;
    }

    if (!state.selectedProblem || state.selectedProblemId !== nextProblemId) {
        await selectProblem(context, nextProblemId);
        return;
    }

    syncSanctumUrl(context, state.selectedProblemId);
    context.renderSelectedProblemCard();
    context.renderAdminEditors();
}

export function handleProblemSearchInput(context) {
    void refreshCatalogView(context);
}

export function clearCatalogFilters(context) {
    context.state.problemDifficultyFilter = "ALL";
    context.state.problemTagFilter = "ALL";
    context.state.adminAttentionFilter = "ALL";
    if (context.refs.problemSearch) {
        context.refs.problemSearch.value = "";
    }
    void refreshCatalogView(context);
}

export async function selectProblem(context, problemId) {
    const { state } = context;
    state.selectedProblemId = problemId;
    syncSanctumUrl(context, problemId);
    context.renderProblemList();

    try {
        const [problem, testCases] = await Promise.all([
            fetchJson(`/api/problems/${problemId}`, {
                headers: authHeaders(context)
            }),
            fetchJson(`/api/problems/${problemId}/testcases`, {
                headers: authHeaders(context)
            })
        ]);

        state.selectedProblem = problem;
        state.visibleTestCases = testCases;
        context.populateProblemForm(problem);
        context.resetTestCaseEditor();
        context.renderSelectedProblemCard();
        await Promise.all([
            context.loadAdminTestCases(problemId),
            loadCatalogHealth(context)
        ]);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Secili problem yuklenemedi.", "error");
    }
}

export async function loadCatalogHealth(context) {
    const { state } = context;
    if (!state.currentUser || !state.authToken || !context.isAdmin()) {
        state.catalogHealth = null;
        state.adminAttentionFilter = "ALL";
        await refreshCatalogView(context, { preferredProblemId: state.selectedProblemId });
        return;
    }

    try {
        state.catalogHealth = await fetchJson("/api/admin/catalog/health", {
            headers: authHeaders(context)
        });
        context.normalizeAdminAttentionFilter();
    } catch (error) {
        state.catalogHealth = null;
        context.showAuthorFeedback(error.message || "Catalog health yuklenemedi.", "error");
    }

    await refreshCatalogView(context, { preferredProblemId: state.selectedProblemId });
}

export async function login(context, event) {
    event.preventDefault();
    const credentials = readAuthCredentials(context.refs, { trimPassword: true });
    if (!credentials) {
        context.showAuthFeedback("Username ve password gerekli.", "error");
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
        await Promise.all([
            loadProblems(context, context.state.selectedProblemId),
            loadCatalogHealth(context)
        ]);
    } catch (error) {
        context.showAuthFeedback(error.message || "Giris basarisiz.", "error");
    }
}

export async function register(context) {
    const credentials = readAuthCredentials(context.refs, { trimPassword: true });
    if (!credentials) {
        context.showAuthFeedback("Register icin username ve password gerekli.", "error");
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
        await Promise.all([
            loadProblems(context, context.state.selectedProblemId),
            loadCatalogHealth(context)
        ]);
    } catch (error) {
        context.showAuthFeedback(error.message || "Kayit basarisiz.", "error");
    }
}

export async function logout(context) {
    const { state } = context;
    state.authToken = null;
    state.currentUser = null;
    clearAuthToken();
    state.catalogHealth = null;
    state.adminAttentionFilter = "ALL";
    state.adminTestCases = [];
    state.editingTestCaseId = null;
    renderAuthState(context);
    await loadProblems(context, state.selectedProblemId);
}

function bindEvents(context) {
    const { refs } = context;
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
    refs.problemSearch?.addEventListener("input", context.handleProblemSearchInput);
    refs.problemCreateForm?.addEventListener("submit", (event) => {
        void context.createProblem(event);
    });
    refs.problemUpdateButton?.addEventListener("click", () => {
        void context.updateProblem();
    });
    refs.problemClearButton?.addEventListener("click", context.clearProblemForm);
    refs.problemDeleteButton?.addEventListener("click", () => {
        void context.deleteProblem();
    });
    refs.problemBulkForm?.addEventListener("submit", (event) => {
        void context.bulkCreateProblems(event);
    });
    refs.testCaseCreateForm?.addEventListener("submit", (event) => {
        void context.createTestCase(event);
    });
    refs.testCaseCancelButton?.addEventListener("click", context.resetTestCaseEditor);
    refs.testCaseBulkForm?.addEventListener("submit", (event) => {
        void context.bulkCreateTestCases(event);
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
        context.showAuthFeedback(`${state.currentUser.username} oturumu hazir.`, "success");
    } catch (error) {
        state.authToken = null;
        state.currentUser = null;
        clearAuthToken();
        context.showAuthFeedback("Oturum gecersiz. Tekrar giris yap.", "error");
    }

    renderAuthState(context);
}

function renderAuthState(context) {
    applyAuthPanelState({
        refs: context.refs,
        authToken: context.state.authToken,
        currentUser: context.state.currentUser,
        unauthenticatedStatusText: "Admin girisi"
    });

    context.renderCatalogHealth();
    context.renderAuthoringFocusCard();
    context.renderSelectedProblemCard();
    context.renderAdminEditors();
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

function readInitialCatalogContext() {
    const params = new URLSearchParams(window.location.search);
    return {
        problemId: readPositiveNumber(params.get("problemId")),
        difficulty: normalizeProblemDifficulty(params.get("difficulty")),
        tag: params.get("tag")?.trim() || null,
        attention: normalizeAdminAttentionFilterParam(params.get("attention")),
        search: params.get("search")?.trim() || ""
    };
}

function authHeaders(context, extraHeaders = {}) {
    return buildAuthHeaders(context.state.authToken, extraHeaders);
}

function applyAuthResponse(context, response, message) {
    const { state } = context;
    state.authToken = response.token;
    state.currentUser = {
        username: response.username,
        role: response.role
    };
    setAuthToken(response.token);
    context.showAuthFeedback(message, "success");
    renderAuthState(context);
}

function syncSanctumUrl(context, problemId) {
    replaceCurrentUrl((url) => {
        setUrlSearchParam(url, "problemId", problemId || null);
        setUrlSearchParam(url, "difficulty", context.state.problemDifficultyFilter && context.state.problemDifficultyFilter !== "ALL"
            ? context.state.problemDifficultyFilter
            : null);
        setUrlSearchParam(url, "tag", context.state.problemTagFilter && context.state.problemTagFilter !== "ALL"
            ? context.state.problemTagFilter
            : null);
        setUrlSearchParam(url, "attention", context.state.adminAttentionFilter && context.state.adminAttentionFilter !== "ALL"
            ? context.state.adminAttentionFilter
            : null);
        setUrlSearchParam(url, "search", context.refs.problemSearch?.value?.trim() || null);
    });
}

function clearSelectedProblemState(context) {
    const { state } = context;
    state.selectedProblemId = null;
    state.selectedProblem = null;
    state.visibleTestCases = [];
    state.adminTestCases = [];
    state.editingTestCaseId = null;
    context.populateProblemForm(null);
    context.renderSelectedProblemCard();
    context.resetTestCaseEditor();
}

function normalizeAdminAttentionFilterParam(value) {
    const normalized = String(value || "").toUpperCase();
    return [
        "ALL",
        "ATTENTION",
        "NEEDS_HIDDEN_DEPTH",
        "LOW_TOTAL_CASE_COVERAGE",
        "NEEDS_PUBLIC_SAMPLE",
        "LOW_EXAMPLE_DEPTH",
        "MISSING_HINT",
        "MISSING_EDITORIAL"
    ].includes(normalized)
        ? normalized
        : null;
}
