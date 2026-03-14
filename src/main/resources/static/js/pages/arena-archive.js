import {
    difficultyClass,
    escapeHtml,
    formatViewerStatus,
    renderBadge,
    renderEmptyState,
    renderGhostButton,
    shorten,
    statusPillClass
} from "../shared/ui.js";
import { problemCardSceneClass } from "./arena-feedback.js";

export function renderProblemList(context) {
    const {
        state,
        refs,
        selectProblem,
        matchesProblemScope,
        matchesProblemDifficulty,
        matchesProblemTag,
        hasProblemDraft,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB
    } = context;
    const query = refs.problemSearch.value.trim().toLowerCase();
    const continueProblemId = state.userDashboard?.continueAttempt?.problemId;
    const suggestedProblemId = state.userDashboard?.suggestedProblem?.problemId;
    state.filteredProblems = state.problems.filter((problem) => {
        const searchable = `${problem.title} ${problem.difficulty} ${(problem.tags || []).join(" ")}`.toLowerCase();
        return searchable.includes(query)
            && matchesProblemScope(problem)
            && matchesProblemDifficulty(problem)
            && matchesProblemTag(problem);
    });
    refs.problemCount.textContent = state.filteredProblems.length === state.problems.length
        ? `${state.problems.length} problem`
        : `${state.filteredProblems.length}/${state.problems.length} problem`;

    if (state.filteredProblems.length === 0) {
        refs.problemList.innerHTML = renderEmptyState("Filtreye uygun problem bulunamadi.");
        return;
    }

    refs.problemList.innerHTML = state.filteredProblems.map((problem) => `
        <article class="problem-card ${problemCardSceneClass(problem)} ${problem.id === state.selectedProblemId ? "is-active" : ""}" data-problem-id="${problem.id}">
            <h3>${escapeHtml(problem.title)}</h3>
            <p>${escapeHtml(shorten(problem.description, 120))}</p>
            <div class="problem-card__meta">
                <span class="difficulty ${difficultyClass(problem.difficulty)}">${problem.difficulty}</span>
                ${renderBadge(`${problem.testCaseCount} sample`)}
                ${renderBadge(`${problem.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS} ms`)}
                ${renderBadge(`${problem.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB} MB`)}
                ${renderBadge(`${problem.submissionCount} submission`)}
                ${state.currentUser ? renderBadge(`You: ${formatViewerStatus(problem.viewerStatus)}`, statusPillClass(problem.viewerStatus)) : ""}
                ${state.currentUser && problem.viewerBookmarked ? renderBadge("Saved", "badge--accent-soft") : ""}
                ${hasProblemDraft(problem.id) ? renderBadge("Draft", "badge--accent") : ""}
                ${continueProblemId === problem.id ? renderBadge("Continue", "badge--accent") : ""}
                ${suggestedProblemId === problem.id ? renderBadge("Next", "badge--accent-soft") : ""}
                ${(problem.tags || []).slice(0, 2).map((tag) => renderBadge(tag)).join("")}
            </div>
        </article>
    `).join("");

    refs.problemList.querySelectorAll("[data-problem-id]").forEach((card) => {
        card.addEventListener("click", () => selectProblem(Number(card.dataset.problemId)));
    });
}

export function renderProblemFacets(context) {
    const { state, refs, clearProblemFilters, setProblemDifficultyFilter, setProblemTagFilter } = context;
    const tags = [...new Set(
        state.problems.flatMap((problem) => problem.tags || [])
    )].sort((left, right) => left.localeCompare(right));
    const activeFilters = buildActiveArchiveFilters(context);
    const hasActiveFilters = activeFilters.length > 0;

    refs.problemFacetCard.innerHTML = `
        <div class="facet-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Problem focus</p>
                <h3>Difficulty & Tags</h3>
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
        <div class="facet-card__section facet-card__section--summary">
            <p class="facet-card__label">Archive state</p>
            <div class="facet-card__summary">
                <p class="facet-card__result">
                    ${state.filteredProblems.length || 0} gorunur / ${state.problems.length || 0} toplam
                </p>
                <p class="facet-card__summary-copy">
                    ${hasActiveFilters
                        ? "Aktif filtreler archive akisini daraltiyor."
                        : "Tum archive akisi acik. Aramayi, zorlugu veya tag'i daraltarak odaklanabilirsin."}
                </p>
                <div class="workspace-card__breakdown">
                    ${hasActiveFilters
                        ? activeFilters.map((label) => renderBadge(label, "badge--accent-soft")).join("")
                        : renderBadge("Temiz durum", "badge--accent-soft")}
                </div>
                ${hasActiveFilters ? `
                    <div class="workspace-card__actions">
                        ${renderGhostButton("Filtreleri temizle", {
                            attributes: { "data-clear-problem-filters": true }
                        })}
                    </div>
                ` : ""}
            </div>
        </div>
    `;

    refs.problemFacetCard.querySelectorAll("[data-difficulty-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemDifficultyFilter(button.dataset.difficultyFilter);
        });
    });

    refs.problemFacetCard.querySelectorAll("[data-tag-filter]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemTagFilter(button.dataset.tagFilter);
        });
    });

    refs.problemFacetCard.querySelector("[data-clear-problem-filters]")?.addEventListener("click", () => {
        clearProblemFilters();
    });
}

