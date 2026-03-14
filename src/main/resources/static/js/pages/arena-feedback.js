import { escapeHtml, formatViewerStatus, renderBadge, statusPillClass } from "../shared/ui.js";

export function feedbackSceneKind(message, type = "idle") {
    const normalizedMessage = String(message || "").toUpperCase();
    if (normalizedMessage.includes("PENDING")) {
        return "pending";
    }
    if (type === "success") {
        return "accepted";
    }
    if (type === "error") {
        return "failure";
    }
    return null;
}

export function submissionSceneKind(status) {
    switch ((status || "").toUpperCase()) {
        case "ACCEPTED":
            return "accepted";
        case "PENDING":
            return "pending";
        case "TIME_LIMIT_EXCEEDED":
            return "danger";
        case "WRONG_ANSWER":
        case "COMPILATION_ERROR":
        case "RUNTIME_ERROR":
            return "failure";
        default:
            return null;
    }
}

export function isFeedbackStatusToken(value) {
    return [
        "ACCEPTED",
        "PENDING",
        "WRONG_ANSWER",
        "COMPILATION_ERROR",
        "RUNTIME_ERROR",
        "TIME_LIMIT_EXCEEDED",
        "SUCCESS"
    ].includes(String(value || "").trim().toUpperCase());
}

export function submissionVerdictTitle(status) {
    switch ((status || "").toUpperCase()) {
        case "ACCEPTED":
            return "Verdict accepted";
        case "PENDING":
            return "Judgement in motion";
        case "TIME_LIMIT_EXCEEDED":
            return "Time boundary breached";
        case "WRONG_ANSWER":
            return "Pattern rejected";
        case "COMPILATION_ERROR":
            return "Invocation failed before impact";
        case "RUNTIME_ERROR":
            return "Execution fractured mid-run";
        default:
            return "Submission answered";
    }
}

export function replayVerdictTitle(result) {
    if (!result) {
        return "Replay channel ready";
    }

    if (result.status === "SUCCESS" && result.matchedExpected === false) {
        return "Replay diverged from the expected line";
    }

    if (result.status === "SUCCESS") {
        return result.expectedOutput != null
            ? "Replay aligned with the expected line"
            : "Replay completed without resistance";
    }

    return submissionVerdictTitle(result.status);
}

export function problemCardSceneClass(problem) {
    const classes = [];
    if (problem?.difficulty) {
        classes.push(`problem-card--${problem.difficulty.toLowerCase()}`);
    }
    if (problem?.viewerBookmarked) {
        classes.push("problem-card--saved");
    }
    if (problem?.viewerSolved) {
        classes.push("problem-card--solved");
    }
    return classes.join(" ");
}

export function submissionCardSceneClass(status) {
    const normalizedStatus = (status || "").toUpperCase();
    if (normalizedStatus === "ACCEPTED") {
        return "submission-card--accepted";
    }
    if (normalizedStatus === "PENDING") {
        return "submission-card--pending";
    }
    if (normalizedStatus === "TIME_LIMIT_EXCEEDED") {
        return "submission-card--danger";
    }
    if (["WRONG_ANSWER", "COMPILATION_ERROR", "RUNTIME_ERROR"].includes(normalizedStatus)) {
        return "submission-card--failure";
    }
    return "";
}

export function buildGenericFeedbackSpec(message, type = "idle", sceneKind = null) {
    const parts = String(message || "")
        .split("|")
        .map((entry) => entry.trim())
        .filter(Boolean);
    const normalizedSceneKind = sceneKind || feedbackSceneKind(message, type);
    const meta = [];
    let content = parts;

    if (content.length > 0 && isFeedbackStatusToken(content[0])) {
        const status = content[0].toUpperCase();
        meta.push({
            label: formatViewerStatus(status),
            status: status === "SUCCESS" ? "ACCEPTED" : status
        });
        content = content.slice(1);
    }

    return {
        type,
        sceneKind: normalizedSceneKind,
        eyebrow: feedbackEyebrow(normalizedSceneKind, type),
        title: feedbackTitle(normalizedSceneKind, type),
        message: content[0] || String(message || ""),
        lines: content.slice(1),
        meta
    };
}

export function applyFeedbackSurface(element, spec, pulseScene = null) {
    if (!element) {
        return;
    }

    const nextSceneKind = spec?.sceneKind || null;
    element.innerHTML = renderFeedbackSurface(spec);
    element.className = `feedback feedback--${spec?.type || "idle"}${nextSceneKind ? ` feedback--kind-${nextSceneKind}` : ""}`;
    element.dataset.sceneKind = nextSceneKind || "";

    if (spec?.pulse !== false && nextSceneKind && typeof pulseScene === "function") {
        pulseScene(nextSceneKind);
    }
}

