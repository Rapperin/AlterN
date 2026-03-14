import { fetchJson } from "../shared/api.js";
import { bindAuthControls, clearAuthPassword, readAuthCredentials } from "../shared/auth-form.js";
import { applyAuthFeedback, applyAuthPanelState } from "../shared/auth-ui.js";
import { buildArenaUrl } from "../shared/arena-links.js";
import { navigateToUrl } from "../shared/page-links.js";
import { getAuthToken, setAuthToken, clearAuthToken, authHeaders } from "../shared/session.js";
import { difficultyClass, escapeHtml, renderBadge, renderEmptyState, renderGhostLink, shorten } from "../shared/ui.js";

const refs = {
    authStatus: document.getElementById("authStatus"),
    authForm: document.getElementById("authForm"),
    authUsername: document.getElementById("authUsername"),
    authPassword: document.getElementById("authPassword"),
    registerButton: document.getElementById("registerButton"),
    logoutButton: document.getElementById("logoutButton"),
    authCurrent: document.getElementById("authCurrent"),
    authCurrentUsername: document.getElementById("authCurrentUsername"),
    authCurrentRole: document.getElementById("authCurrentRole"),
    authFeedback: document.getElementById("authFeedback"),
    preflightBanner: document.getElementById("preflightBanner"),
    landingProblemCount: document.getElementById("landingProblemCount"),
    landingFeaturedList: document.getElementById("landingFeaturedList"),
    landingRuntimeCard: document.getElementById("landingRuntimeCard"),
    landingEnterLink: document.getElementById("landingEnterLink"),
    landingMetricProblems: document.getElementById("landingMetricProblems"),
    landingMetricStatus: document.getElementById("landingMetricStatus"),
    landingMetricLanguages: document.getElementById("landingMetricLanguages"),
    landingMetricMode: document.getElementById("landingMetricMode")
};

const state = {
    authToken: getAuthToken(),
    currentUser: null,
    runnerHealth: null,
    featuredProblems: []
};

document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
});

async function bootstrap() {
    bindEvents();
    await hydrateAuth();
    await Promise.all([
        loadRunnerHealth(),
        loadFeaturedProblems()
    ]);
}

function bindEvents() {
    bindAuthControls(refs, {
        onLogin: login,
        onRegister: register,
        onLogout: logout
    });
}

async function hydrateAuth() {
    if (!state.authToken) {
        renderAuthState();
        return;
    }

    try {
        state.currentUser = await fetchJson("/api/auth/me", {
            headers: authHeaders(state.authToken)
        });
        showAuthFeedback(`${state.currentUser.username} oturumu hazir.`, "success");
    } catch (error) {
        state.authToken = null;
        state.currentUser = null;
        clearAuthToken();
        showAuthFeedback("Oturum gecersiz. Tekrar giris yap.", "error");
    }

    renderAuthState();
}

async function loadRunnerHealth() {
    try {
        state.runnerHealth = await fetchJson("/api/health", {
            headers: authHeaders(state.authToken)
        });
    } catch (error) {
        state.runnerHealth = null;
    }

    renderPreflightBanner();
    renderRuntimeCard();
}

async function loadFeaturedProblems() {
    try {
        state.featuredProblems = await fetchAllProblems();
        refs.landingProblemCount.textContent = `${state.featuredProblems.length} problem`;
        refs.landingMetricProblems.textContent = String(state.featuredProblems.length);
    } catch (error) {
        state.featuredProblems = [];
        refs.landingProblemCount.textContent = "0 problem";
        refs.landingMetricProblems.textContent = "0";
    }

    renderFeaturedProblems();
}

async function fetchAllProblems() {
    const pageSize = 12;
    let pageNumber = 0;
    let totalPages = 1;
    const problems = [];

    while (pageNumber < totalPages) {
        const page = await fetchJson(`/api/problems?page=${pageNumber}&size=${pageSize}`, {
            headers: authHeaders(state.authToken)
        });
        problems.push(...(page.content || []));
        totalPages = Math.max(page.totalPages || 1, 1);
        pageNumber += 1;
    }

    return problems;
}

function renderAuthState() {
    const authenticated = applyAuthPanelState({
        refs,
        authToken: state.authToken,
        currentUser: state.currentUser
    });

    refs.landingEnterLink.textContent = authenticated ? "Arena'ya don" : "Enter Arena";
}

function renderPreflightBanner() {
    const runner = state.runnerHealth?.runner;
    if (!runner) {
        refs.preflightBanner.hidden = true;
        return;
    }

    const readiness = runner.readiness || "READY";
    const available = runner.availableLanguageCount ?? 0;
    const supported = runner.supportedLanguageCount ?? 0;
    const headline = readiness === "READY"
        ? "Runtime ready"
        : readiness === "DEGRADED"
            ? "Runtime degraded"
            : "Runtime blocked";
    const summary = readiness === "READY"
        ? `Arena acik. ${available}/${supported} dil hazir.`
        : readiness === "DEGRADED"
            ? `Arena kismen hazir. ${available}/${supported} dil aktif.`
            : "Desteklenen diller icin calisabilir runtime bulunamadi.";

    refs.preflightBanner.hidden = false;
    refs.preflightBanner.className = `preflight-banner preflight-banner--${readiness.toLowerCase()}`;
    refs.preflightBanner.innerHTML = `
        <strong>${escapeHtml(headline)}</strong>
        <p>${escapeHtml(summary)}</p>
        <p>${escapeHtml(runner.message || "Runner durumu hazir.")}</p>
    `;
}

