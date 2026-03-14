import { buildArenaUrl } from "../shared/arena-links.js";
import { difficultyClass, escapeHtml, renderBadge, renderEmptyState, renderGhostButton, renderGhostLink, shorten } from "../shared/ui.js";

const CATALOG_ATTENTION_ORDER = [
    "NEEDS_HIDDEN_DEPTH",
    "LOW_TOTAL_CASE_COVERAGE",
    "NEEDS_PUBLIC_SAMPLE",
    "LOW_EXAMPLE_DEPTH",
    "MISSING_HINT",
    "MISSING_EDITORIAL"
];

export function renderProblemFacets(context) {
    const { state, refs } = context;
    const tags = [...new Set(state.problems.flatMap((problem) => problem.tags || []))]
        .sort((left, right) => left.localeCompare(right));
    const attentionBreakdown = buildCatalogAttentionBreakdown(context);
    const activeFilters = buildActiveCatalogFilters(context);
    const hasActiveFilters = activeFilters.length > 0;

    refs.problemFacetCard.innerHTML = `
        <div class="facet-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Problem focus</p>
                <h3>Difficulty, Tags & Attention</h3>
            </div>
        </div>
        <div class="facet-card__section">
            <p class="facet-card__label">Difficulty</p>
            <div class="filter-group">
                ${renderFacetButton("difficulty", "ALL", "Tum", state.problemDifficultyFilter)}
                ${renderFacetButton("difficulty", "EASY", "Easy", state.problemDifficultyFilter)}
                ${renderFacetButton("difficulty", "MEDIUM", "Medium", state.problemDifficultyFilter)}
                ${renderFacetButton("difficulty", "HARD", "Hard", state.problemDifficultyFilter)}
            </div>
        </div>
        <div class="facet-card__section">
            <p class="facet-card__label">Tags</p>
            <div class="filter-group">
                ${renderFacetButton("tag", "ALL", "Tum", state.problemTagFilter)}
                ${tags.length > 0
                    ? tags.map((tag) => renderFacetButton("tag", tag, tag, state.problemTagFilter)).join("")
                    : renderBadge("Tag yok")}
            </div>
        </div>
        ${context.isAdmin() ? `
            <div class="facet-card__section">
                <p class="facet-card__label">Catalog curation</p>
                <div class="filter-group">
                    ${renderAdminAttentionButton(state.adminAttentionFilter, "ALL", "Tum problemler")}
                    ${renderAdminAttentionButton(state.adminAttentionFilter, "ATTENTION", `Need attention (${state.catalogHealth?.problemsNeedingAttention ?? 0})`)}
                    ${attentionBreakdown.length > 0
                        ? attentionBreakdown.map(([flag, count]) => renderAdminAttentionButton(state.adminAttentionFilter, flag, `${formatCatalogAttentionFlag(flag)} (${count})`)).join("")
                        : renderBadge("Attention yok")}
                </div>
            </div>
        ` : ""}
        <div class="facet-card__section facet-card__section--summary">
            <p class="facet-card__label">Curation state</p>
            <div class="facet-card__summary">
                <p class="facet-card__result">
                    ${state.filteredProblems.length || 0} gorunur / ${state.problems.length || 0} toplam
                </p>
                <p class="facet-card__summary-copy">
                    ${hasActiveFilters
                        ? "Aktif filtreler authoring kuyrugunu daraltiyor."
                        : "Tum curation kuyruğu acik. Dikkat bayraklari veya tag ile odak daraltabilirsin."}
                </p>
                <div class="workspace-card__breakdown">
                    ${hasActiveFilters
                        ? activeFilters.map((label) => renderBadge(label, "badge--attention")).join("")
                        : renderBadge("Temiz durum", "badge--accent-soft")}
                </div>
                ${hasActiveFilters ? `
                    <div class="workspace-card__actions">
                        ${renderGhostButton("Filtreleri temizle", {
                            attributes: { "data-clear-catalog-filters": true }
                        })}
                    </div>
                ` : ""}
            </div>
        </div>
    `;

    refs.problemFacetCard.querySelectorAll("[data-difficulty-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            state.problemDifficultyFilter = button.dataset.difficultyFilter || "ALL";
            void context.refreshCatalogView();
        });
    });

    refs.problemFacetCard.querySelectorAll("[data-tag-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            state.problemTagFilter = button.dataset.tagFilter || "ALL";
            void context.refreshCatalogView();
        });
    });

    refs.problemFacetCard.querySelectorAll("[data-admin-attention-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            state.adminAttentionFilter = button.dataset.adminAttentionFilter || "ALL";
            void context.refreshCatalogView();
        });
    });

    refs.problemFacetCard.querySelector("[data-clear-catalog-filters]")?.addEventListener("click", () => {
        context.clearCatalogFilters();
    });
}

