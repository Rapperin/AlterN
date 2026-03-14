import { escapeHtml, formatDate, formatViewerStatus, renderBadge } from "../shared/ui.js";

export function getFirstAvailableLanguage(context, excludedLanguage = null) {
    const { refs, isLanguageExecutionAvailable } = context;
    const options = Array.from(refs.language.options);
    const nextAvailable = options.find((option) => option.value !== excludedLanguage && isLanguageExecutionAvailable(option.value));
    return nextAvailable?.value || null;
}

export function resolveEditorLanguageRecommendation(context) {
    const {
        state,
        isLanguageExecutionAvailable,
        listProblemDraftLanguages,
        getFirstAvailableLanguage
    } = context;
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
        pushCandidate(state.workspaceSummary?.lastAcceptedLanguage, "Bu problemde son accepted dilin", 1),
        pushCandidate(state.workspaceSummary?.lastSubmissionLanguage, "Bu problemde son deneme dilin", 2),
        pushCandidate(
            state.userDashboard?.journeyFocus?.problemId === state.selectedProblemId
                ? state.userDashboard?.journeyFocus?.suggestedLanguage
                : null,
            "Journey focus onerisi",
            3
        ),
        pushCandidate(state.problemStats?.mostUsedLanguage, "Bu problemde toplulugun en sik kullandigi hazir dil", 4),
        pushCandidate(state.userDashboard?.mostSuccessfulLanguage, "Accepted performansinin en guclu oldugu hazir dil", 5),
        pushCandidate(state.userDashboard?.mostUsedLanguage, "En cok kullandigin hazir dil", 6),
        pushCandidate(getFirstAvailableLanguage(null), "Bu ortamda hemen calisabilecek dil", 7)
    ].filter(Boolean);

    return candidates.sort((left, right) => left.priority - right.priority)[0] || null;
}

