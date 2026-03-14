import { applyFeedbackSurface, replayVerdictTitle, submissionSceneKind } from "./arena-feedback.js";
import { escapeHtml, formatDate, formatViewerStatus, renderEmptyState, statusPillClass } from "../shared/ui.js";

export function renderDraftStatus(context) {
    const { state, refs, pulseScene } = context;

    if (!state.selectedProblemId) {
        applyFeedbackSurface(refs.draftStatusCard, {
            type: "idle",
            pulse: false,
            eyebrow: "Local Drafts",
            title: "Chamber memory is standing by",
            message: "Secili problemde taslaklar otomatik kaydedilir."
        }, pulseScene);
        return;
    }

    const currentLanguage = refs.language.value;
    const currentDraft = context.getEditorDraft(state.selectedProblemId, currentLanguage);
    const draftLanguages = context.listProblemDraftLanguages(state.selectedProblemId);
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
            context.loadProblemDraftIntoEditor(state.selectedProblemId, button.dataset.loadProblemDraftLanguage);
        });
    });

    refs.draftStatusCard.querySelectorAll("[data-clear-current-draft]").forEach((button) => {
        button.addEventListener("click", () => {
            context.clearDraftForContext(state.selectedProblemId, refs.language.value, true);
        });
    });

    refs.draftStatusCard.querySelectorAll("[data-clear-problem-drafts]").forEach((button) => {
        button.addEventListener("click", () => {
            context.clearAllDraftsForProblem(state.selectedProblemId, true);
        });
    });
}

export function resetReplayPanel(context) {
    const { state, refs } = context;

    state.selectedCompareSubmission = null;
    state.replayComparison = null;
    state.replayResult = null;
    refs.replayInput.value = "";
    refs.replayExpectedOutput.value = "";
    renderReplayBaseline(context);
    renderReplayResult(context, null);
    renderReplayComparison(context);
}

export function loadReplayFromCase(context, input, expectedOutput, label) {
    const { state, refs } = context;

    state.replayComparison = null;
    state.replayResult = null;
    refs.replayInput.value = input ?? "";
    refs.replayExpectedOutput.value = expectedOutput ?? "";
    renderReplayResult(context, {
        state: "prefilled",
        message: `${label} replay paneline tasindi.`
    });
    renderReplayComparison(context);
}

export function primeReplayFromFirstSample(context) {
    const { state, refs } = context;

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

    loadReplayFromCase(context, sample.input, sample.expectedOutput, "Ilk sample");
    return true;
}

export function loadReplayFromFailure(context, summary) {
    const { state, refs } = context;

    if (!summary?.lastFailedVisible || !summary.lastFailedInputPreview) {
        return;
    }

    state.replayComparison = null;
    state.replayResult = null;
    refs.replayInput.value = summary.lastFailedInputPreview;
    refs.replayExpectedOutput.value = summary.lastFailedExpectedOutputPreview || "";
    renderReplayResult(context, {
        state: "prefilled",
        message: "Son visible failure replay paneline tasindi."
    });
    renderReplayComparison(context);
}

