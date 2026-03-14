import { getAuthToken } from "../shared/session.js";
import { applyAuthFeedback } from "../shared/auth-ui.js";
import { formatDate } from "../shared/ui.js";
import {
    normalizeAdminAttentionFilter as normalizeAdminAttentionFilterView,
    renderAuthoringFocusCard as renderAuthoringFocusCardView,
    renderCatalogHealth as renderCatalogHealthView,
    renderProblemFacets as renderProblemFacetsView,
    renderProblemList as renderProblemListView,
    renderSelectedProblemCard as renderSelectedProblemCardView
} from "./sanctum-catalog.js";
import {
    applyAuthoringScaffold as applyAuthoringScaffoldView,
    clearProblemForm as clearProblemFormView,
    bulkCreateProblems as bulkCreateProblemsView,
    createProblem as createProblemView,
    deleteProblem as deleteProblemView,
    focusAuthoringTarget as focusAuthoringTargetView,
    populateProblemForm as populateProblemFormView,
    updateProblem as updateProblemView
} from "./sanctum-authoring.js";
import {
    bulkCreateTestCases as bulkCreateTestCasesView,
    createTestCase as createTestCaseView,
    loadAdminTestCases as loadAdminTestCasesView,
    renderAdminEditors as renderAdminEditorsView,
    resetTestCaseEditor as resetTestCaseEditorView
} from "./sanctum-testcases.js";
import {
    bootstrap as bootstrapView,
    clearCatalogFilters as clearCatalogFiltersView,
    handleProblemSearchInput as handleProblemSearchInputView,
    loadCatalogHealth as loadCatalogHealthView,
    loadProblems as loadProblemsView,
    login as loginView,
    logout as logoutView,
    refreshCatalogView as refreshCatalogViewView,
    register as registerView,
    selectProblem as selectProblemView
} from "./sanctum-shell.js";

const DEFAULT_TIME_LIMIT_MS = 5000;
const DEFAULT_MEMORY_LIMIT_MB = 256;

const state = {
    problems: [],
    filteredProblems: [],
    selectedProblemId: null,
    selectedProblem: null,
    visibleTestCases: [],
    adminTestCases: [],
    catalogHealth: null,
    editingTestCaseId: null,
    problemDifficultyFilter: "ALL",
    problemTagFilter: "ALL",
    adminAttentionFilter: "ALL",
    authToken: getAuthToken(),
    currentUser: null
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
    problemCount: document.getElementById("problemCount"),
    problemSearch: document.getElementById("problemSearch"),
    problemFacetCard: document.getElementById("problemFacetCard"),
    selectedProblemCard: document.getElementById("selectedProblemCard"),
    problemList: document.getElementById("problemList"),
    catalogHealthCard: document.getElementById("catalogHealthCard"),
    authoringFocusCard: document.getElementById("authoringFocusCard"),
    authorFeedback: document.getElementById("authorFeedback"),
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
    problemClearButton: document.getElementById("problemClearButton"),
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
    adminTestCaseList: document.getElementById("adminTestCaseList")
};

function buildShellContext() {
    return {
        state,
        refs,
        clearCatalogFilters,
        handleProblemSearchInput,
        refreshCatalogView,
        renderProblemFacets,
        renderProblemList,
        renderSelectedProblemCard,
        renderAdminEditors,
        renderCatalogHealth,
        renderAuthoringFocusCard,
        showAuthFeedback,
        showAuthorFeedback,
        isAdmin,
        populateProblemForm,
        resetTestCaseEditor,
        loadAdminTestCases,
        createProblem,
        updateProblem,
        clearProblemForm,
        deleteProblem,
        bulkCreateProblems,
        createTestCase,
        bulkCreateTestCases,
        normalizeAdminAttentionFilter
    };
}

function buildCatalogContext() {
    return {
        state,
        refs,
        defaultTimeLimitMs: DEFAULT_TIME_LIMIT_MS,
        defaultMemoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
        clearCatalogFilters,
        isAdmin,
        selectProblem,
        applyAuthoringScaffold,
        focusAuthoringTarget,
        refreshCatalogView,
        renderProblemFacets,
        renderProblemList,
        renderCatalogHealth,
        renderAuthoringFocusCard
    };
}

