import {
    difficultyClass,
    escapeHtml,
    formatDate,
    formatViewerStatus,
    renderBadge,
    renderEmptyState,
    renderGhostButton
} from "../shared/ui.js";

export function renderSelectedProblem(context) {
    const {
        state,
        refs,
        applyProblemScene,
        applyWorkspaceMode,
        renderProblemBookmarkButton,
        renderProblemTags,
        renderProblemExamples,
        renderHint,
        renderEditorial,
        renderEditorForgeStatus,
        DEFAULT_TIME_LIMIT_MS,
        DEFAULT_MEMORY_LIMIT_MB
    } = context;

    if (!state.selectedProblem) {
        return false;
    }

    applyProblemScene(state.selectedProblem);
    applyWorkspaceMode(state.selectedProblem);
    refs.problemTitle.textContent = state.selectedProblem.title;
    refs.problemDifficulty.textContent = state.selectedProblem.difficulty;
    refs.problemDifficulty.className = `difficulty ${difficultyClass(state.selectedProblem.difficulty)}`;
    refs.problemDescription.textContent = state.selectedProblem.description;
    refs.problemConstraints.textContent = state.selectedProblem.constraints || "Constraint belirtilmedi.";
    refs.problemInputFormat.textContent = state.selectedProblem.inputFormat || "Input format belirtilmedi.";
    refs.problemOutputFormat.textContent = state.selectedProblem.outputFormat || "Output format belirtilmedi.";
    refs.visibleTestcaseCount.textContent = state.selectedProblem.testCaseCount;
    refs.submissionCount.textContent = state.selectedProblem.submissionCount;
    refs.viewerStatus.textContent = state.currentUser
        ? formatViewerStatus(state.selectedProblem.viewerStatus)
        : "Login";
    refs.problemTimeLimit.textContent = `${state.selectedProblem.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS} ms`;
    refs.problemMemoryLimit.textContent = `${state.selectedProblem.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB} MB`;
    renderProblemBookmarkButton();
    renderProblemTags();
    renderProblemExamples();
    renderHint();
    renderEditorial();
    renderEditorForgeStatus();
    return true;
}

export function renderProblemBookmarkButton(context) {
    const { state, refs } = context;
    if (!state.currentUser || !state.selectedProblem) {
        refs.problemBookmarkButton.hidden = true;
        refs.problemBookmarkButton.disabled = true;
        refs.problemBookmarkButton.className = "button button--ghost button--small";
        refs.problemBookmarkButton.textContent = "Save for later";
        return;
    }

    const bookmarked = Boolean(state.selectedProblem.viewerBookmarked);
    refs.problemBookmarkButton.hidden = false;
    refs.problemBookmarkButton.disabled = false;
    refs.problemBookmarkButton.className = `button button--ghost button--small ${bookmarked ? "button--soft" : ""}`;
    refs.problemBookmarkButton.textContent = bookmarked ? "Saved" : "Save for later";
}

export function renderProblemLeaderboard(context) {
    const { state, refs, openUserProfile } = context;
    const leaderboard = state.problemLeaderboard;
    if (!state.selectedProblemId) {
        refs.problemLeaderboardCard.innerHTML = renderEmptyState("Problem secildiginde leaderboard burada gorunecek.");
        return;
    }

    if (!leaderboard || !Array.isArray(leaderboard.entries) || leaderboard.entries.length === 0) {
        refs.problemLeaderboardCard.innerHTML = `<p class="workspace-card__lead">Bu problem icin henuz public accepted run yok.</p>`;
        return;
    }

    refs.problemLeaderboardCard.innerHTML = `
        <div class="workspace-card__grid">
            <article class="workspace-card__stat">
                <span>Accepted users</span>
                <strong>${leaderboard.totalAcceptedUsers ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Accepted runs</span>
                <strong>${leaderboard.totalAcceptedSubmissions ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Top runtime</span>
                <strong>${leaderboard.entries[0]?.executionTime ?? 0} ms</strong>
            </article>
        </div>
        <div class="dashboard-card__list">
            ${leaderboard.entries.map((entry) => `
                <article class="dashboard-card__item dashboard-card__item--interactive leaderboard-item ${entry.viewer ? "leaderboard-item--viewer" : ""}" data-profile-username="${escapeHtml(entry.username || "")}">
                    <strong>#${entry.rank} ${escapeHtml(entry.username || "User")}</strong>
                    <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${entry.memoryUsage ?? 0} MB</p>
                    <p>${formatDate(entry.acceptedAt)}</p>
                    <span class="dashboard-card__hint">Public profile ac</span>
                </article>
            `).join("")}
        </div>
    `;

    refs.problemLeaderboardCard.querySelectorAll("[data-profile-username]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void openUserProfile(entry.dataset.profileUsername);
        });
    });
}