export function renderProblemList(context) {
    const { state, refs } = context;
    const query = refs.problemSearch.value.trim().toLowerCase();
    state.filteredProblems = state.problems.filter((problem) => {
        const searchable = `${problem.title} ${problem.difficulty} ${(problem.tags || []).join(" ")}`.toLowerCase();
        return searchable.includes(query)
            && matchesProblemDifficulty(context, problem)
            && matchesProblemTag(context, problem)
            && matchesProblemAttention(context, problem);
    });
    refs.problemCount.textContent = state.filteredProblems.length === state.problems.length
        ? `${state.problems.length} problem`
        : `${state.filteredProblems.length}/${state.problems.length} problem`;

    if (state.filteredProblems.length === 0) {
        refs.problemList.innerHTML = renderEmptyState("Filtreye uygun problem bulunamadi.");
        return;
    }

    refs.problemList.innerHTML = state.filteredProblems.map((problem) => `
        <article class="problem-card ${difficultyClass(problem.difficulty)} ${problem.id === state.selectedProblemId ? "is-active" : ""}" data-problem-id="${problem.id}">
            <h3>${escapeHtml(problem.title)}</h3>
            <p>${escapeHtml(shorten(problem.description || "", 120))}</p>
            <div class="problem-card__meta">
                ${renderBadge(problem.difficulty || "-", difficultyClass(problem.difficulty))}
                ${renderBadge(`${problem.testCaseCount ?? 0} sample`)}
                ${renderBadge(`${problem.timeLimitMs ?? context.defaultTimeLimitMs} ms`)}
                ${renderBadge(`${problem.memoryLimitMb ?? context.defaultMemoryLimitMb} MB`)}
                ${renderProblemAttentionBadges(context, problem)}
                ${(problem.tags || []).slice(0, 2).map((tag) => renderBadge(tag)).join("")}
            </div>
        </article>
    `).join("");

    refs.problemList.querySelectorAll("[data-problem-id]").forEach((card) => {
        card.addEventListener("click", () => {
            void context.selectProblem(Number(card.dataset.problemId));
        });
    });
}

export function renderSelectedProblemCard(context) {
    const { state, refs } = context;
    if (!state.selectedProblem) {
        refs.selectedProblemCard.innerHTML = renderEmptyState("Bir problem sec; secili codex ozeti burada gorunecek.");
        return;
    }

    const attentionFlags = problemAttentionFlags(context, state.selectedProblem.id);
    refs.selectedProblemCard.innerHTML = `
        <p class="workspace-debug__eyebrow">Selected codex</p>
        <h3>${escapeHtml(state.selectedProblem.title)}</h3>
        <p class="workspace-card__lead">${escapeHtml(shorten(state.selectedProblem.description || "", 180))}</p>
        <div class="workspace-card__breakdown">
            ${renderBadge(state.selectedProblem.difficulty || "-", difficultyClass(state.selectedProblem.difficulty))}
            ${renderBadge(`${state.visibleTestCases.length} public sample`)}
            ${renderBadge(`${state.selectedProblem.timeLimitMs ?? context.defaultTimeLimitMs} ms`)}
            ${renderBadge(`${state.selectedProblem.memoryLimitMb ?? context.defaultMemoryLimitMb} MB`)}
            ${attentionFlags.slice(0, 2).map((flag) => renderBadge(formatCatalogAttentionFlag(flag), "badge--attention")).join("")}
        </div>
        <div class="workspace-card__actions">
            ${renderGhostLink("Arena'da ac", buildArenaUrl({ problemId: state.selectedProblem.id, source: "sanctum" }))}
            ${renderGhostLink("API detail", `/api/problems/${state.selectedProblem.id}`)}
        </div>
    `;
}

