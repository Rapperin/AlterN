export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

export function formatDate(value) {
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

export function formatShortDate(value) {
    if (!value) {
        return "-";
    }

    const date = typeof value === "string"
        ? new Date(value.length > 10 ? value : `${value}T00:00:00`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit"
    }).format(date);
}

export function difficultyClass(difficulty) {
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

export function shorten(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || "";
    }
    return `${text.slice(0, maxLength - 1)}...`;
}

export function formatViewerStatus(status) {
    if (!status) {
        return "Login";
    }

    switch ((status || "").toUpperCase()) {
        case "WRONG_ANSWER":
            return "Wrong Answer";
        case "TIME_LIMIT_EXCEEDED":
            return "Time Limit Exceeded";
        case "COMPILATION_ERROR":
            return "Compilation Error";
        case "RUNTIME_ERROR":
            return "Runtime Error";
        case "NOT_STARTED":
            return "Not started";
        case "BOOKMARKED":
            return "Bookmarked";
        default:
            return String(status)
                .split("_")
                .map((token) => token ? `${token.charAt(0)}${token.slice(1).toLowerCase()}` : token)
                .join(" ");
    }
}

export function activityCellClass(entry) {
    const submissions = Number(entry?.submissions ?? 0);
    const accepted = Number(entry?.accepted ?? 0);

    if (accepted > 0 && submissions >= 3) {
        return "activity-cell--high";
    }

    if (accepted > 0 || submissions >= 2) {
        return "activity-cell--mid";
    }

    if (submissions >= 1) {
        return "activity-cell--low";
    }

    return "activity-cell--idle";
}

export function statusPillClass(status) {
    switch ((status || "").toUpperCase()) {
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
        case "BOOKMARKED":
            return "status-pill--not-started";
        default:
            return "status-pill--login";
    }
}

export function renderEmptyState(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

export function renderBadge(label, classNameOrOptions = "") {
    const options = typeof classNameOrOptions === "string"
        ? { className: classNameOrOptions }
        : (classNameOrOptions || {});
    const nextClassName = options.className ? `badge ${options.className}` : "badge";
    return `<span class="${escapeHtml(nextClassName)}"${buildHtmlAttributes(options.attributes)}>${escapeHtml(label)}</span>`;
}

export function renderGhostButton(label, options = {}) {
    const className = buildGhostControlClassName(options.extraClassName);
    return `<button type="button" class="${escapeHtml(className)}"${buildHtmlAttributes(options.attributes)}>${escapeHtml(label)}</button>`;
}

export function renderGhostLink(label, href, options = {}) {
    const className = buildGhostControlClassName(options.extraClassName);
    return `<a class="${escapeHtml(className)}" href="${escapeHtml(href)}"${buildHtmlAttributes(options.attributes)}>${escapeHtml(label)}</a>`;
}

export function renderJourneySection(journey, mode) {
    if (!journey) {
        return `<p class="workspace-card__lead">Journey bilgisi henuz hazir degil.</p>`;
    }

    const goalList = Array.isArray(journey.nextGoals) && journey.nextGoals.length > 0
        ? journey.nextGoals
        : Array.isArray(journey.goals)
            ? journey.goals
            : [];
    const progressPercent = Math.max(0, Math.min(100, Number(journey.progressPercent ?? journey.completionPercent ?? 0)));
    const nextCopy = journey.maxLevel
        ? "Maksimum tier acildi."
        : journey.nextLevel || journey.nextTitle || journey.nextSolvedTarget
            ? `Next: Lv.${journey.nextLevel} ${journey.nextTitle || "-"} at ${journey.nextSolvedTarget ?? 0} solved`
            : (journey.description || "");

    return `
        <article class="dashboard-card__spotlight">
            <strong>${escapeHtml(journey.level ? `Lv.${journey.level} ${journey.title || "Journey"}` : (journey.title || "Journey"))}</strong>
            <p>${escapeHtml(nextCopy)}</p>
            <div class="journey-meter">
                <span class="journey-meter__fill" style="width: ${progressPercent}%"></span>
            </div>
            <span class="dashboard-card__hint">${progressPercent}% progress</span>
        </article>
        ${goalList.length > 0 ? `
            <div class="dashboard-card__list">
                ${goalList.map((goal) => `
                    <article class="dashboard-card__item ${mode === "dashboard" ? "journey-goal" : ""}">
                        <strong>${escapeHtml(goal.title || "Goal")}</strong>
                        <p>${escapeHtml(goal.description || "")}</p>
                        <span class="dashboard-card__hint">${goal.currentValue ?? 0}/${goal.targetValue ?? 0} ${escapeHtml(goal.unit || "")}</span>
                    </article>
                `).join("")}
            </div>
        ` : `<p class="workspace-card__lead">Su an yakin hedef kalmadi; tum ana milestone'lar tamam.</p>`}
    `;
}

function buildGhostControlClassName(extraClassName = "") {
    return extraClassName
        ? `button button--ghost button--small ${extraClassName}`.trim()
        : "button button--ghost button--small";
}

function buildHtmlAttributes(attributes = {}) {
    return Object.entries(attributes)
        .filter(([, value]) => value !== null && value !== undefined && value !== false)
        .map(([key, value]) => value === true
            ? ` ${escapeHtml(key)}`
            : ` ${escapeHtml(key)}="${escapeHtml(value)}"`)
        .join("");
}
