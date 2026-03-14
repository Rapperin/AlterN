import { fetchJson } from "../shared/api.js";
import {
    escapeHtml,
    formatDate,
    formatViewerStatus,
    renderBadge,
    renderEmptyState,
    renderGhostButton,
    shorten
} from "../shared/ui.js";
import {
    applyFeedbackSurface,
    submissionCardSceneClass,
    submissionSceneKind,
    submissionVerdictTitle
} from "./arena-feedback.js";

export function showSubmissionOutcomeFeedback(context, submission) {
    const { refs, pulseScene } = context;
    if (!submission) {
        return;
    }

    const sceneKind = submissionSceneKind(submission.status);
    const feedbackType = sceneKind === "accepted"
        ? "success"
        : sceneKind === "pending"
            ? "pending"
            : "error";

    const meta = [{
        label: formatViewerStatus(submission.status),
        status: submission.status
    }];

    if (typeof submission.passedTestCount === "number" && typeof submission.totalTestCount === "number") {
        meta.push(`${submission.passedTestCount}/${submission.totalTestCount} tests`);
    }
    if (typeof submission.executionTime === "number") {
        meta.push(`${submission.executionTime} ms`);
    }
    if (typeof submission.memoryUsage === "number") {
        meta.push(`${submission.memoryUsage} MB`);
    }

    const summary = typeof submission.passedTestCount === "number" && typeof submission.totalTestCount === "number"
        ? submission.status === "ACCEPTED"
            ? "Visible ve hidden testler chamber tarafinda kapanis verdi."
            : `${submission.passedTestCount}/${submission.totalTestCount} test gecildikten sonra run durdu.`
        : "Submission sonucu solve chamber tarafinda islenip geri dondu.";

    const lines = [];
    if (submission.verdictMessage) {
        lines.push(submission.verdictMessage);
    }

    applyFeedbackSurface(refs.submissionFeedback, {
        type: feedbackType,
        sceneKind,
        eyebrow: "Submission verdict",
        title: submissionVerdictTitle(submission.status),
        message: summary,
        lines,
        meta
    }, pulseScene);
}

export function renderSubmissions(context) {
    const {
        state,
        refs,
        isAdmin,
        loadSubmissionIntoEditor,
        resubmitExistingSubmission,
        selectReplayBaseline
    } = context;

    if (state.submissions.length === 0) {
        refs.submissionList.innerHTML = renderEmptyState(
            state.currentUser && !isAdmin()
                ? "Bu problem icin henuz kendi gonderimin yok."
                : "Bu problem icin henuz gonderim yok."
        );
        return;
    }

    refs.submissionList.innerHTML = state.submissions.map((submission) => `
        <article class="submission-card ${submissionCardSceneClass(submission.status)}">
            <h3>${escapeHtml(submission.status)}</h3>
            <div class="submission-card__meta">
                ${renderBadge(submission.language)}
                ${renderBadge(`${submission.passedTestCount}/${submission.totalTestCount} tests`)}
                ${renderBadge(`${submission.executionTime ?? 0} ms`)}
                ${renderBadge(`${submission.memoryUsage ?? 0} MB`)}
            </div>
            <p>Created: ${formatDate(submission.createdAt)}</p>
            ${submission.verdictMessage ? `<p>${escapeHtml(submission.verdictMessage)}</p>` : ""}
            ${state.currentUser ? `
                <div class="submission-card__actions">
                    ${submission.status !== "PENDING" ? `
                        ${renderGhostButton("Tekrar gonder", {
                            attributes: { "data-resubmit-submission-id": submission.id }
                        })}
                    ` : ""}
                    ${renderGhostButton(state.selectedCompareSubmission?.id === submission.id ? "Secili baseline" : "Baseline sec", {
                        extraClassName: state.selectedCompareSubmission?.id === submission.id ? "button--soft" : "",
                        attributes: { "data-compare-submission-id": submission.id }
                    })}
                    ${renderGhostButton("Editor'e yukle", {
                        attributes: { "data-load-submission-id": submission.id }
                    })}
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

export async function submitSolution(context, event) {
    const {
        state,
        refs,
        authHeaders,
        isLanguageExecutionAvailable,
        getLanguageExecutionMessage,
        showFeedback,
        selectProblem,
        pollSubmissionUntilSettled,
        showSubmissionOutcomeFeedback,
        loadUserDashboard
    } = context;
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
            showFeedback("PENDING | Submission queue'ya alindi. Verdict bekleniyor...", "pending", "pending");
            await selectProblem(state.selectedProblemId);
            void pollSubmissionUntilSettled(submission.id, state.selectedProblemId);
        } else {
            showSubmissionOutcomeFeedback(submission);

            await Promise.all([
                selectProblem(state.selectedProblemId),
                loadUserDashboard()
            ]);
        }
    } catch (error) {
        showFeedback(error.message, "error");
    } finally {
        refs.submitButton.disabled = false;
        refs.submitButton.textContent = "Submit";
    }
}

export async function resubmitExistingSubmission(context, submissionId) {
    const {
        state,
        authHeaders,
        showFeedback,
        selectProblem,
        pollSubmissionUntilSettled,
        showSubmissionOutcomeFeedback,
        loadUserDashboard
    } = context;
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
            showFeedback("PENDING | Submission tekrar queue'ya alindi. Verdict bekleniyor...", "pending", "pending");
            await selectProblem(state.selectedProblemId);
            void pollSubmissionUntilSettled(submission.id, state.selectedProblemId);
            return;
        }

        showSubmissionOutcomeFeedback(submission);

        await Promise.all([
            selectProblem(state.selectedProblemId),
            loadUserDashboard()
        ]);
    } catch (error) {
        showFeedback(error.message, "error");
    }
}

export async function pollSubmissionUntilSettled(context, submissionId, problemId) {
    const {
        authHeaders,
        showFeedback,
        showSubmissionOutcomeFeedback,
        state,
        selectProblem,
        loadUserDashboard,
        SUBMISSION_POLL_MAX_ATTEMPTS,
        SUBMISSION_POLL_INTERVAL_MS
    } = context;
    for (let attempt = 0; attempt < SUBMISSION_POLL_MAX_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, SUBMISSION_POLL_INTERVAL_MS));

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
            showSubmissionOutcomeFeedback(detail);

            await Promise.all([
                state.selectedProblemId === problemId ? selectProblem(problemId) : Promise.resolve(),
                loadUserDashboard()
            ]);
            return;
        }
    }

    showFeedback("Submission hala queue'da. Biraz sonra tekrar bakabilir ya da listeyi yenileyebilirsin.", "pending", "pending");
    if (state.selectedProblemId === problemId) {
        await selectProblem(problemId);
    }
}

export async function loadSubmissionIntoEditor(context, submissionId, label) {
    const {
        state,
        refs,
        authHeaders,
        showFeedback,
        flushCurrentDraft,
        updateEditorNote,
        persistDraftForContext,
        renderDraftStatus,
        submissionDebugSummary
    } = context;
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

export function submissionDebugSummary(detail) {
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