export function renderProblemStats(context) {
    const { state, refs } = context;
    const stats = state.problemStats;
    if (!state.selectedProblemId) {
        refs.problemStatsCard.innerHTML = renderEmptyState("Problem secildiginde community snapshot burada gorunecek.");
        return;
    }

    if (!stats) {
        refs.problemStatsCard.innerHTML = `<p class="workspace-card__lead">Bu problem icin community stats verisi yuklenemedi.</p>`;
        return;
    }

    const languageBreakdown = Object.entries(stats.languageBreakdown || {}).filter(([, count]) => count > 0);

    refs.problemStatsCard.innerHTML = `
        <div class="workspace-card__grid">
            <article class="workspace-card__stat">
                <span>Public submissions</span>
                <strong>${stats.totalSubmissions ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Accepted users</span>
                <strong>${stats.acceptedUsers ?? 0}</strong>
            </article>
            <article class="workspace-card__stat">
                <span>Acceptance rate</span>
                <strong>${stats.acceptanceRate ?? 0}%</strong>
            </article>
        </div>
        <p class="workspace-card__lead">
            ${stats.mostUsedLanguage ? `En aktif dil ${escapeHtml(stats.mostUsedLanguage)}.` : "Henuz public user submission'i yok."}
            ${stats.latestAcceptedAt ? ` Son accepted: ${formatDate(stats.latestAcceptedAt)}.` : ""}
        </p>
        <div class="workspace-card__breakdown">
            ${renderBadge(`Accepted runs: ${stats.acceptedSubmissions ?? 0}`)}
            ${renderBadge(`Fastest: ${stats.fastestExecutionTime ?? "-"}${stats.fastestExecutionTime != null ? " ms" : ""}`)}
            ${renderBadge(`Lowest memory: ${stats.lowestMemoryUsage ?? "-"}${stats.lowestMemoryUsage != null ? " MB" : ""}`)}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Language mix</p>
            ${languageBreakdown.length > 0
                ? `<div class="workspace-card__breakdown">${languageBreakdown.map(([language, count]) => renderBadge(`${language}: ${count}`)).join("")}</div>`
                : `<p class="workspace-card__meta">Bu problem icin public dil verisi henuz yok.</p>`}
        </div>
    `;
}

export function renderSamples(context) {
    const { state, refs, loadReplayFromCase } = context;
    if (state.visibleTestCases.length === 0) {
        refs.sampleList.innerHTML = renderEmptyState("Bu problem icin su anda public sample yok.");
        return;
    }

    refs.sampleList.innerHTML = state.visibleTestCases.map((testCase, index) => `
        <article class="sample-card">
            <div class="sample-card__header">
                <strong>Sample ${index + 1}</strong>
                ${state.currentUser ? `<div class="sample-card__actions">${renderGhostButton("Replay'e al", {
                    attributes: {
                        "data-load-sample-replay-index": index
                    }
                })}</div>` : ""}
            </div>
            <p><code>input: ${escapeHtml(testCase.input)}</code></p>
            <p><code>expected: ${escapeHtml(testCase.expectedOutput)}</code></p>
        </article>
    `).join("");

    refs.sampleList.querySelectorAll("[data-load-sample-replay-index]").forEach((button) => {
        button.addEventListener("click", () => {
            const sample = state.visibleTestCases[Number(button.dataset.loadSampleReplayIndex)];
            if (sample) {
                loadReplayFromCase(sample.input, sample.expectedOutput, "Sample case");
            }
        });
    });
}