export function renderCatalogHealth(context) {
    const { state, refs } = context;
    if (!context.isAdmin()) {
        refs.catalogHealthCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Catalog preview</p>
                    <h3>Queue Snapshot</h3>
                </div>
                ${renderBadge("Admin lock")}
            </div>
            <div class="dashboard-card__grid">
                <article class="dashboard-card__stat">
                    <span>Visible</span>
                    <strong>${state.filteredProblems.length || 0}</strong>
                </article>
                <article class="dashboard-card__stat">
                    <span>Total</span>
                    <strong>${state.problems.length || 0}</strong>
                </article>
                <article class="dashboard-card__stat">
                    <span>Selected</span>
                    <strong>${state.selectedProblem ? (state.selectedProblem.testCaseCount ?? 0) : 0}</strong>
                </article>
                <article class="dashboard-card__stat">
                    <span>Focus</span>
                    <strong>${escapeHtml(state.selectedProblem?.difficulty || "Queue")}</strong>
                </article>
            </div>
            <p class="workspace-card__lead">
                Catalog sagligi ve dikkat bayraklari admin oturumuyla acilir. Public queue ise problem
                secimi ve codex incelemesi icin kullanilabilir.
            </p>
        `;
        return;
    }

    if (!state.catalogHealth) {
        refs.catalogHealthCard.innerHTML = renderEmptyState("Katalog sagligi yukleniyor.");
        return;
    }

    const health = state.catalogHealth;
    const problemsByDifficulty = Object.entries(health.problemsByDifficulty || {});
    const attentionProblems = (health.attentionProblems || []).filter((problem) =>
        matchesCatalogAttentionProblem(context, problem)
    );
    const attentionBreakdown = buildCatalogAttentionBreakdown(context);
    const activeAttentionLabel = state.adminAttentionFilter === "ALL"
        ? "Tum problemler"
        : state.adminAttentionFilter === "ATTENTION"
            ? "Need attention"
            : formatCatalogAttentionFlag(state.adminAttentionFilter);

    refs.catalogHealthCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Catalog Health</p>
                <h3>Content Coverage</h3>
            </div>
            ${renderBadge(state.adminAttentionFilter === "ALL" ? `${health.problemsNeedingAttention ?? 0} attention` : activeAttentionLabel)}
        </div>
        <div class="dashboard-card__grid">
            <article class="dashboard-card__stat">
                <span>Problems</span>
                <strong>${health.totalProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Public samples</span>
                <strong>${health.totalPublicTestCases ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Hidden cases</span>
                <strong>${health.totalHiddenTestCases ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Need attention</span>
                <strong>${health.problemsNeedingAttention ?? 0}</strong>
            </article>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Problems by difficulty</p>
            <div class="workspace-card__breakdown">
                ${problemsByDifficulty.length > 0
                    ? problemsByDifficulty.map(([difficulty, count]) => renderBadge(`${difficulty}: ${count}`, difficultyClass(difficulty))).join("")
                    : renderBadge("Veri yok")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Gap breakdown</p>
            <div class="workspace-card__breakdown">
                ${attentionBreakdown.length > 0
                    ? attentionBreakdown.map(([flag, count]) => renderBadge(`${formatCatalogAttentionFlag(flag)}: ${count}`, "badge--attention")).join("")
                    : renderBadge("Gap yok", "badge--accent-soft")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Attention queue</p>
            ${attentionProblems.length > 0 ? `
                <div class="dashboard-card__list">
                    ${attentionProblems.map((problem) => `
                        <article class="dashboard-card__item dashboard-card__item--interactive" data-admin-problem-id="${problem.problemId}">
                            <strong>${escapeHtml(problem.title || "Problem")}</strong>
                            <p>${escapeHtml(problem.difficulty || "-")} | ${(problem.attentionFlags || []).length} gap</p>
                            <span>${escapeHtml((problem.attentionFlags || []).slice(0, 2).map((flag) => formatCatalogAttentionFlag(flag)).join(" • "))}</span>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Bu filtre icin dikkat isteyen problem yok.</p>`}
        </div>
    `;

    refs.catalogHealthCard.querySelectorAll("[data-admin-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void context.selectProblem(Number(entry.dataset.adminProblemId));
        });
    });
}

export function renderAuthoringFocusCard(context) {
    const { state, refs } = context;
    if (!context.isAdmin()) {
        refs.authoringFocusCard.innerHTML = state.selectedProblem ? `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Selected codex</p>
                    <h3>${escapeHtml(state.selectedProblem.title || "Problem")}</h3>
                </div>
                ${renderBadge(state.selectedProblem.difficulty || "-", difficultyClass(state.selectedProblem.difficulty))}
            </div>
            <div class="workspace-card__breakdown">
                ${renderBadge(`${state.visibleTestCases.length} public sample`)}
                ${renderBadge(`${state.selectedProblem.timeLimitMs ?? context.defaultTimeLimitMs} ms`)}
                ${renderBadge(`${state.selectedProblem.memoryLimitMb ?? context.defaultMemoryLimitMb} MB`)}
            </div>
            <p class="workspace-card__lead">
                Public codex burada okunabilir. Authoring priorities, scaffold yardimi ve gap odagi
                admin oturumu acildiginda gorunur.
            </p>
            <div class="workspace-card__actions">
                ${renderGhostLink("Arena'da ac", buildArenaUrl({ problemId: state.selectedProblem.id, source: "sanctum" }))}
            </div>
        ` : renderEmptyState("Bir problem sec; public codex ozeti burada gorunecek.");
        return;
    }

    if (!state.selectedProblem) {
        refs.authoringFocusCard.innerHTML = renderEmptyState("Bir problem sec; eksik alanlara hizli gecis burada cikacak.");
        return;
    }

    const attentionProblem = findCatalogAttentionProblem(context, state.selectedProblemId);
    const attentionFlags = attentionProblem?.attentionFlags || [];
    const nextAttentionProblem = resolveNextAttentionProblem(context);

    refs.authoringFocusCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Authoring Priorities</p>
                <h3>${escapeHtml(state.selectedProblem.title || "Selected problem")}</h3>
            </div>
            ${renderBadge(attentionFlags.length === 0 ? "Healthy" : `${attentionFlags.length} gaps`, attentionFlags.length === 0 ? "badge--accent-soft" : "")}
        </div>
        ${nextAttentionProblem ? `
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Next weak problem</p>
                <article class="dashboard-card__spotlight dashboard-card__spotlight--interactive" data-authoring-next-problem-id="${nextAttentionProblem.problemId}">
                    <strong>${escapeHtml(nextAttentionProblem.title || "Problem")}</strong>
                    <p>${escapeHtml(nextAttentionProblem.difficulty || "-")} | ${(nextAttentionProblem.attentionFlags || []).length} gap</p>
                    <span>${escapeHtml((nextAttentionProblem.attentionFlags || []).slice(0, 2).map((flag) => formatCatalogAttentionFlag(flag)).join(" • "))}</span>
                </article>
            </div>
        ` : ""}
        ${attentionFlags.length > 0 ? `
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Jump to missing pieces</p>
                <div class="workspace-card__breakdown">
                    ${attentionFlags.map((flag) => `
                        ${renderGhostButton(formatCatalogAttentionFlag(flag), {
                            attributes: {
                                "data-authoring-gap-flag": flag
                            }
                        })}
                    `).join("")}
                </div>
            </div>
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">Suggested scaffolds</p>
                <div class="workspace-card__breakdown">
                    ${attentionFlags.map((flag) => `
                        ${renderGhostButton(formatAuthoringScaffoldLabel(flag), {
                            attributes: {
                                "data-authoring-scaffold-flag": flag
                            }
                        })}
                    `).join("")}
                </div>
            </div>
        ` : `<p class="workspace-card__lead">Bu problem mevcut kalite esigine gore saglikli gorunuyor.</p>`}
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Quick jumps</p>
            <div class="workspace-card__breakdown">
                ${renderGhostButton("Statement", { attributes: { "data-authoring-manual-target": "STATEMENT" } })}
                ${renderGhostButton("Examples", { attributes: { "data-authoring-manual-target": "EXAMPLES" } })}
                ${renderGhostButton("Hint", { attributes: { "data-authoring-manual-target": "HINT" } })}
                ${renderGhostButton("Editorial", { attributes: { "data-authoring-manual-target": "EDITORIAL" } })}
                ${renderGhostButton("Testcases", { attributes: { "data-authoring-manual-target": "TESTCASE" } })}
            </div>
        </div>
    `;

    refs.authoringFocusCard.querySelectorAll("[data-authoring-gap-flag]").forEach((button) => {
        button.addEventListener("click", () => {
            context.focusAuthoringTarget(button.dataset.authoringGapFlag);
        });
    });

    refs.authoringFocusCard.querySelectorAll("[data-authoring-scaffold-flag]").forEach((button) => {
        button.addEventListener("click", () => {
            context.applyAuthoringScaffold(button.dataset.authoringScaffoldFlag);
        });
    });

    refs.authoringFocusCard.querySelectorAll("[data-authoring-manual-target]").forEach((button) => {
        button.addEventListener("click", () => {
            context.focusAuthoringTarget(button.dataset.authoringManualTarget);
        });
    });

    refs.authoringFocusCard.querySelectorAll("[data-authoring-next-problem-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void context.selectProblem(Number(button.dataset.authoringNextProblemId));
        });
    });
}

