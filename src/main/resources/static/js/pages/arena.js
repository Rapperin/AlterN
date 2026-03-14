import { getAuthToken } from "../shared/session.js";
import {
    escapeHtml,
    formatViewerStatus
} from "../shared/ui.js";
import {
    renderProblemFacets as renderProblemFacetsView,
    renderProblemList as renderProblemListView,
    renderProgressSummary as renderProgressSummaryView
} from "./arena-archive.js";
import {
    renderEditorial as renderEditorialView,
    renderHint as renderHintView,
    renderProblemBookmarkButton as renderProblemBookmarkButtonView,
    renderProblemExamples as renderProblemExamplesView,
    renderProblemLeaderboard as renderProblemLeaderboardView,
    renderProblemStats as renderProblemStatsView,
    renderProblemTags as renderProblemTagsView,
    renderSamples as renderSamplesView,
    renderSelectedProblem as renderSelectedProblemView
} from "./arena-codex.js";
import {
    applyStarterTemplate as applyStarterTemplateView,
    clearAllDraftsForProblem as clearAllDraftsForProblemView,
    clearDraftForContext as clearDraftForContextView,
    currentEditorSigil as currentEditorSigilView,
    flushCurrentDraft as flushCurrentDraftView,
    flushDraftSaveTimer as flushDraftSaveTimerView,
    getEditorDraft as getEditorDraftView,
    getFirstAvailableLanguage as getFirstAvailableLanguageView,
    getLanguageExecutionMessage as getLanguageExecutionMessageView,
    handleLanguageChange as handleLanguageChangeView,
    hasProblemDraft as hasProblemDraftView,
    isLanguageExecutionAvailable as isLanguageExecutionAvailableView,
    listProblemDraftLanguages as listProblemDraftLanguagesView,
    loadProblemDraftIntoEditor as loadProblemDraftIntoEditorView,
    renderChamberPrompt as renderChamberPromptView,
    renderEditorForgeStatus as renderEditorForgeStatusView,
    renderEditorLanguageRecommendation as renderEditorLanguageRecommendationView,
    renderEditorRuntimeAssist as renderEditorRuntimeAssistView,
    resolveEditorLanguageRecommendation as resolveEditorLanguageRecommendationView,
    refreshLanguageAvailability as refreshLanguageAvailabilityView,
    scheduleDraftSave as scheduleDraftSaveView,
    selectedProblemStarterCode as selectedProblemStarterCodeView,
    switchEditorLanguage as switchEditorLanguageView,
    syncEditorForSelectedProblem as syncEditorForSelectedProblemView,
    updateEditorNote as updateEditorNoteView
} from "./arena-forge.js";
import {
    clearReplayBaseline as clearReplayBaselineView,
    loadReplayFromCase as loadReplayFromCaseView,
    loadReplayFromFailure as loadReplayFromFailureView,
    primeReplayFromFirstSample as primeReplayFromFirstSampleView,
    renderDraftStatus as renderDraftStatusView,
    renderReplayBaseline as renderReplayBaselineView,
    renderReplayComparison as renderReplayComparisonView,
    renderReplayResult as renderReplayResultView,
    renderWorkspaceDiagnostics as renderWorkspaceDiagnosticsView,
    resetReplayPanel as resetReplayPanelView,
    selectReplayBaseline as selectReplayBaselineView
} from "./arena-echoes.js";
import {
    copyRuntimeCommand as copyRuntimeCommandView,
    getLocalToolchainHealth as getLocalToolchainHealthView,
    getMissingLocalToolchains as getMissingLocalToolchainsView,
    getRunnerHealthDescriptor as getRunnerHealthDescriptorView,
    isDockerExecutionActive as isDockerExecutionActiveView,
    renderPreflightBanner as renderPreflightBannerView,
    renderRunnerHealth as renderRunnerHealthView
} from "./arena-runtime.js";
import {
    clearPendingDashboardRefresh as clearPendingDashboardRefreshView,
    openUserProfile as openUserProfileView,
    refreshPendingSubmissionViews as refreshPendingSubmissionViewsView,
    renderContinuumGate as renderContinuumGateView,
    renderWorkspaceSummary as renderWorkspaceSummaryView,
    runReplay as runReplayView,
    schedulePendingDashboardRefresh as schedulePendingDashboardRefreshView,
    toggleProblemBookmark as toggleProblemBookmarkView
} from "./arena-workspace.js";
import {
    loadSubmissionIntoEditor as loadSubmissionIntoEditorView,
    pollSubmissionUntilSettled as pollSubmissionUntilSettledView,
    renderSubmissions as renderSubmissionsView,
    resubmitExistingSubmission as resubmitExistingSubmissionView,
    showSubmissionOutcomeFeedback as showSubmissionOutcomeFeedbackView,
    submissionDebugSummary as submissionDebugSummaryView,
    submitSolution as submitSolutionView
} from "./arena-submissions.js";
import {
    authHeaders as authHeadersView,
    bootstrap as bootstrapView,
    handleProblemSearchInput as handleProblemSearchInputView,
    loadProblems as loadProblemsView,
    loadUserDashboard as loadUserDashboardView,
    refreshProblemArchive as refreshProblemArchiveView,
    renderProblemEmptyState as renderProblemEmptyStateView,
    selectProblem as selectProblemView,
    showFeedback as showFeedbackView,
    syncArenaUrl as syncArenaUrlView
} from "./arena-shell.js";
import {
    applyProblemScene as applyProblemSceneView,
    applyWorkspaceMode as applyWorkspaceModeView,
    pulseScene as pulseSceneView
} from "./arena-scene.js";
import {
    clearProblemFilters as clearProblemFiltersStateView,
    isAdmin as isAdminView,
    loadEditorDrafts as loadEditorDraftsView,
    matchesProblemDifficulty as matchesProblemDifficultyView,
    matchesProblemScope as matchesProblemScopeView,
    matchesProblemTag as matchesProblemTagView,
    persistDraftForContext as persistDraftForContextView,
    persistEditorDrafts as persistEditorDraftsView,
    resolveProblemStarterCode as resolveProblemStarterCodeView,
    setProblemDifficultyFilter as setProblemDifficultyFilterView,
    setProblemScope as setProblemScopeView,
    setProblemTagFilter as setProblemTagFilterView,
    starterTemplate as starterTemplateView,
    shouldPersistDraft as shouldPersistDraftView
} from "./arena-state.js";

