import {
    activityCellClass,
    difficultyClass,
    escapeHtml,
    formatDate,
    formatShortDate,
    formatViewerStatus,
    renderBadge,
    renderEmptyState,
    renderGhostButton,
    renderGhostLink,
    renderJourneySection
} from "../shared/ui.js";
import { applyAuthPanelState } from "../shared/auth-ui.js";

export function renderAuthState(context) {
    applyAuthPanelState({
        refs: context.refs,
        authToken: context.state.authToken,
        currentUser: context.state.currentUser
    });
}

export function renderProgressSummary(context) {
    const { state, refs } = context;
    if (!state.currentUser) {
        const leaderboard = state.globalLeaderboard;
        refs.progressSummary.innerHTML = `
            <div class="progress-summary__grid">
                <article class="progress-summary__card">
                    <span>Ranked</span>
                    <strong>${leaderboard?.totalRankedUsers ?? leaderboard?.entries?.length ?? 0}</strong>
                </article>
                <article class="progress-summary__card">
                    <span>Accepted</span>
                    <strong>${leaderboard?.totalAcceptedSubmissions ?? 0}</strong>
                </article>
                <article class="progress-summary__card">
                    <span>Surfaces</span>
                    <strong>3</strong>
                </article>
            </div>
            <p class="progress-summary__lead">
                Giris yaptiginda solved, attempted, saved ve kalan rota burada kendi hesabin icin acilir.
            </p>
            <div class="workspace-card__actions">
                ${renderGhostLink("Arena'ya git", "/arena.html")}
                ${renderGhostLink("Hall of Fame", "/continuum.html")}
            </div>
        `;
        return;
    }

    const dashboard = state.userDashboard;
    if (!dashboard) {
        refs.progressSummary.innerHTML = renderEmptyState("Progress snapshot yuklenemedi.");
        return;
    }

    refs.progressSummary.innerHTML = `
        <div class="progress-summary__grid">
            <article class="progress-summary__card">
                <span>Solved</span>
                <strong>${dashboard.solvedProblems ?? 0}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Attempted</span>
                <strong>${dashboard.attemptedProblems ?? 0}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Remaining</span>
                <strong>${dashboard.remainingProblems ?? 0}</strong>
            </article>
            <article class="progress-summary__card">
                <span>Saved</span>
                <strong>${dashboard.bookmarkedProblems ?? 0}</strong>
            </article>
        </div>
        <div class="filter-group">
            ${renderScopeLink(context, "ALL", "Tum")}
            ${renderScopeLink(context, "REMAINING", "Remaining")}
            ${renderScopeLink(context, "ATTEMPTED", "Attempted")}
            ${renderScopeLink(context, "SOLVED", "Solved")}
            ${renderScopeLink(context, "BOOKMARKED", "Saved")}
        </div>
        ${dashboard.continueAttempt ? `
            <article class="workspace-card">
                <p class="workspace-debug__eyebrow">Continue</p>
                <h3>${escapeHtml(dashboard.continueAttempt.problemTitle || "Problem")}</h3>
                <p class="workspace-card__lead">
                    ${escapeHtml(formatViewerStatus(dashboard.continueAttempt.status))} | ${escapeHtml(dashboard.continueAttempt.language || "-")} | ${formatDate(dashboard.continueAttempt.lastActivityAt)}
                </p>
                <div class="workspace-card__actions">
                    ${renderGhostButton("Arena'da devam et", {
                        attributes: {
                            "data-progress-problem-id": dashboard.continueAttempt.problemId,
                            "data-progress-submission-id": dashboard.continueAttempt.submissionId || ""
                        }
                    })}
                </div>
            </article>
        ` : ""}
    `;

    refs.progressSummary.querySelectorAll("[data-progress-problem-id]").forEach((button) => {
        button.addEventListener("click", () => {
            context.navigateToArena({
                problemId: Number(button.dataset.progressProblemId),
                submissionId: button.dataset.progressSubmissionId ? Number(button.dataset.progressSubmissionId) : null
            });
        });
    });
}

