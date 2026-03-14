import { buildContinuumUrl, navigateToUrl } from "../shared/page-links.js";
import {
    escapeHtml,
    formatDate,
    formatViewerStatus,
    renderBadge,
    renderEmptyState,
    renderGhostButton,
    renderGhostLink,
    statusPillClass
} from "../shared/ui.js";
export function renderWorkspaceSummary(context) {
    const {
        state,
        refs,
        renderChamberPrompt,
        renderWorkspaceDiagnostics,
        renderReplayComparison,
        renderEditorForgeStatus,
        isAdmin,
        loadSubmissionIntoEditor
    } = context;
    if (!state.currentUser) {
        refs.submissionPanelEyebrow.textContent = "Public echoes";
        refs.submissionPanelTitle.textContent = "Latest Echoes";
        refs.workspaceSummaryCard.innerHTML = renderChamberPrompt({
            eyebrow: "Workspace",
            title: "Your chamber opens after sign-in",
            message: "Giris yaptiginda bu problemdeki kendi deneme gecmisini, failure trend'ini ve son accepted kaydini goreceksin.",
            sigil: "WS",
            tone: "neutral"
        });
        renderWorkspaceDiagnostics(null);
        renderReplayComparison();
        renderEditorForgeStatus();
        return;
    }

    refs.submissionPanelEyebrow.textContent = isAdmin() ? "Sanctum view" : "Your chamber";
    refs.submissionPanelTitle.textContent = isAdmin() ? "Problem Echoes" : "Your Echoes";

    const summary = state.workspaceSummary;
    if (!summary) {
        refs.workspaceSummaryCard.innerHTML = renderEmptyState("Workspace ozeti yuklenemedi.");
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
            ? renderGhostButton("Son denemeyi yukle", {
                attributes: { "data-load-latest-submission-id": summary.lastSubmissionId }
            })
            : "",
        summary.lastAcceptedSubmissionId
            ? renderGhostButton("Accepted'dan devam et", {
                attributes: { "data-resume-accepted-submission-id": summary.lastAcceptedSubmissionId }
            })
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
                ${failureEntries.map(([status, count]) => renderBadge(`${formatViewerStatus(status)}: ${count}`, statusPillClass(status))).join("")}
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
    renderEditorForgeStatus();
}

export function renderContinuumGate(context) {
    const { state, refs } = context;
    if (!refs.continuumGateCard) {
        return;
    }

    if (!state.currentUser || !state.userDashboard) {
        refs.continuumGateCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Continuum</p>
                    <h3>Progress snapshot</h3>
                </div>
            </div>
            <p class="workspace-card__lead">
                Hall of Fame, public profile ve personal route solve chamber'i kalinlastirmadan
                kendi yuzeyinde akiyor.
            </p>
            <div class="workspace-card__actions">
                ${renderGhostLink("Continuum'u ac", buildContinuumUrl())}
            </div>
        `;
        return;
    }

    const dashboard = state.userDashboard;
    refs.continuumGateCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Continuum</p>
                <h3>${escapeHtml(dashboard.username || "Journey")} snapshot</h3>
            </div>
        </div>
        <div class="workspace-card__breakdown">
            ${renderBadge(`${dashboard.solvedProblems ?? 0} solved`)}
            ${renderBadge(`${dashboard.pendingSubmissions ?? 0} pending`)}
            ${renderBadge(`${dashboard.bookmarkedProblems ?? 0} saved`)}
        </div>
        <p class="workspace-card__lead">
            Journey, Hall of Fame ve public profile arena'yi yormadan Continuum icinde akiyor.
        </p>
        <div class="workspace-card__actions">
            ${renderGhostLink("Continuum'u ac", buildContinuumUrl())}
            ${renderGhostLink("Profilini ac", buildContinuumUrl({ username: dashboard.username || "" }))}
        </div>
    `;
}

export function clearPendingDashboardRefresh(context) {
    const { state } = context;
    if (state.pendingDashboardRefreshTimerId) {
        window.clearTimeout(state.pendingDashboardRefreshTimerId);
        state.pendingDashboardRefreshTimerId = null;
    }
}

export function schedulePendingDashboardRefresh(context) {
    const { state, refreshPendingSubmissionViews, DASHBOARD_PENDING_REFRESH_MS } = context;
    clearPendingDashboardRefresh(context);

    if (!state.currentUser || !state.userDashboard || (state.userDashboard.pendingSubmissions ?? 0) < 1) {
        return;
    }

    state.pendingDashboardRefreshTimerId = window.setTimeout(() => {
        state.pendingDashboardRefreshTimerId = null;
        void refreshPendingSubmissionViews();
    }, DASHBOARD_PENDING_REFRESH_MS);
}

export async function refreshPendingSubmissionViews(context) {
    const { state, clearPendingDashboardRefresh, loadUserDashboard, selectProblem } = context;
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
}

export async function openUserProfile(context, username, options = {}) {
    if (!username) {
        return;
    }

    navigateToUrl(buildContinuumUrl({ username }));
}

export async function toggleProblemBookmark(context) {
    const {
        state,
        refs,
        authHeaders,
        showFeedback,
        renderProblemBookmarkButton,
        loadProblems
    } = context;
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

export async function runReplay(context, event) {
    const {
        state,
        refs,
        authHeaders,
        renderReplayResult,
        showFeedback,
        isLanguageExecutionAvailable,
        getLanguageExecutionMessage,
        renderReplayBaseline,
        renderReplayComparison
    } = context;
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