export function normalizeAdminAttentionFilter(context) {
    const { state } = context;
    if (!context.isAdmin() || state.adminAttentionFilter === "ALL") {
        return;
    }

    if (state.adminAttentionFilter === "ATTENTION") {
        if ((state.catalogHealth?.attentionProblems || []).length === 0) {
            state.adminAttentionFilter = "ALL";
        }
        return;
    }

    const availableFlags = new Set(buildCatalogAttentionBreakdown(context).map(([flag]) => flag));
    if (!availableFlags.has(state.adminAttentionFilter)) {
        state.adminAttentionFilter = "ALL";
    }
}

function renderFacetButton(kind, value, label, selectedValue) {
    const active = selectedValue === value;
    const dataAttribute = kind === "difficulty"
        ? `data-difficulty-filter="${escapeHtml(value)}"`
        : `data-tag-filter="${escapeHtml(value)}"`;

    return `
        <button
            type="button"
            class="button button--ghost button--small ${active ? "button--soft" : ""}"
            ${dataAttribute}>
            ${escapeHtml(label)}
        </button>
    `;
}

function renderAdminAttentionButton(selectedValue, value, label) {
    return `
        <button
            type="button"
            class="button button--ghost button--small ${selectedValue === value ? "button--soft" : ""}"
            data-admin-attention-filter="${escapeHtml(value)}">
            ${escapeHtml(label)}
        </button>
    `;
}