export function renderProblemTags(context) {
    const { state, refs, setProblemTagFilter } = context;
    const tags = state.selectedProblem?.tags || [];
    if (tags.length === 0) {
        refs.problemTags.innerHTML = renderEmptyState("Tag belirtilmedi.");
        return;
    }

    refs.problemTags.innerHTML = tags
        .map((tag) => renderGhostButton(tag, {
            extraClassName: state.problemTagFilter === tag ? "button--soft" : "",
            attributes: {
                "data-problem-tag-shortcut": tag
            }
        }))
        .join("");

    refs.problemTags.querySelectorAll("[data-problem-tag-shortcut]").forEach((button) => {
        button.addEventListener("click", () => {
            setProblemTagFilter(button.dataset.problemTagShortcut);
            refs.problemFacetCard?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });
}

export function renderProblemExamples(context) {
    const { state, refs } = context;
    const examples = state.selectedProblem?.examples || [];
    if (examples.length === 0) {
        refs.problemExampleList.innerHTML = renderEmptyState("Bu problem icin statement ornegi yok.");
        return;
    }

    refs.problemExampleList.innerHTML = examples.map((example, index) => `
        <article class="sample-card">
            <strong>Example ${index + 1}</strong>
            <p><code>input: ${escapeHtml(example.input)}</code></p>
            <p><code>output: ${escapeHtml(example.output)}</code></p>
            ${example.explanation ? `<p>${escapeHtml(example.explanation)}</p>` : ""}
        </article>
    `).join("");
}

export function renderEditorial(context) {
    const { state, refs, isAdmin } = context;
    const problem = state.selectedProblem;

    if (!problem?.editorialAvailable) {
        refs.problemEditorialHeading.textContent = "Editorial";
        refs.problemEditorialState.textContent = "Bu problem icin cozum notu henuz eklenmedi.";
        refs.problemEditorial.innerHTML = renderEmptyState("Editorial eklenmedi.");
        return;
    }

    if (!problem.editorialUnlocked) {
        refs.problemEditorialHeading.textContent = "Editorial kilitli";
        refs.problemEditorialState.textContent = "Accepted gonderimden sonra acilir.";
        refs.problemEditorial.innerHTML = `
            <article class="editorial-card editorial-card--locked">
                <p>${escapeHtml(
                    state.currentUser
                        ? "Bu bolum accepted gonderimden sonra acilir."
                        : "Bu bolum giris yapip problemi accepted ettikten sonra acilir."
                )}</p>
            </article>
        `;
        return;
    }

    refs.problemEditorialHeading.textContent = problem.editorialTitle || "Editorial";
    refs.problemEditorialState.textContent = isAdmin()
        ? "Admin gorunumu."
        : "Accepted gonderim sayesinde acildi.";
    refs.problemEditorial.innerHTML = `
        <article class="editorial-card">
            <p>${escapeHtml(problem.editorialContent || "Editorial icerigi henuz doldurulmadi.")}</p>
        </article>
    `;
}

export function renderHint(context) {
    const { state, refs, isAdmin } = context;
    const problem = state.selectedProblem;

    if (!problem?.hintAvailable) {
        refs.problemHintHeading.textContent = "Hint";
        refs.problemHintState.textContent = "Bu problem icin ipucu eklenmedi.";
        refs.problemHint.innerHTML = renderEmptyState("Hint eklenmedi.");
        return;
    }

    if (!problem.hintUnlocked) {
        refs.problemHintHeading.textContent = "Hint kilitli";
        refs.problemHintState.textContent = "Ilk gonderimden sonra acilir.";
        refs.problemHint.innerHTML = `
            <article class="editorial-card editorial-card--locked">
                <p>${escapeHtml(
                    state.currentUser
                        ? "Ilk denemeni gonderdikten sonra bu ipucu acilir."
                        : "Giris yapip ilk denemeni gonderdikten sonra bu ipucu acilir."
                )}</p>
            </article>
        `;
        return;
    }

    refs.problemHintHeading.textContent = problem.hintTitle || "Hint";
    refs.problemHintState.textContent = isAdmin()
        ? "Admin gorunumu."
        : "Ilk gonderim sayesinde acildi.";
    refs.problemHint.innerHTML = `
        <article class="editorial-card">
            <p>${escapeHtml(problem.hintContent || "Hint icerigi henuz doldurulmadi.")}</p>
        </article>
    `;
}