function feedbackEyebrow(sceneKind, type = "idle") {
    switch (sceneKind) {
        case "accepted":
            return "Verdict sealed";
        case "pending":
            return "Judgement in motion";
        case "danger":
            return "Boundary strain";
        case "failure":
            return "Signal fracture";
        default:
            return type === "error" ? "Signal fracture" : "Chamber signal";
    }
}

function feedbackTitle(sceneKind, type = "idle") {
    switch (sceneKind) {
        case "accepted":
            return "Run aligned with the codex";
        case "pending":
            return "The chamber is still weighing the run";
        case "danger":
            return "The run pressed against the limit";
        case "failure":
            return "The chamber rejected the pattern";
        default:
            return type === "error" ? "The current signal broke mid-flow" : "The solve chamber answered";
    }
}

function renderFeedbackBadge(entry) {
    if (!entry) {
        return "";
    }

    if (typeof entry === "string") {
        return renderBadge(entry);
    }

    return renderBadge(entry.label || "", {
        className: `${entry.status ? statusPillClass(entry.status) : ""} ${entry.className || ""}`.trim()
    });
}

function feedbackSigil(sceneKind, type = "idle") {
    switch (sceneKind) {
        case "accepted":
            return "AC";
        case "pending":
            return "PN";
        case "danger":
            return "TL";
        case "failure":
            return "FR";
        default:
            return type === "error" ? "ER" : "ID";
    }
}

function feedbackFrameClass(sceneKind, type = "idle") {
    switch (sceneKind) {
        case "accepted":
            return "feedback__frame--accepted";
        case "pending":
            return "feedback__frame--pending";
        case "danger":
            return "feedback__frame--danger";
        case "failure":
            return "feedback__frame--failure";
        default:
            return type === "error" ? "feedback__frame--failure" : "feedback__frame--idle";
    }
}

function feedbackAtmosphere(sceneKind, type = "idle") {
    switch (sceneKind) {
        case "accepted":
            return "Seal tone: cold clarity and quiet release.";
        case "pending":
            return "Chamber tone: the verdict is still gathering weight.";
        case "danger":
            return "Boundary tone: the run held, but the pressure line glowed red.";
        case "failure":
            return "Fracture tone: something in the pattern broke before closure.";
        default:
            return type === "error"
                ? "Signal tone: broken flow, regroup and strike again."
                : "Chamber tone: calm, waiting for the next move.";
    }
}

function renderFeedbackSurface(spec) {
    const meta = Array.isArray(spec?.meta) ? spec.meta.filter(Boolean) : [];
    const lines = Array.isArray(spec?.lines)
        ? spec.lines.map((line) => String(line || "").trim()).filter(Boolean)
        : [];
    const sceneKind = spec?.sceneKind || null;
    const frameClass = feedbackFrameClass(sceneKind, spec?.type || "idle");
    const sigil = spec?.sigil || feedbackSigil(sceneKind, spec?.type || "idle");
    const atmosphere = spec?.atmosphere || feedbackAtmosphere(sceneKind, spec?.type || "idle");
    const metaHtml = meta.length > 0
        ? `<div class="feedback__meta">${meta.map(renderFeedbackBadge).join("")}</div>`
        : "";
    const linesHtml = lines.length > 0
        ? `<div class="feedback__stack">${lines.map((line) => `<p class="feedback__line">${escapeHtml(line)}</p>`).join("")}</div>`
        : "";
    const messageHtml = spec?.message
        ? `<p class="feedback__message">${escapeHtml(spec.message)}</p>`
        : "";
    const hintHtml = spec?.hint
        ? `<p class="feedback__hint">${escapeHtml(spec.hint)}</p>`
        : "";
    const bodyHtml = spec?.bodyHtml
        ? `<div class="feedback__body">${spec.bodyHtml}</div>`
        : "";
    const actionsHtml = spec?.actionsHtml
        ? `<div class="feedback__actions">${spec.actionsHtml}</div>`
        : "";

    return `
        <div class="feedback__frame ${frameClass}">
            <div class="feedback__sigil" aria-hidden="true">
                <span class="feedback__sigil-ring"></span>
                <span class="feedback__sigil-ring feedback__sigil-ring--inner"></span>
                <span class="feedback__sigil-core">${escapeHtml(sigil)}</span>
            </div>
            <div class="feedback__content">
                <div class="feedback__header">
                    <div class="feedback__copy">
                        <p class="feedback__eyebrow">${escapeHtml(spec?.eyebrow || "Chamber signal")}</p>
                        <h3 class="feedback__title">${escapeHtml(spec?.title || "Signal received")}</h3>
                        ${messageHtml}
                    </div>
                    ${metaHtml}
                </div>
                <p class="feedback__atmosphere">${escapeHtml(atmosphere)}</p>
                ${linesHtml}
                ${hintHtml}
                ${bodyHtml}
                ${actionsHtml}
            </div>
        </div>
    `;
}
