import { escapeHtml, formatDate, renderBadge, renderEmptyState, renderGhostButton } from "../shared/ui.js";

export function getRunnerHealthDescriptor(context) {
    const { state } = context;
    return state.runnerHealth?.runner || null;
}

export function isDockerExecutionActive(context) {
    const runner = getRunnerHealthDescriptor(context);
    return Boolean(runner?.sandboxActive && runner?.mode === "DOCKER");
}

export function getLocalToolchainHealth(context, language) {
    const runner = getRunnerHealthDescriptor(context);
    if (!runner || !Array.isArray(runner.localToolchains)) {
        return null;
    }

    return runner.localToolchains.find((toolchain) => toolchain.language === language) || null;
}

export function getMissingLocalToolchains(context) {
    const runner = getRunnerHealthDescriptor(context);
    if (!runner || !Array.isArray(runner.localToolchains)) {
        return [];
    }

    return runner.localToolchains.filter((toolchain) => toolchain.available === false);
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

export async function copyRuntimeCommand(context, command, language) {
    const { showFeedback } = context;
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

export function renderRunnerHealth(context) {
    const { state, refs, renderEditorForgeStatus } = context;
    const health = state.runnerHealth;
    if (!health || !health.runner) {
        refs.runnerHealthCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Infra</p>
                    <h3>Execution Runtime</h3>
                </div>
                ${renderGhostButton(state.runnerHealthRefreshing ? "Refreshing..." : "Refresh", {
                    attributes: {
                        "data-runner-health-refresh": true,
                        disabled: state.runnerHealthRefreshing
                    }
                })}
            </div>
            ${renderEmptyState("Runner health bilgisi yuklenemedi.")}
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
                ${renderBadge(judgeQueue.pressure || "IDLE", judgeQueue.pressure === "BACKLOGGED" ? "badge--accent-soft" : "")}
                ${renderBadge(`${judgeQueue.pendingSubmissions ?? 0} pending`)}
                ${judgeQueue.oldestPendingAgeSeconds != null ? renderBadge(`Oldest ${judgeQueue.oldestPendingAgeSeconds}s`) : ""}
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
                                    ${renderGhostButton("Copy fix", {
                                        attributes: {
                                            "data-copy-runtime-command": toolchain.setupCommand,
                                            "data-copy-runtime-language": toolchain.language || "Runtime"
                                        }
                                    })}
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
                ${renderBadge(runner.readiness || modeLabel, runner.readiness === "READY" ? "badge--accent-soft" : "")}
                ${renderGhostButton(state.runnerHealthRefreshing ? "Refreshing..." : "Refresh", {
                    attributes: {
                        "data-runner-health-refresh": true,
                        disabled: state.runnerHealthRefreshing
                    }
                })}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Runner mode</p>
            <div class="workspace-card__breakdown">
                ${renderBadge(`Judge: ${judgeMode}`)}
                ${renderBadge(`Requested: ${requestedMode}`)}
                ${renderBadge(`Effective: ${modeLabel}`, runner.sandboxActive ? "badge--accent-soft" : "")}
                ${renderBadge(dockerState)}
                ${renderBadge(`Fallback: ${runner.fallbackMode || "LOCAL"}`)}
                ${renderBadge(`${runner.availableLanguageCount ?? 0}/${runner.supportedLanguageCount ?? 0} languages`)}
                ${runner.dockerVersion ? renderBadge(`Docker ${runner.dockerVersion}`) : ""}
            </div>
            <p class="dashboard-card__hint">Profile: ${escapeHtml(profiles)}</p>
            <p class="dashboard-card__hint">Last checked: ${escapeHtml(checkedAt)}</p>
            <p class="dashboard-card__hint">${escapeHtml(message)}</p>
            ${runner.actionRequired && runner.actionMessage ? `<p class="dashboard-card__hint">${escapeHtml(runner.actionMessage)}</p>` : ""}
        </div>
        ${queueMarkup}
        ${toolchainMarkup}
    `;
    renderEditorForgeStatus();
}

export function renderPreflightBanner(context) {
    const { state, refs, getRunnerHealthDescriptor } = context;
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