const EDITOR_DRAFT_STORAGE_KEY = "altern.editor.drafts.v1";
const DEFAULT_TIME_LIMIT_MS = 5000;
const DEFAULT_MEMORY_LIMIT_MB = 256;
const SUBMISSION_POLL_INTERVAL_MS = 1500;
const SUBMISSION_POLL_MAX_ATTEMPTS = 40;
const DASHBOARD_PENDING_REFRESH_MS = 2500;
const SCENE_PULSE_MS = 1100;
const SCENE_PULSE_CLASSES = [
    "scene-pulse--shift",
    "scene-pulse--accepted",
    "scene-pulse--pending",
    "scene-pulse--failure",
    "scene-pulse--danger"
];

const state = {
    problems: [],
    filteredProblems: [],
    selectedProblemId: null,
    selectedProblem: null,
    workspaceSummary: null,
    runnerHealth: null,
    userDashboard: null,
    problemLeaderboard: null,
    problemStats: null,
    problemScope: "ALL",
    problemDifficultyFilter: "ALL",
    problemTagFilter: "ALL",
    selectedCompareSubmission: null,
    replayComparison: null,
    replayResult: null,
    visibleTestCases: [],
    submissions: [],
    authToken: getAuthToken(),
    currentUser: null,
    editorDrafts: loadEditorDraftsView(EDITOR_DRAFT_STORAGE_KEY),
    editorLanguageContext: "JAVA",
    draftSaveTimerId: null,
    runnerHealthRefreshing: false,
    pendingDashboardRefreshTimerId: null,
    scenePulseTimerId: null
};