function matchesProblemDifficulty(context, problem) {
    return context.state.problemDifficultyFilter === "ALL" || problem.difficulty === context.state.problemDifficultyFilter;
}

function matchesProblemTag(context, problem) {
    return context.state.problemTagFilter === "ALL" || (problem.tags || []).includes(context.state.problemTagFilter);
}

function matchesProblemAttention(context, problem) {
    const { state } = context;
    if (!context.isAdmin() || state.adminAttentionFilter === "ALL") {
        return true;
    }

    const attentionFlags = problemAttentionFlags(context, problem.id);
    if (state.adminAttentionFilter === "ATTENTION") {
        return attentionFlags.length > 0;
    }

    return attentionFlags.includes(state.adminAttentionFilter);
}

function resolveNextAttentionProblem(context) {
    const { state } = context;
    const queue = (state.catalogHealth?.attentionProblems || []).filter((problem) =>
        problem.problemId !== state.selectedProblemId && matchesCatalogAttentionProblem(context, problem)
    );

    if (queue.length > 0) {
        return queue[0];
    }

    return (state.catalogHealth?.attentionProblems || []).find((problem) => problem.problemId !== state.selectedProblemId) || null;
}

function buildCatalogAttentionBreakdown(context) {
    const counts = new Map();

    (context.state.catalogHealth?.attentionProblems || []).forEach((problem) => {
        (problem.attentionFlags || []).forEach((flag) => {
            counts.set(flag, (counts.get(flag) || 0) + 1);
        });
    });

    return CATALOG_ATTENTION_ORDER
        .filter((flag) => counts.has(flag))
        .map((flag) => [flag, counts.get(flag)]);
}