export function isLanguageExecutionAvailable(context, language) {
    const { getRunnerHealthDescriptor, isDockerExecutionActive, getLocalToolchainHealth } = context;
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

export function getLanguageExecutionMessage(context, language) {
    const { getLocalToolchainHealth, getRunnerHealthDescriptor } = context;
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

export function switchEditorLanguage(context, language) {
    const {
        refs,
        state,
        persistDraftForContext,
        updateEditorNote,
        syncEditorForSelectedProblem,
        showFeedback
    } = context;
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

export function refreshLanguageAvailability(context) {
    const {
        refs,
        state,
        isLanguageExecutionAvailable,
        persistDraftForContext,
        updateEditorNote,
        syncEditorForSelectedProblem,
        showFeedback,
        renderReplayBaseline
    } = context;
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

export function applyStarterTemplate(context, options = {}) {
    const {
        refs,
        state,
        selectedProblemStarterCode,
        persistDraftForContext,
        renderDraftStatus
    } = context;
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

export function updateEditorNote(context) {
    const {
        refs,
        state,
        getLanguageExecutionMessage,
        isLanguageExecutionAvailable,
        renderEditorLanguageRecommendation,
        renderEditorRuntimeAssist,
        renderEditorForgeStatus,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB
    } = context;
    if (!state.selectedProblem) {
        refs.editorNote.textContent = `${refs.language.value} forge'i hazir. Bir codex sectiginde problem limitleri ve ritim burada netlesecek.`;
        renderEditorLanguageRecommendation();
        renderEditorRuntimeAssist();
        renderEditorForgeStatus();
        return;
    }

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
    renderEditorForgeStatus();
}

export function renderChamberPrompt({
    eyebrow,
    title,
    message,
    sigil = "CH",
    tone = "neutral",
    meta = [],
    actionsHtml = ""
}) {
    const metaItems = Array.isArray(meta) ? meta.filter(Boolean) : [];
    const metaHtml = metaItems.length > 0
        ? `<div class="chamber-prompt__meta">${metaItems.map((item) => renderBadge(item)).join("")}</div>`
        : "";

    return `
        <div class="chamber-prompt chamber-prompt--${escapeHtml(tone)}">
            <div class="chamber-prompt__sigil" aria-hidden="true">${escapeHtml(sigil)}</div>
            <div class="chamber-prompt__copy">
                <p class="chamber-prompt__eyebrow">${escapeHtml(eyebrow)}</p>
                <h3 class="chamber-prompt__title">${escapeHtml(title)}</h3>
                <p class="chamber-prompt__message">${escapeHtml(message)}</p>
                ${metaHtml}
                ${actionsHtml ? `<div class="chamber-prompt__actions">${actionsHtml}</div>` : ""}
            </div>
        </div>
    `;
}

export function currentEditorSigil(context) {
    const { refs } = context;
    switch (refs.language.value) {
        case "JAVA":
            return "JV";
        case "PYTHON":
            return "PY";
        case "CPP":
            return "CP";
        default:
            return "FG";
    }
}

export function renderEditorForgeStatus(context) {
    const {
        refs,
        state,
        isLanguageExecutionAvailable,
        isAdmin,
        formatViewerStatus,
        currentEditorSigil,
        renderChamberPrompt,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB
    } = context;
    const container = refs.editorForgeStatus;
    const stage = refs.editorStage;
    if (!container || !stage) {
        return;
    }

    const problem = state.selectedProblem;
    const currentLanguage = refs.language.value;
    const runtimeReady = isLanguageExecutionAvailable(currentLanguage);
    const summary = state.workspaceSummary;

    stage.dataset.runtime = runtimeReady ? "ready" : "sealed";
    stage.dataset.difficulty = (problem?.difficulty || "neutral").toLowerCase();
    stage.dataset.solved = summary?.solved ? "true" : "false";

    if (!problem) {
        container.innerHTML = renderChamberPrompt({
            eyebrow: "Forge State",
            title: "No codex is bound to the forge yet",
            message: "Bir problem sectiginde burada ritim, limitler ve son izlerin toplanacak.",
            sigil: "FG",
            tone: "neutral",
            meta: [currentLanguage, runtimeReady ? "Runtime ready" : "Runtime sealed"],
            actionsHtml: `
                <button type="button" class="button button--ghost button--small" data-editor-apply-starter>
                    Starter code yukle
                </button>
            `
        });
        return;
    }

    const message = !state.currentUser
        ? "Codex secildi. Giris yaptiginda echo, replay ve submission akisi senin adina acilacak."
        : !summary
            ? "Workspace hafizasi yukleniyor. Forge su an problem baglamini sabitliyor."
            : summary.solved
                ? "Bu problem zaten senin tarafinda kapandi. Forge artik hiz, bellek veya farkli dil varyasyonlari icin acik."
                : summary.attemptCount > 0
                    ? `${summary.attemptCount} deneme var. Son iz ${formatViewerStatus(summary.lastStatus)} olarak duruyor.`
                    : "Ilk darbeyi bekleyen sessiz bir anvil. Hazir oldugunda submission rituelini baslat.";
    const tone = !runtimeReady
        ? "warning"
        : summary?.solved
            ? "aligned"
            : "focus";
    const meta = [
        problem.difficulty,
        `${problem.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS} ms`,
        `${problem.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB} MB`,
        runtimeReady ? `${currentLanguage} ready` : `${currentLanguage} sealed`
    ];

    if (state.currentUser && summary?.lastStatus) {
        meta.push(`Last ${formatViewerStatus(summary.lastStatus)}`);
    } else if (!state.currentUser) {
        meta.push("Login to strike");
    }

    const actionButtons = [];
    if (state.visibleTestCases.length > 0) {
        actionButtons.push(`
            <button type="button" class="button button--ghost button--small" data-editor-prime-first-sample>
                Ilk sample'i prime et
            </button>
        `);
    }
    if (state.currentUser && summary?.lastSubmissionId) {
        actionButtons.push(`
            <button type="button" class="button button--ghost button--small" data-editor-load-last-submission-id="${summary.lastSubmissionId}">
                Son denemeyi geri yukle
            </button>
        `);
    }
    actionButtons.push(`
        <button type="button" class="button button--ghost button--small" data-editor-apply-starter>
            Starter code'a don
        </button>
    `);

    container.innerHTML = renderChamberPrompt({
        eyebrow: "Forge State",
        title: `${problem.title} is on the anvil`,
        message,
        sigil: currentEditorSigil(),
        tone,
        meta,
        actionsHtml: actionButtons.join("")
    });
}

export function renderEditorLanguageRecommendation(context) {
    const { refs, resolveEditorLanguageRecommendation, renderChamberPrompt } = context;
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
    container.innerHTML = renderChamberPrompt({
        eyebrow: "Recommended language",
        title: active
            ? `${recommendation.language} already holds the current line`
            : `${recommendation.language} is the cleanest next strike`,
        message: `${recommendation.reason}.`,
        sigil: "LG",
        tone: active ? "aligned" : "focus",
        meta: [
            recommendation.language,
            active ? "Active now" : "Ready to switch"
        ],
        actionsHtml: active ? "" : `
            <button
                type="button"
                class="button button--ghost button--small"
                data-editor-recommended-language="${escapeHtml(recommendation.language)}">
                ${escapeHtml(recommendation.actionLabel || `Use ${recommendation.language}`)}
            </button>
        `
    });
}

export function renderEditorRuntimeAssist(context) {
    const {
        refs,
        state,
        getMissingLocalToolchains,
        isLanguageExecutionAvailable,
        getFirstAvailableLanguage,
        renderChamberPrompt
    } = context;
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
    assist.innerHTML = renderChamberPrompt({
        eyebrow: "Runtime assist",
        title: currentAvailable
            ? `${currentLanguage} chamber is armed`
            : `${currentLanguage} chamber is currently sealed`,
        message: lead,
        sigil: "RT",
        tone: currentAvailable ? "aligned" : "warning",
        meta: missingToolchains.map((toolchain) => `${toolchain.language} missing`),
        actionsHtml: `
            ${switchAction}
            ${fixActions}
            <button
                type="button"
                class="button button--ghost button--small"
                data-runner-health-refresh
                ${state.runnerHealthRefreshing ? "disabled" : ""}>
                ${state.runnerHealthRefreshing ? "Refreshing..." : "Refresh runtime"}
            </button>
        `
    });
}

export function selectedProblemStarterCode(context, language) {
    const { state, starterTemplate } = context;
    const problemStarter = state.selectedProblem?.starterCodes?.[language];
    if (problemStarter && problemStarter.trim()) {
        return problemStarter;
    }

    return starterTemplate(language);
}

export function handleLanguageChange(context) {
    const {
        refs,
        state,
        persistDraftForContext,
        updateEditorNote,
        syncEditorForSelectedProblem
    } = context;
    const previousLanguage = state.editorLanguageContext || refs.language.value;
    persistDraftForContext(state.selectedProblemId, previousLanguage, refs.sourceCode.value);
    state.editorLanguageContext = refs.language.value;
    updateEditorNote();
    syncEditorForSelectedProblem({ announceDraftRestore: true });
}

export function scheduleDraftSave(context) {
    const { state, refs, flushDraftSaveTimer, persistDraftForContext } = context;
    flushDraftSaveTimer();
    state.draftSaveTimerId = window.setTimeout(() => {
        persistDraftForContext(state.selectedProblemId, refs.language.value, refs.sourceCode.value);
    }, 300);
}

export function flushCurrentDraft(context) {
    const { state, refs, flushDraftSaveTimer, persistDraftForContext } = context;
    flushDraftSaveTimer();
    persistDraftForContext(state.selectedProblemId, state.editorLanguageContext || refs.language.value, refs.sourceCode.value);
}

export function flushDraftSaveTimer(context) {
    const { state } = context;
    if (state.draftSaveTimerId) {
        window.clearTimeout(state.draftSaveTimerId);
        state.draftSaveTimerId = null;
    }
}

export function syncEditorForSelectedProblem(context, options = {}) {
    const {
        refs,
        state,
        renderDraftStatus,
        getEditorDraft,
        selectedProblemStarterCode,
        showFeedback
    } = context;
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

export function loadProblemDraftIntoEditor(context, problemId, language) {
    const {
        refs,
        state,
        getEditorDraft,
        flushCurrentDraft,
        updateEditorNote,
        renderDraftStatus,
        showFeedback
    } = context;
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

export function clearDraftForContext(context, problemId, language, showMessage = false) {
    const {
        refs,
        persistDraftForContext,
        selectedProblemStarterCode,
        updateEditorNote,
        renderDraftStatus,
        showFeedback
    } = context;
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

export function clearAllDraftsForProblem(context, problemId, showMessage = false) {
    const {
        refs,
        state,
        hasProblemDraft,
        persistEditorDrafts,
        selectedProblemStarterCode,
        renderDraftStatus,
        renderProblemList,
        showFeedback
    } = context;
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

export function hasProblemDraft(context, problemId) {
    const { state } = context;
    const problemKey = String(problemId ?? "");
    return Object.keys(state.editorDrafts[problemKey] || {}).length > 0;
}

export function getEditorDraft(context, problemId, language) {
    const { state } = context;
    if (!problemId || !language) {
        return null;
    }

    return state.editorDrafts[String(problemId)]?.[language] || null;
}

export function listProblemDraftLanguages(context, problemId) {
    const { state } = context;
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