function buildAuthoringContext() {
    return {
        state,
        refs,
        defaultTimeLimitMs: DEFAULT_TIME_LIMIT_MS,
        defaultMemoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
        isAdmin,
        showAuthorFeedback,
        focusAuthoringTarget,
        loadProblems,
        selectProblem
    };
}

document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
});

function bootstrap() {
    return bootstrapView(buildShellContext());
}

function loadProblems(preferredProblemId = state.selectedProblemId) {
    return loadProblemsView(buildShellContext(), preferredProblemId);
}

function refreshCatalogView(options = {}) {
    return refreshCatalogViewView(buildShellContext(), options);
}

function selectProblem(problemId) {
    return selectProblemView(buildShellContext(), problemId);
}

function loadCatalogHealth() {
    return loadCatalogHealthView(buildShellContext());
}

function renderProblemFacets() {
    return renderProblemFacetsView(buildCatalogContext());
}

function renderProblemList() {
    return renderProblemListView(buildCatalogContext());
}

function renderSelectedProblemCard() {
    return renderSelectedProblemCardView(buildCatalogContext());
}

function renderCatalogHealth() {
    return renderCatalogHealthView(buildCatalogContext());
}

function renderAuthoringFocusCard() {
    return renderAuthoringFocusCardView(buildCatalogContext());
}

async function loadAdminTestCases(problemId) {
    return loadAdminTestCasesView(buildAuthoringContext(), problemId);
}

function renderAdminEditors() {
    return renderAdminEditorsView(buildAuthoringContext());
}

async function createProblem(event) {
    return createProblemView(buildAuthoringContext(), event);
}

async function updateProblem() {
    return updateProblemView(buildAuthoringContext());
}

async function deleteProblem() {
    return deleteProblemView(buildAuthoringContext());
}

async function bulkCreateProblems(event) {
    return bulkCreateProblemsView(buildAuthoringContext(), event);
}

async function createTestCase(event) {
    return createTestCaseView(buildAuthoringContext(), event);
}

async function bulkCreateTestCases(event) {
    return bulkCreateTestCasesView(buildAuthoringContext(), event);
}

function resetTestCaseEditor() {
    return resetTestCaseEditorView(buildAuthoringContext());
}

function populateProblemForm(problem) {
    return populateProblemFormView(buildAuthoringContext(), problem);
}

function clearProblemForm() {
    return clearProblemFormView(buildAuthoringContext());
}

function applyAuthoringScaffold(flag) {
    return applyAuthoringScaffoldView(buildAuthoringContext(), flag);
}

function focusAuthoringTarget(target, options = {}) {
    return focusAuthoringTargetView(buildAuthoringContext(), target, options);
}

function normalizeAdminAttentionFilter() {
    return normalizeAdminAttentionFilterView(buildCatalogContext());
}

function handleProblemSearchInput() {
    return handleProblemSearchInputView(buildShellContext());
}

function clearCatalogFilters() {
    return clearCatalogFiltersView(buildShellContext());
}

function showAuthFeedback(message, type = "idle") {
    applyAuthFeedback(refs, message, type, {
        classNameBuilder: (nextType) => nextType === "success"
            ? "auth-feedback auth-feedback--success"
            : nextType === "error"
                ? "auth-feedback auth-feedback--error"
                : "auth-feedback"
    });
}

function showAuthorFeedback(message, type = "idle") {
    refs.authorFeedback.textContent = message;
    refs.authorFeedback.className = `feedback ${
        type === "success"
            ? "feedback--success"
            : type === "error"
                ? "feedback--error"
                : "feedback--idle"
    }`;
}

function login(event) {
    return loginView(buildShellContext(), event);
}

function register() {
    return registerView(buildShellContext());
}

function logout() {
    return logoutView(buildShellContext());
}

function isAdmin() {
    return state.currentUser?.role === "ADMIN";
}