export function selectReplayBaseline(context, submissionId) {
    const { state } = context;
    const submission = state.submissions.find((entry) => entry.id === submissionId);

    if (!submission) {
        context.showFeedback("Karsilastirma icin submission bulunamadi.", "error");
        return;
    }

    if (state.selectedCompareSubmission?.id === submissionId) {
        clearReplayBaseline(context, true);
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
    renderReplayBaseline(context);
    renderReplayResult(context, {
        state: "prefilled",
        message: `Baseline olarak #${submission.id} secildi. Simdi custom replay'i tekrar calistir.`
    });
    renderReplayComparison(context);
    context.renderSubmissions();
}

export function clearReplayBaseline(context, showMessage = false) {
    const { state } = context;

    state.selectedCompareSubmission = null;
    state.replayComparison = null;
    renderReplayBaseline(context);
    renderReplayComparison(context);
    context.renderSubmissions();

    if (showMessage) {
        context.showFeedback("Submission baseline temizlendi.", "idle");
    }
}

export function renderReplayBaseline(context) {
    const { state, refs, pulseScene } = context;

    if (!state.currentUser) {
        applyFeedbackSurface(refs.replayBaselineCard, {
            type: "idle",
            pulse: false,
            eyebrow: "Submission Baseline",
            title: "Compare channel is locked",
            message: "Submission compare icin once giris yap."
        }, pulseScene);
        return;
    }

    if (!state.selectedCompareSubmission) {
        applyFeedbackSurface(refs.replayBaselineCard, {
            type: "idle",
            pulse: false,
            eyebrow: "Submission Baseline",
            title: "Anchor an older echo when you need contrast",
            message: "Submission Baseline secersen custom replay ayni inputta eski gonderiminle karsilastirilir."
        }, pulseScene);
        return;
    }

    const baselineAvailable = context.isLanguageExecutionAvailable(state.selectedCompareSubmission.language);
    const runtimeHint = baselineAvailable
        ? "Ayni inputta bu submission ile editorundeki kod karsilastirilacak."
        : context.getLanguageExecutionMessage(state.selectedCompareSubmission.language) || "Bu dil su anda hazir degil.";

    applyFeedbackSurface(refs.replayBaselineCard, {
        type: "idle",
        pulse: false,
        eyebrow: "Submission Baseline",
        title: "A prior echo is anchored",
        message: "Custom replay bu submission ile ayni input uzerinde karsilastirilacak.",
        hint: runtimeHint,
        meta: [
            `#${state.selectedCompareSubmission.id}`,
            {
                label: formatViewerStatus(state.selectedCompareSubmission.status),
                status: state.selectedCompareSubmission.status
            },
            state.selectedCompareSubmission.language
        ],
        actionsHtml: `<button type="button" class="button button--ghost button--small" data-clear-replay-baseline>Baseline'i temizle</button>`
    }, pulseScene);

    refs.replayBaselineCard.querySelector("[data-clear-replay-baseline]")?.addEventListener("click", () => {
        clearReplayBaseline(context, true);
    });
}

export function renderWorkspaceDiagnostics(context, summary) {
    const { state, refs } = context;

    if (!state.currentUser) {
        refs.workspaceDebugCard.innerHTML = renderEmptyState("Giris yaptiginda son hatali denemendeki visible testcase diagnostigini burada goreceksin.");
        return;
    }

    if (!summary) {
        refs.workspaceDebugCard.innerHTML = renderEmptyState("Failure diagnostigi yuklenemedi.");
        return;
    }

    const failureStatuses = new Set(["WRONG_ANSWER", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED", "COMPILATION_ERROR"]);
    if (!failureStatuses.has(summary.lastStatus)) {
        refs.workspaceDebugCard.innerHTML = renderEmptyState("Son denemendeki failure diagnostigi burada gosterilecek.");
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
        button.addEventListener("click", () => loadReplayFromFailure(context, summary));
    });
}

export function renderReplayResult(context, result) {
    const { state, refs, pulseScene } = context;

    if (!state.currentUser) {
        applyFeedbackSurface(refs.replayResultCard, {
            type: "idle",
            pulse: false,
            eyebrow: "Custom Replay",
            title: "Replay locked behind your session",
            message: "Custom replay icin once giris yap."
        }, pulseScene);
        return;
    }

    if (!result) {
        applyFeedbackSurface(refs.replayResultCard, {
            type: "idle",
            pulse: false,
            eyebrow: "Custom Replay",
            title: "Replay channel ready",
            message: "Sample veya custom input ile tek seferlik run sonucu burada gorunecek."
        }, pulseScene);
        return;
    }

    if (result.state === "prefilled") {
        applyFeedbackSurface(refs.replayResultCard, {
            type: "idle",
            pulse: false,
            eyebrow: "Custom Replay",
            title: "Replay primed",
            message: result.message
        }, pulseScene);
        return;
    }

    const resultClass = result.status === "SUCCESS" && result.matchedExpected !== false
        ? "success"
        : result.status === "SUCCESS"
            ? "idle"
            : "error";

    const replaySceneKind = result.status === "SUCCESS"
        ? (result.matchedExpected === false ? "failure" : "accepted")
        : submissionSceneKind(result.status);
    const meta = [
        {
            label: formatReplayStatus(result.status),
            status: result.status === "SUCCESS"
                ? (result.matchedExpected === false ? "WRONG_ANSWER" : "ACCEPTED")
                : result.status
        },
        `${result.executionTime ?? 0} ms`,
        `${result.memoryUsage ?? 0} MB`
    ];

    if (result.expectedOutput != null) {
        meta.push(result.matchedExpected ? "Expected match" : "Expected drift");
    }

    const detailBlocks = [
        renderFeedbackCodeDetail("Output", result.output),
        renderFeedbackCodeDetail("Expected", result.expectedOutput)
    ].filter(Boolean).join("");

    applyFeedbackSurface(refs.replayResultCard, {
        type: resultClass,
        sceneKind: replaySceneKind,
        pulse: false,
        eyebrow: "Custom Replay",
        title: replayVerdictTitle(result),
        message: result.message || "Replay tamamlandi.",
        meta,
        bodyHtml: detailBlocks ? `<div class="feedback__detail-grid">${detailBlocks}</div>` : ""
    }, pulseScene);
}

export function renderReplayComparison(context) {
    const { state, refs } = context;

    if (state.selectedCompareSubmission) {
        renderSubmissionReplayComparison(context);
        return;
    }

    const summary = state.workspaceSummary;
    const replay = state.replayResult;

    if (!state.currentUser) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "Compare gate is closed", "Karsilastirma icin giris yapman gerekir.", "Replay Compare", "RC");
        return;
    }

    if (!summary?.lastFailedVisible || !summary.lastFailedInputPreview || !summary.lastFailedExpectedOutputPreview) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "No visible fracture to compare against", "Visible failure ile karsilastirma icin uygun bir son deneme yok.", "Replay Compare", "RC");
        return;
    }

    if (!replay) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "Replay is waiting for a new output line", "Replay calistirdiginda son visible failure ile diff burada gorunecek.", "Replay Compare", "RC");
        return;
    }

    if (!sameCompareValue(refs.replayInput.value, summary.lastFailedInputPreview)) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "The current replay belongs to another line", "Son replay farkli bir input ile calisti. Dogrudan karsilastirma icin \"Bu case'i replay'e al\" kullan.", "Replay Compare", "RC");
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