const refs = {
    pageShell: document.querySelector(".page-shell"),
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
    problemCount: document.getElementById("problemCount"),
    problemSearch: document.getElementById("problemSearch"),
    problemFacetCard: document.getElementById("problemFacetCard"),
    runnerHealthCard: document.getElementById("runnerHealthCard"),
    continuumGateCard: document.getElementById("continuumGateCard"),
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
    editorForgeStatus: document.getElementById("editorForgeStatus"),
    editorStage: document.getElementById("editorStage"),
    editorLanguageRecommendation: document.getElementById("editorLanguageRecommendation"),
    editorNote: document.getElementById("editorNote"),
    editorRuntimeAssist: document.getElementById("editorRuntimeAssist"),
    draftStatusCard: document.getElementById("draftStatusCard"),
    submissionFeedback: document.getElementById("submissionFeedback"),
    submissionList: document.getElementById("submissionList")
};

function buildEchoContext() {
    return {
        state,
        refs,
        pulseScene,
        showFeedback,
        renderSubmissions,
        isLanguageExecutionAvailable,
        getLanguageExecutionMessage,
        getEditorDraft,
        listProblemDraftLanguages,
        loadProblemDraftIntoEditor,
        clearDraftForContext,
        clearAllDraftsForProblem,
        renderChamberPrompt
    };
}

function buildArchiveContext() {
    return {
        state,
        refs,
        clearProblemFilters,
        refreshProblemArchive,
        selectProblem,
        setProblemScope,
        setProblemDifficultyFilter,
        setProblemTagFilter,
        matchesProblemScope,
        matchesProblemDifficulty,
        matchesProblemTag,
        hasProblemDraft,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB
    };
}

function buildCodexContext() {
    return {
        state,
        refs,
        applyProblemScene,
        applyWorkspaceMode,
        setProblemTagFilter,
        renderProblemBookmarkButton,
        renderProblemTags,
        renderProblemExamples,
        renderHint,
        renderEditorial,
        renderEditorForgeStatus,
        loadReplayFromCase,
        openUserProfile,
        isAdmin,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB
    };
}

function buildForgeContext() {
    return {
        state,
        refs,
        EDITOR_DRAFT_STORAGE_KEY,
        getRunnerHealthDescriptor,
        isDockerExecutionActive,
        getLocalToolchainHealth,
        getMissingLocalToolchains,
        getFirstAvailableLanguage,
        isLanguageExecutionAvailable,
        getLanguageExecutionMessage,
        listProblemDraftLanguages,
        getEditorDraft,
        persistDraftForContext,
        persistEditorDrafts,
        renderDraftStatus,
        renderReplayBaseline,
        renderEditorLanguageRecommendation,
        renderEditorRuntimeAssist,
        renderEditorForgeStatus,
        renderProblemList,
        renderChamberPrompt,
        currentEditorSigil,
        selectedProblemStarterCode,
        starterTemplate,
        updateEditorNote,
        syncEditorForSelectedProblem,
        flushCurrentDraft,
        flushDraftSaveTimer,
        showFeedback,
        hasProblemDraft,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB,
        isAdmin,
        formatViewerStatus
    };
}

function buildWorkspaceContext() {
    return {
        state,
        refs,
        pulseScene,
        authHeaders,
        showFeedback,
        isAdmin,
        isLanguageExecutionAvailable,
        getLanguageExecutionMessage,
        renderReplayBaseline,
        renderReplayResult,
        renderReplayComparison,
        renderWorkspaceDiagnostics,
        renderEditorForgeStatus,
        renderChamberPrompt,
        selectReplayBaseline,
        renderDraftStatus,
        flushCurrentDraft,
        updateEditorNote,
        persistDraftForContext,
        selectProblem,
        loadUserDashboard,
        renderProblemBookmarkButton,
        loadProblems,
        SUBMISSION_POLL_INTERVAL_MS,
        SUBMISSION_POLL_MAX_ATTEMPTS,
        DASHBOARD_PENDING_REFRESH_MS,
        clearPendingDashboardRefresh,
        refreshPendingSubmissionViews,
        loadSubmissionIntoEditor,
        resubmitExistingSubmission,
        showSubmissionOutcomeFeedback
    };
}