export function renderUserDashboard(context) {
    const { state, refs } = context;
    if (!state.currentUser) {
        const leaderboard = state.globalLeaderboard;
        refs.userDashboardCard.innerHTML = `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Personal layer</p>
                    <h3>Your Continuum unlocks after sign-in</h3>
                </div>
                ${renderBadge(`${leaderboard?.totalRankedUsers ?? leaderboard?.entries?.length ?? 0} ranked`)}
            </div>
            <div class="dashboard-card__grid">
                <article class="dashboard-card__stat">
                    <span>Journey</span>
                    <strong>Route</strong>
                </article>
                <article class="dashboard-card__stat">
                    <span>Saved</span>
                    <strong>Queue</strong>
                </article>
                <article class="dashboard-card__stat">
                    <span>Momentum</span>
                    <strong>Streak</strong>
                </article>
                <article class="dashboard-card__stat">
                    <span>Identity</span>
                    <strong>Profile</strong>
                </article>
            </div>
            <div class="dashboard-card__section">
                <p class="dashboard-card__label">What opens here</p>
                <p class="workspace-card__lead">
                    Son denemelerin, saved queue, journey hedeflerin ve public solver card tek dashboard
                    yuzeyinde toplanir.
                </p>
                <div class="workspace-card__actions">
                    ${renderGhostLink("Arena'da solve et", "/arena.html")}
                </div>
            </div>
        `;
        return;
    }

    const dashboard = state.userDashboard;
    if (!dashboard) {
        refs.userDashboardCard.innerHTML = renderEmptyState("Dashboard yuklenemedi.");
        return;
    }

    const solvedByDifficulty = Object.entries(dashboard.solvedByDifficulty || {});
    const languageBreakdown = Object.entries(dashboard.languageBreakdown || {}).filter(([, count]) => count > 0);
    const continueAttempt = dashboard.continueAttempt;
    const suggestedProblem = dashboard.suggestedProblem;
    const recentAttempted = dashboard.recentAttempted || [];
    const recentPending = dashboard.recentPending || [];
    const recentBookmarked = dashboard.recentBookmarked || [];
    const recentAccepted = dashboard.recentAccepted || [];
    const recentActivity = dashboard.recentActivity || [];
    const achievements = dashboard.achievements || [];
    const journey = dashboard.journey;
    const journeyFocus = dashboard.journeyFocus;

    refs.userDashboardCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Your Dashboard</p>
                <h3>${escapeHtml(dashboard.username || "User")}</h3>
            </div>
            <div class="workspace-card__actions">
                ${renderBadge(`${dashboard.acceptanceRate ?? 0}% accepted`)}
                ${renderGhostButton("Public profile", {
                    attributes: {
                        "data-dashboard-profile-username": dashboard.username || ""
                    }
                })}
            </div>
        </div>
        <div class="dashboard-card__grid">
            <article class="dashboard-card__stat">
                <span>Solved</span>
                <strong>${dashboard.solvedProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Attempts</span>
                <strong>${dashboard.totalSubmissions ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Pending</span>
                <strong>${dashboard.pendingSubmissions ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Remaining</span>
                <strong>${dashboard.remainingProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Saved</span>
                <strong>${dashboard.bookmarkedProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Main lang</span>
                <strong>${escapeHtml(dashboard.mostUsedLanguage || "-")}</strong>
            </article>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Momentum</p>
            <p class="workspace-card__lead">
                ${dashboard.activeDays ?? 0} active day | current streak ${dashboard.currentAcceptedStreakDays ?? 0} | best ${dashboard.longestAcceptedStreakDays ?? 0}
            </p>
            ${recentActivity.length > 0 ? `
                <div class="activity-strip">
                    ${recentActivity.map((entry) => `
                        <article class="activity-cell ${activityCellClass(entry)}">
                            <span>${escapeHtml(formatShortDate(entry.date))}</span>
                            <strong>${entry.submissions ?? 0}</strong>
                            <small>${entry.accepted ?? 0} acc</small>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Aktivite akisi henuz olusmadi.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Pending queue</p>
            ${recentPending.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentPending.map((entry) => `
                        <article
                            class="dashboard-card__item dashboard-card__item--interactive"
                            data-dashboard-problem-id="${entry.problemId}"
                            data-dashboard-submission-id="${entry.submissionId}"
                            data-dashboard-label="Pending queue">
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.language || "-")} | ${escapeHtml(formatViewerStatus(entry.status))} | ${formatDate(entry.lastActivityAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Bekleyen submission yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Journey</p>
            ${renderJourneySection(journey, "dashboard")}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Journey Focus</p>
            ${journeyFocus ? `
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-dashboard-problem-id="${journeyFocus.problemId}"
                    data-dashboard-language="${escapeHtml(journeyFocus.suggestedLanguage || "")}"
                    data-dashboard-prime-sample="true"
                    data-dashboard-label="Journey focus">
                    <strong>${escapeHtml(journeyFocus.problemTitle || "Problem")}</strong>
                    <p>${escapeHtml(journeyFocus.goalTitle || "Journey goal")} | ${escapeHtml(journeyFocus.difficulty || "-")} | ${escapeHtml(formatViewerStatus(journeyFocus.status))}</p>
                    <span>${escapeHtml(journeyFocus.reason || "")}</span>
                    ${journeyFocus.suggestedLanguage ? renderBadge(`Try ${journeyFocus.suggestedLanguage}`, "badge--accent-soft") : ""}
                </article>
            ` : `<p class="workspace-card__lead">Journey hedefine gore ozel bir focus onerisi henuz yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Achievements</p>
            ${achievements.length > 0 ? `
                <div class="workspace-card__breakdown">
                    ${achievements.map((achievement) => renderBadge(achievement.title || "Badge", {
                        className: "badge--accent-soft",
                        attributes: {
                            title: achievement.description || ""
                        }
                    })).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Ilk accepted ile ilk rozetini acacaksin.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Continue where you left off</p>
            ${continueAttempt ? `
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-dashboard-problem-id="${continueAttempt.problemId}"
                    data-dashboard-submission-id="${continueAttempt.submissionId}"
                    data-dashboard-label="Continue attempt">
                    <strong>${escapeHtml(continueAttempt.problemTitle || "Problem")}</strong>
                    <p>${escapeHtml(continueAttempt.difficulty || "-")} | ${escapeHtml(formatViewerStatus(continueAttempt.status))} | ${escapeHtml(continueAttempt.language || "-")}</p>
                    <span>${formatDate(continueAttempt.lastActivityAt)}</span>
                </article>
            ` : `<p class="workspace-card__lead">Acik bir deneme akisi yok. Solved olmayan ilk problem siradaki aday olacak.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Suggested next</p>
            ${suggestedProblem ? `
                <article
                    class="dashboard-card__spotlight dashboard-card__spotlight--interactive"
                    data-dashboard-problem-id="${suggestedProblem.problemId}"
                    data-dashboard-label="Suggested problem">
                    <strong>${escapeHtml(suggestedProblem.problemTitle || "Problem")}</strong>
                    <p>${escapeHtml(suggestedProblem.difficulty || "-")} | ${escapeHtml(formatViewerStatus(suggestedProblem.status))}</p>
                </article>
            ` : `<p class="workspace-card__lead">Tum problemler solved gorunuyor.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Solved by difficulty</p>
            <div class="workspace-card__breakdown">
                ${solvedByDifficulty.map(([difficulty, count]) => renderBadge(`${difficulty}: ${count}`, difficultyClass(difficulty))).join("")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Recent attempted</p>
            ${recentAttempted.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentAttempted.map((entry) => `
                        <article
                            class="dashboard-card__item dashboard-card__item--interactive"
                            data-dashboard-problem-id="${entry.problemId}"
                            data-dashboard-submission-id="${entry.submissionId}"
                            data-dashboard-label="Recent attempt">
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(formatViewerStatus(entry.status))} | ${escapeHtml(entry.language || "-")} | ${formatDate(entry.lastActivityAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz solved olmayan deneme yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Saved queue</p>
            ${recentBookmarked.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentBookmarked.map((entry) => `
                        <article
                            class="dashboard-card__item dashboard-card__item--interactive"
                            data-dashboard-problem-id="${entry.problemId}"
                            data-dashboard-label="Saved queue">
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.difficulty || "-")} | ${escapeHtml(formatViewerStatus(entry.status))} | Saved ${formatDate(entry.bookmarkedAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Kaydedilen problem yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Language mix</p>
            ${languageBreakdown.length > 0
                ? `<div class="workspace-card__breakdown">${languageBreakdown.map(([language, count]) => renderBadge(`${language}: ${count}`)).join("")}</div>`
                : `<p class="workspace-card__lead">Henuz submission yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Recent solved</p>
            ${recentAccepted.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentAccepted.map((entry) => `
                        <article class="dashboard-card__item ${entry.problemId ? "dashboard-card__item--interactive" : ""}" ${entry.problemId ? `data-dashboard-problem-id="${entry.problemId}"` : ""}>
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${formatDate(entry.acceptedAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz solved problem yok.</p>`}
        </div>
    `;

    refs.userDashboardCard.querySelectorAll("[data-dashboard-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            context.navigateToArena({
                problemId: Number(entry.dataset.dashboardProblemId),
                submissionId: entry.dataset.dashboardSubmissionId ? Number(entry.dataset.dashboardSubmissionId) : null,
                suggestedLanguage: entry.dataset.dashboardLanguage || null,
                primeSample: entry.dataset.dashboardPrimeSample === "true"
            });
        });
    });

    refs.userDashboardCard.querySelector("[data-dashboard-profile-username]")?.addEventListener("click", () => {
        void context.openUserProfile(dashboard.username, { scrollIntoView: true, silent: true });
    });
}

export function renderGlobalLeaderboard(context) {
    const { state, refs } = context;
    const leaderboard = state.globalLeaderboard;
    if (!leaderboard || !Array.isArray(leaderboard.entries) || leaderboard.entries.length === 0) {
        refs.communityLeaderboardCard.innerHTML = renderEmptyState("Henuz public leaderboard verisi yok.");
        return;
    }

    refs.communityLeaderboardCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Community</p>
                <h3>Hall of Fame</h3>
            </div>
            ${renderBadge(`${leaderboard.totalRankedUsers ?? leaderboard.entries.length} aktif user`)}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Accepted volume</p>
            <div class="workspace-card__breakdown">
                ${renderBadge(`${leaderboard.totalAcceptedSubmissions ?? 0} accepted`)}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Top solvers</p>
            <div class="dashboard-card__list">
                ${leaderboard.entries.map((entry) => `
                    <article
                        class="dashboard-card__item leaderboard-item dashboard-card__item--interactive ${entry.viewer ? "leaderboard-item--viewer" : ""}"
                        data-profile-username="${escapeHtml(entry.username || "")}">
                        <strong>#${entry.rank} ${escapeHtml(entry.username || "User")}</strong>
                        <p>${entry.solvedProblems ?? 0} solved | ${entry.acceptanceRate ?? 0}% accepted | ${escapeHtml(entry.mostUsedLanguage || "-")}</p>
                        <p>${entry.recentAcceptedProblemTitle ? `Son solved: ${escapeHtml(entry.recentAcceptedProblemTitle)} | ${formatDate(entry.recentAcceptedAt)}` : "Henuz accepted problemi yok."}</p>
                        <span class="dashboard-card__hint">Public profile ac</span>
                    </article>
                `).join("")}
            </div>
        </div>
    `;

    refs.communityLeaderboardCard.querySelectorAll("[data-profile-username]").forEach((entry) => {
        entry.addEventListener("click", () => {
            void context.openUserProfile(entry.dataset.profileUsername, { scrollIntoView: true, silent: true });
        });
    });
}

export function renderUserProfile(context) {
    const { state, refs } = context;
    const profile = state.selectedUserProfile;
    if (!profile) {
        const featuredSolver = state.globalLeaderboard?.entries?.[0];
        refs.userProfileCard.innerHTML = featuredSolver ? `
            <div class="dashboard-card__header">
                <div>
                    <p class="panel__eyebrow panel__eyebrow--muted">Profile preview</p>
                    <h3>Public Solver Card</h3>
                </div>
                ${renderBadge("Hall of Fame")}
            </div>
            <article class="dashboard-card__spotlight">
                <strong>#${featuredSolver.rank} ${escapeHtml(featuredSolver.username || "User")}</strong>
                <p>${featuredSolver.solvedProblems ?? 0} solved | ${featuredSolver.acceptanceRate ?? 0}% accepted | ${escapeHtml(featuredSolver.mostUsedLanguage || "-")}</p>
                <span>Bir solver sectiginde tam public kart burada acilir.</span>
            </article>
            <div class="workspace-card__actions">
                ${renderGhostButton("Top solver'i ac", {
                    attributes: {
                        "data-preview-profile-username": featuredSolver.username || ""
                    }
                })}
            </div>
        ` : renderEmptyState("Hall of Fame'den veya kendi dashboard'undan bir solver sec.");

        refs.userProfileCard.querySelector("[data-preview-profile-username]")?.addEventListener("click", () => {
            void context.openUserProfile(featuredSolver?.username, { scrollIntoView: true, silent: true });
        });
        return;
    }

    const solvedByDifficulty = Object.entries(profile.solvedByDifficulty || {});
    const recentAccepted = profile.recentAccepted || [];
    const achievements = profile.achievements || [];
    const journey = profile.journey;
    const rankCopy = profile.globalRank
        ? `#${profile.globalRank} / ${profile.totalRankedUsers ?? profile.globalRank}`
        : "Henuz rank almadi";

    refs.userProfileCard.innerHTML = `
        <div class="dashboard-card__header">
            <div>
                <p class="panel__eyebrow panel__eyebrow--muted">Community</p>
                <h3>Public Profile</h3>
            </div>
            <div class="workspace-card__actions">
                ${profile.viewer ? renderBadge("You", "badge--accent-soft") : ""}
                ${renderGhostButton("Kapat", {
                    attributes: {
                        "data-clear-user-profile": true
                    }
                })}
            </div>
        </div>
        <article class="dashboard-card__spotlight">
            <strong>${escapeHtml(profile.username || "User")}</strong>
            <p>${escapeHtml(rankCopy)} | ${escapeHtml(profile.mostUsedLanguage || "-")} | Joined ${formatDate(profile.joinedAt)}</p>
            <span>${profile.lastSubmissionAt ? `Last active ${formatDate(profile.lastSubmissionAt)}` : "Henuz public aktivite yok."}</span>
        </article>
        <div class="dashboard-card__grid">
            <article class="dashboard-card__stat">
                <span>Solved</span>
                <strong>${profile.solvedProblems ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Attempts</span>
                <strong>${profile.totalSubmissions ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Accepted rate</span>
                <strong>${profile.acceptanceRate ?? 0}%</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Active days</span>
                <strong>${profile.activeDays ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Current streak</span>
                <strong>${profile.currentAcceptedStreakDays ?? 0}</strong>
            </article>
            <article class="dashboard-card__stat">
                <span>Best streak</span>
                <strong>${profile.longestAcceptedStreakDays ?? 0}</strong>
            </article>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Solved by difficulty</p>
            <div class="workspace-card__breakdown">
                ${solvedByDifficulty.map(([difficulty, count]) => renderBadge(`${difficulty}: ${count}`, difficultyClass(difficulty))).join("")}
            </div>
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Journey</p>
            ${renderJourneySection(journey, "profile")}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Achievements</p>
            ${achievements.length > 0 ? `
                <div class="dashboard-card__list">
                    ${achievements.map((achievement) => `
                        <article class="dashboard-card__item">
                            <strong>${escapeHtml(achievement.title || "Badge")}</strong>
                            <p>${escapeHtml(achievement.description || "")}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz rozet yok.</p>`}
        </div>
        <div class="dashboard-card__section">
            <p class="dashboard-card__label">Recent solved</p>
            ${recentAccepted.length > 0 ? `
                <div class="dashboard-card__list">
                    ${recentAccepted.map((entry) => `
                        <article class="dashboard-card__item ${entry.problemId ? "dashboard-card__item--interactive" : ""}" ${entry.problemId ? `data-profile-problem-id="${entry.problemId}"` : ""}>
                            <strong>${escapeHtml(entry.problemTitle || "Problem")}</strong>
                            <p>${escapeHtml(entry.language || "-")} | ${entry.executionTime ?? 0} ms | ${formatDate(entry.acceptedAt)}</p>
                        </article>
                    `).join("")}
                </div>
            ` : `<p class="workspace-card__lead">Henuz accepted problem yok.</p>`}
        </div>
    `;

    refs.userProfileCard.querySelector("[data-clear-user-profile]")?.addEventListener("click", () => {
        context.clearUserProfile();
    });

    refs.userProfileCard.querySelectorAll("[data-profile-problem-id]").forEach((entry) => {
        entry.addEventListener("click", () => {
            context.navigateToArena({ problemId: Number(entry.dataset.profileProblemId) });
        });
    });
}

function renderScopeLink(context, scope, label) {
    return renderGhostLink(label, context.buildArenaHref({ scope }));
}