function renderRuntimeCard() {
    const runner = state.runnerHealth?.runner;
    if (!runner) {
        refs.landingMetricStatus.textContent = "Offline";
        refs.landingMetricLanguages.textContent = "0/0";
        refs.landingMetricMode.textContent = "Unknown";
        refs.landingRuntimeCard.innerHTML = `<p class="workspace-card__lead">Runtime bilgisi alinmadi. Arena yine acilabilir.</p>`;
        return;
    }

    const requestedMode = runner.requestedMode || "LOCAL";
    const effectiveMode = runner.mode || "LOCAL";
    const readiness = runner.readiness || "READY";
    const dockerState = runner.dockerEnabled
        ? (runner.dockerAvailable ? "Docker ready" : "Docker unavailable")
        : "Docker off";

    refs.landingMetricStatus.textContent = readiness;
    refs.landingMetricLanguages.textContent = `${runner.availableLanguageCount ?? 0}/${runner.supportedLanguageCount ?? 0}`;
    refs.landingMetricMode.textContent = effectiveMode;

    refs.landingRuntimeCard.innerHTML = `
        <p class="workspace-debug__eyebrow">Runtime</p>
        <div class="workspace-card__breakdown">
            ${renderBadge(state.runnerHealth?.judgeMode || "SYNC")}
            ${renderBadge(`Requested ${requestedMode}`)}
            ${renderBadge(effectiveMode)}
            ${renderBadge(dockerState)}
            ${renderBadge(`${runner.availableLanguageCount ?? 0}/${runner.supportedLanguageCount ?? 0} languages`)}
        </div>
        <p class="workspace-card__lead">${escapeHtml(runner.actionMessage || runner.message || "Execution environment hazir.")}</p>
    `;
}

function renderFeaturedProblems() {
    if (!state.featuredProblems.length) {
        refs.landingFeaturedList.innerHTML = renderEmptyState("Featured archive henuz acilmadi.");
        return;
    }

    const featured = [...state.featuredProblems]
        .sort((left, right) => {
            const leftScore = (left.submissionCount || 0) + (left.testCaseCount || 0);
            const rightScore = (right.submissionCount || 0) + (right.testCaseCount || 0);
            return rightScore - leftScore;
        })
        .slice(0, 4);

    refs.landingFeaturedList.innerHTML = featured.map((problem) => `
        <article class="problem-card ${difficultyClass(problem.difficulty)}">
            <h3>${escapeHtml(problem.title || "Problem")}</h3>
            <p>${escapeHtml(shorten(problem.description || "", 132))}</p>
            <div class="problem-card__meta">
                ${renderBadge(problem.difficulty || "-", difficultyClass(problem.difficulty))}
                ${renderBadge(`${problem.testCaseCount ?? 0} sample`)}
                ${renderBadge(`${problem.timeLimitMs ?? 5000} ms`)}
            </div>
            <div class="workspace-card__actions">
                ${renderGhostLink("Solve in arena", buildArenaUrl({ problemId: problem.id }))}
            </div>
        </article>
    `).join("");
}

async function login(event) {
    event.preventDefault();
    const credentials = readAuthCredentials();
    if (!credentials) {
        showAuthFeedback("Username ve password gerekli.", "error");
        return;
    }

    try {
        const response = await fetchJson("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
        });

        applyAuthResponse(response, "Giris basarili. Arena aciliyor.");
        navigateToUrl(buildArenaUrl());
    } catch (error) {
        showAuthFeedback(error.message, "error");
    }
}

async function register() {
    const credentials = readAuthCredentials();
    if (!credentials) {
        showAuthFeedback("Register icin username ve password gerekli.", "error");
        return;
    }

    try {
        const response = await fetchJson("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
        });

        applyAuthResponse(response, "Kayit tamamlandi. Arena aciliyor.");
        navigateToUrl(buildArenaUrl());
    } catch (error) {
        showAuthFeedback(error.message, "error");
    }
}

async function logout() {
    state.authToken = null;
    state.currentUser = null;
    clearAuthToken();
    clearAuthPassword(refs);
    renderAuthState();
    showAuthFeedback("Oturum kapatildi.", "idle");
}

function applyAuthResponse(response, message) {
    state.authToken = response.token;
    state.currentUser = {
        userId: response.userId,
        username: response.username,
        role: response.role
    };
    setAuthToken(state.authToken);
    clearAuthPassword(refs);
    renderAuthState();
    showAuthFeedback(message, "success");
}

function showAuthFeedback(message, type = "idle") {
    applyAuthFeedback(refs, message, type);
}