function buildShellContext() {
    return {
        state,
        refs,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB,
        EDITOR_DRAFT_STORAGE_KEY,
        SCENE_PULSE_MS,
        SCENE_PULSE_CLASSES,
        renderContinuumGate,
        renderProblemStats,
        updateEditorNote,
        applyStarterTemplate,
        clearProblemFilters,
        handleLanguageChange,
        handleProblemSearchInput,
        primeReplayFromFirstSample,
        loadSubmissionIntoEditor,
        refreshProblemArchive,
        renderProblemFacets,
        renderProblemList,
        renderProgressSummary,
        renderSelectedProblem,
        renderProblemLeaderboard,
        renderWorkspaceSummary,
        renderSamples,
        renderSubmissions,
        renderProblemBookmarkButton,
        renderReplayBaseline,
        renderReplayComparison,
        renderDraftStatus,
        renderEditorForgeStatus,
        applyProblemScene,
        applyWorkspaceMode,
        pulseScene,
        flushCurrentDraft,
        flushDraftSaveTimer,
        resetReplayPanel,
        syncEditorForSelectedProblem,
        refreshLanguageAvailability,
        renderRunnerHealth,
        renderPreflightBanner,
        copyRuntimeCommand,
        switchEditorLanguage,
        clearPendingDashboardRefresh,
        schedulePendingDashboardRefresh,
        toggleProblemBookmark,
        scheduleDraftSave,
        submitSolution,
        runReplay
    };
}

function renderProblemList() {
    renderProblemListView(buildArchiveContext());
}

function renderProblemFacets() {
    renderProblemFacetsView(buildArchiveContext());
}

function renderProgressSummary() {
    renderProgressSummaryView(buildArchiveContext());
}

function renderSelectedProblem() {
    if (!renderSelectedProblemView(buildCodexContext())) {
        renderProblemEmptyState();
    }
}

function renderProblemBookmarkButton() {
    renderProblemBookmarkButtonView(buildCodexContext());
}

function renderProblemLeaderboard() {
    renderProblemLeaderboardView(buildCodexContext());
}

function renderProblemStats() {
    renderProblemStatsView(buildCodexContext());
}

function renderSamples() {
    renderSamplesView(buildCodexContext());
}

function renderProblemTags() {
    renderProblemTagsView(buildCodexContext());
}

function renderProblemExamples() {
    renderProblemExamplesView(buildCodexContext());
}

function renderEditorial() {
    renderEditorialView(buildCodexContext());
}

function renderHint() {
    renderHintView(buildCodexContext());
}

function getFirstAvailableLanguage(excludedLanguage = null) {
    return getFirstAvailableLanguageView(buildForgeContext(), excludedLanguage);
}

function resolveEditorLanguageRecommendation() {
    return resolveEditorLanguageRecommendationView(buildForgeContext());
}

function isLanguageExecutionAvailable(language) {
    return isLanguageExecutionAvailableView(buildForgeContext(), language);
}

function getLanguageExecutionMessage(language) {
    return getLanguageExecutionMessageView(buildForgeContext(), language);
}

function switchEditorLanguage(language) {
    switchEditorLanguageView(buildForgeContext(), language);
}

function refreshLanguageAvailability() {
    refreshLanguageAvailabilityView(buildForgeContext());
}

function applyStarterTemplate(options = {}) {
    applyStarterTemplateView(buildForgeContext(), options);
}

function updateEditorNote() {
    updateEditorNoteView(buildForgeContext());
}

function renderChamberPrompt(options) {
    return renderChamberPromptView(options);
}

function currentEditorSigil() {
    return currentEditorSigilView(buildForgeContext());
}

function renderEditorForgeStatus() {
    renderEditorForgeStatusView(buildForgeContext());
}