export function renderProgressSummary(context) {
    const { state, refs, setProblemScope } = context;
    if (!refs.progressSummary) {
        return;
    }

    if (!state.currentUser) {
        refs.progressSummary.innerHTML = `
            <p class="progress-summary__lead">
                Giris yaptiginda hangi problemleri cozdun ve hangilerinde kaldigini burada goreceksin.
            </p>
        `;
        return;
    }

    const solved = state.problems.filter((problem) => problem.viewerSolved).length;
    const attempted = state.problems.filter((problem) =>
        problem.viewerStatus
        && problem.viewerStatus !== "NOT_STARTED"
        && problem.viewerStatus !== "ACCEPTED"
    ).length;
    const bookmarked = state.problems.filter((problem) => problem.viewerBookmarked).length;
    const remaining = Math.max(state.problems.length - solved, 0);

    refs.progressSummary.innerHTML = `
        <div class="progress-summary__grid">
            <article class="progress-summary__card">
                <span>Solved</span>
                <strong>${solved}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Attempted</span>
                <strong>${attempted}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Remaining</span>
                <strong>${remaining}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Saved</span>
                <strong>${bookmarked}</strong>
            </article>
        </div>
        <div class="filter-group">
            ${renderProblemScopeButton(state.problemScope, "ALL", "Tum")}
            ${renderProblemScopeButton(state.problemScope, "REMAINING", "Remaining")}
            ${renderProblemScopeButton(state.problemScope, "ATTEMPTED", "Attempted")}
            ${renderProblemScopeButton(state.problemScope, "SOLVED", "Solved")}
            ${renderProblemScopeButton(state.problemScope, "BOOKMARKED", "Saved")}
        </div>
    `;

    refs.progressSummary.querySelectorAll("[data-problem-scope]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemScope(button.dataset.problemScope);
        });
    });
}

function renderProblemScopeButton(selectedScope, scope, label) {
    return renderGhostButton(label, {
        extraClassName: selectedScope === scope ? "button--soft" : "",
        attributes: { "data-problem-scope": scope }
    });
}

function renderFacetButton(kind, value, label, selectedValue) {
    const active = selectedValue === value;
    const attributes = kind === "difficulty"
        ? { "data-difficulty-filter": value }
        : { "data-tag-filter": value };

    return renderGhostButton(label, {
        extraClassName: active ? "button--soft" : "",
        attributes
    });
}

function buildActiveArchiveFilters(context) {
    const { state, refs } = context;
    const filters = [];
    const search = refs.problemSearch.value.trim();
    if (search) {
        filters.push(`Ara: ${search}`);
    }
    if (state.problemScope && state.problemScope !== "ALL") {
        filters.push(`Scope: ${formatArchiveScope(state.problemScope)}`);
    }
    if (state.problemDifficultyFilter && state.problemDifficultyFilter !== "ALL") {
        filters.push(`Zorluk: ${state.problemDifficultyFilter}`);
    }
    if (state.problemTagFilter && state.problemTagFilter !== "ALL") {
        filters.push(`Tag: ${state.problemTagFilter}`);
    }
    return filters;
}

function formatArchiveScope(scope) {
    switch (scope) {
        case "REMAINING":
            return "Remaining";
        case "ATTEMPTED":
            return "Attempted";
        case "SOLVED":
            return "Solved";
        case "BOOKMARKED":
            return "Saved";
        default:
            return "Tum";
    }
}