function findCatalogAttentionProblem(context, problemId) {
    return (context.state.catalogHealth?.attentionProblems || []).find((problem) => problem.problemId === problemId) || null;
}

function problemAttentionFlags(context, problemId) {
    return findCatalogAttentionProblem(context, problemId)?.attentionFlags || [];
}

function matchesCatalogAttentionProblem(context, problem) {
    const { state } = context;
    if (state.adminAttentionFilter === "ALL") {
        return true;
    }

    if (state.adminAttentionFilter === "ATTENTION") {
        return (problem.attentionFlags || []).length > 0;
    }

    return (problem.attentionFlags || []).includes(state.adminAttentionFilter);
}

function renderProblemAttentionBadges(context, problem) {
    if (!context.isAdmin()) {
        return "";
    }

    const attentionFlags = problemAttentionFlags(context, problem.id);
    if (attentionFlags.length === 0) {
        return "";
    }

    const visibleFlags = attentionFlags.slice(0, 2);
    const overflow = attentionFlags.length - visibleFlags.length;
    return `
        ${visibleFlags.map((flag) => renderBadge(formatCatalogAttentionFlag(flag), "badge--attention")).join("")}
        ${overflow > 0 ? renderBadge(`+${overflow}`, "badge--attention") : ""}
    `;
}

function formatAuthoringScaffoldLabel(flag) {
    switch (flag) {
        case "LOW_EXAMPLE_DEPTH":
            return "Add example scaffold";
        case "MISSING_HINT":
            return "Seed hint scaffold";
        case "MISSING_EDITORIAL":
            return "Seed editorial scaffold";
        case "NEEDS_PUBLIC_SAMPLE":
            return "Seed public depth";
        case "NEEDS_HIDDEN_DEPTH":
            return "Seed hidden batch";
        case "LOW_TOTAL_CASE_COVERAGE":
            return "Seed coverage batch";
        default:
            return `Scaffold: ${formatCatalogAttentionFlag(flag)}`;
    }
}

function formatCatalogAttentionFlag(flag) {
    switch (flag) {
        case "NEEDS_PUBLIC_SAMPLE":
            return "Need public depth";
        case "NEEDS_HIDDEN_DEPTH":
            return "Need hidden depth";
        case "LOW_TOTAL_CASE_COVERAGE":
            return "Low case coverage";
        case "LOW_EXAMPLE_DEPTH":
            return "Low example depth";
        case "MISSING_HINT":
            return "Missing hint";
        case "MISSING_EDITORIAL":
            return "Missing editorial";
        default:
            return flag || "Attention";
    }
}

function buildActiveCatalogFilters(context) {
    const { state, refs } = context;
    const filters = [];
    const search = refs.problemSearch.value.trim();
    if (search) {
        filters.push(`Ara: ${search}`);
    }
    if (state.problemDifficultyFilter && state.problemDifficultyFilter !== "ALL") {
        filters.push(`Zorluk: ${state.problemDifficultyFilter}`);
    }
    if (state.problemTagFilter && state.problemTagFilter !== "ALL") {
        filters.push(`Tag: ${state.problemTagFilter}`);
    }
    if (context.isAdmin() && state.adminAttentionFilter && state.adminAttentionFilter !== "ALL") {
        filters.push(`Gap: ${formatCatalogAttentionFlag(state.adminAttentionFilter)}`);
    }
    return filters;
}