function renderEditorLanguageRecommendation() {
    renderEditorLanguageRecommendationView(buildForgeContext());
}

function renderEditorRuntimeAssist() {
    renderEditorRuntimeAssistView(buildForgeContext());
}

function selectedProblemStarterCode(language) {
    return selectedProblemStarterCodeView(buildForgeContext(), language);
}

function handleLanguageChange() {
    handleLanguageChangeView(buildForgeContext());
}

function scheduleDraftSave() {
    scheduleDraftSaveView(buildForgeContext());
}

function flushCurrentDraft() {
    flushCurrentDraftView(buildForgeContext());
}

function flushDraftSaveTimer() {
    flushDraftSaveTimerView(buildForgeContext());
}

function syncEditorForSelectedProblem(options = {}) {
    syncEditorForSelectedProblemView(buildForgeContext(), options);
}

function loadProblemDraftIntoEditor(problemId, language) {
    loadProblemDraftIntoEditorView(buildForgeContext(), problemId, language);
}

function clearDraftForContext(problemId, language, showMessage = false) {
    clearDraftForContextView(buildForgeContext(), problemId, language, showMessage);
}

function clearAllDraftsForProblem(problemId, showMessage = false) {
    clearAllDraftsForProblemView(buildForgeContext(), problemId, showMessage);
}

function hasProblemDraft(problemId) {
    return hasProblemDraftView(buildForgeContext(), problemId);
}

function getEditorDraft(problemId, language) {
    return getEditorDraftView(buildForgeContext(), problemId, language);
}

function listProblemDraftLanguages(problemId) {
    return listProblemDraftLanguagesView(buildForgeContext(), problemId);
}

function renderDraftStatus() {
    renderDraftStatusView(buildEchoContext());
}

function resetReplayPanel() {
    resetReplayPanelView(buildEchoContext());
}

function loadReplayFromCase(input, expectedOutput, label) {
    loadReplayFromCaseView(buildEchoContext(), input, expectedOutput, label);
}

function primeReplayFromFirstSample() {
    return primeReplayFromFirstSampleView(buildEchoContext());
}

function loadReplayFromFailure(summary) {
    loadReplayFromFailureView(buildEchoContext(), summary);
}

function selectReplayBaseline(submissionId) {
    selectReplayBaselineView(buildEchoContext(), submissionId);
}

function clearReplayBaseline(showMessage = false) {
    clearReplayBaselineView(buildEchoContext(), showMessage);
}

function renderReplayBaseline() {
    renderReplayBaselineView(buildEchoContext());
}

function renderWorkspaceDiagnostics(summary) {
    renderWorkspaceDiagnosticsView(buildEchoContext(), summary);
}

function renderReplayResult(result) {
    renderReplayResultView(buildEchoContext(), result);
}

function renderReplayComparison() {
    renderReplayComparisonView(buildEchoContext());
}

function getRunnerHealthDescriptor() {
    return getRunnerHealthDescriptorView({ state });
}

function isDockerExecutionActive() {
    return isDockerExecutionActiveView({ state });
}

function getLocalToolchainHealth(language) {
    return getLocalToolchainHealthView({ state }, language);
}

function getMissingLocalToolchains() {
    return getMissingLocalToolchainsView({ state });
}

async function copyRuntimeCommand(command, language) {
    await copyRuntimeCommandView({ showFeedback }, command, language);
}

function renderRunnerHealth() {
    renderRunnerHealthView({
        state,
        refs,
        showFeedback,
        renderEditorForgeStatus
    });
}

function renderPreflightBanner() {
    renderPreflightBannerView({
        state,
        refs,
        getRunnerHealthDescriptor
    });
}

function showSubmissionOutcomeFeedback(submission) {
    showSubmissionOutcomeFeedbackView(buildWorkspaceContext(), submission);
}

function renderSubmissions() {
    renderSubmissionsView(buildWorkspaceContext());
}

async function submitSolution(event) {
    await submitSolutionView(buildWorkspaceContext(), event);
}