function renderSubmissionReplayComparison(context) {
    const { state, refs } = context;
    const baselineMeta = state.selectedCompareSubmission;
    const comparison = state.replayComparison;

    if (!state.currentUser) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "Compare gate is closed", "Karsilastirma icin giris yapman gerekir.", "Submission Compare", "SC");
        return;
    }

    if (!baselineMeta) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "No anchored baseline yet", "Replay calistirdiginda secili submission baseline'i ile diff burada gorunecek.", "Submission Compare", "SC");
        return;
    }

    if (!comparison || comparison.baselineRun?.submissionId !== baselineMeta.id) {
        refs.replayCompareCard.innerHTML = renderReplayCompareEmptyState(context, "Baseline is armed, current replay is still missing", "Baseline secildi. Simdi ayni inputta compare calistirmak icin replay'i tekrar kos.", "Submission Compare", "SC");
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

function renderFeedbackCodeDetail(title, value) {
    if (value == null || value === "") {
        return "";
    }

    return `
        <article class="feedback__detail-block">
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

function renderReplayCompareEmptyState(context, title, message, eyebrow = "Replay Compare", sigil = "RC") {
    return context.renderChamberPrompt({
        eyebrow,
        title,
        message,
        sigil,
        tone: "neutral"
    });
}

function sameCompareValue(left, right) {
    if (left == null || right == null) {
        return false;
    }

    return String(left).trim() === String(right).trim();
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