async function resubmitExistingSubmission(submissionId) {
    await resubmitExistingSubmissionView(buildWorkspaceContext(), submissionId);
}

async function pollSubmissionUntilSettled(submissionId, problemId) {
    await pollSubmissionUntilSettledView(buildWorkspaceContext(), submissionId, problemId);
}

function renderWorkspaceSummary() {
    renderWorkspaceSummaryView(buildWorkspaceContext());
}

function renderContinuumGate() {
    renderContinuumGateView(buildWorkspaceContext());
}

function clearPendingDashboardRefresh() {
    clearPendingDashboardRefreshView(buildWorkspaceContext());
}

function schedulePendingDashboardRefresh() {
    schedulePendingDashboardRefreshView(buildWorkspaceContext());
}

async function refreshPendingSubmissionViews() {
    await refreshPendingSubmissionViewsView(buildWorkspaceContext());
}

async function loadSubmissionIntoEditor(submissionId, label) {
    await loadSubmissionIntoEditorView(buildWorkspaceContext(), submissionId, label);
}

async function openUserProfile(username, options = {}) {
    await openUserProfileView(buildWorkspaceContext(), username, options);
}

async function toggleProblemBookmark() {
    await toggleProblemBookmarkView(buildWorkspaceContext());
}

async function runReplay(event) {
    await runReplayView(buildWorkspaceContext(), event);
}

function submissionDebugSummary(detail) {
    return submissionDebugSummaryView(detail);
}

function pulseScene(kind) {
    pulseSceneView(buildShellContext(), kind);
}

function applyProblemScene(problem) {
    applyProblemSceneView(problem);
}

function applyWorkspaceMode(problem) {
    applyWorkspaceModeView(problem);
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

function refreshProblemArchive(options = {}) {
    return refreshProblemArchiveView(buildShellContext(), options);
}

function loadUserDashboard() {
    return loadUserDashboardView(buildShellContext());
}

function selectProblem(problemId) {
    return selectProblemView(buildShellContext(), problemId);
}

function renderProblemEmptyState(message = "Henuz listelenecek problem yok.") {
    renderProblemEmptyStateView(buildShellContext(), message);
}

function handleProblemSearchInput() {
    handleProblemSearchInputView(buildShellContext());
}

function showFeedback(message, type = "idle", sceneKind = null) {
    showFeedbackView(buildShellContext(), message, type, sceneKind);
}

function authHeaders(extraHeaders = {}) {
    return authHeadersView(buildShellContext(), extraHeaders);
}

function syncArenaUrl(problemId) {
    syncArenaUrlView(buildShellContext(), problemId);
}

function matchesProblemScope(problem) {
    return matchesProblemScopeView(buildShellContext(), problem);
}

function matchesProblemDifficulty(problem) {
    return matchesProblemDifficultyView(buildShellContext(), problem);
}

function matchesProblemTag(problem) {
    return matchesProblemTagView(buildShellContext(), problem);
}

function setProblemScope(scope) {
    setProblemScopeView(buildShellContext(), scope);
}

function setProblemDifficultyFilter(filter) {
    setProblemDifficultyFilterView(buildShellContext(), filter);
}

function setProblemTagFilter(filter) {
    setProblemTagFilterView(buildShellContext(), filter);
}

function clearProblemFilters() {
    clearProblemFiltersStateView(buildShellContext());
}

function isAdmin() {
    return isAdminView(buildShellContext());
}

function starterTemplate(language) {
    return starterTemplateView(language);
}

function persistDraftForContext(problemId, language, sourceCode) {
    persistDraftForContextView(buildForgeContext(), problemId, language, sourceCode);
}

function persistEditorDrafts() {
    persistEditorDraftsView(buildForgeContext());
}

function shouldPersistDraft(problemId, language, sourceCode, existingDraft) {
    return shouldPersistDraftView(buildForgeContext(), problemId, language, sourceCode, existingDraft);
}

function resolveProblemStarterCode(problemId, language) {
    return resolveProblemStarterCodeView(buildForgeContext(), problemId, language);
}
