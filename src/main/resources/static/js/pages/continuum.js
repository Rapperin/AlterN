import { getAuthToken } from "../shared/session.js";
import { applyAuthFeedback } from "../shared/auth-ui.js";
import { buildArenaUrl } from "../shared/arena-links.js";
import { navigateToUrl, replaceCurrentUrl, setUrlSearchParam } from "../shared/page-links.js";
import {
    renderAuthState as renderAuthStateView,
    renderGlobalLeaderboard as renderGlobalLeaderboardView,
    renderProgressSummary as renderProgressSummaryView,
    renderUserDashboard as renderUserDashboardView,
    renderUserProfile as renderUserProfileView
} from "./continuum-render.js";
import {
    bootstrap as bootstrapView,
    loadGlobalLeaderboard as loadGlobalLeaderboardView,
    loadUserDashboard as loadUserDashboardView,
    login as loginView,
    logout as logoutView,
    openUserProfile as openUserProfileView,
    register as registerView
} from "./continuum-shell.js";

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
    progressSummary: document.getElementById("progressSummary"),
    userDashboardCard: document.getElementById("userDashboardCard"),
    communityLeaderboardCard: document.getElementById("communityLeaderboardCard"),
    userProfileCard: document.getElementById("userProfileCard")
};

const state = {
    authToken: getAuthToken(),
    currentUser: null,
    userDashboard: null,
    globalLeaderboard: null,
    selectedUserProfile: null
};

document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
});

function buildContinuumContext() {
    return {
        state,
        refs,
        renderAuthState,
        renderProgressSummary,
        renderUserDashboard,
        renderGlobalLeaderboard,
        renderUserProfile,
        navigateToArena,
        openUserProfile,
        clearUserProfile,
        syncContinuumUrl,
        showAuthFeedback,
        readInitialUsername,
        buildArenaHref: (options = {}) => buildArenaUrl(options)
    };
}

function bootstrap() {
    return bootstrapView(buildContinuumContext());
}

function readInitialUsername() {
    const value = new URLSearchParams(window.location.search).get("username");
    return value ? value.trim() : "";
}

function loadUserDashboard() {
    return loadUserDashboardView(buildContinuumContext());
}

function loadGlobalLeaderboard() {
    return loadGlobalLeaderboardView(buildContinuumContext());
}

function renderAuthState() {
    return renderAuthStateView(buildContinuumContext());
}

function renderProgressSummary() {
    return renderProgressSummaryView(buildContinuumContext());
}

function renderUserDashboard() {
    return renderUserDashboardView(buildContinuumContext());
}

function renderGlobalLeaderboard() {
    return renderGlobalLeaderboardView(buildContinuumContext());
}

function renderUserProfile() {
    return renderUserProfileView(buildContinuumContext());
}

async function openUserProfile(username, options = {}) {
    return openUserProfileView(buildContinuumContext(), username, options);
}

function clearUserProfile() {
    state.selectedUserProfile = null;
    syncContinuumUrl("");
    renderUserProfile();
}

function syncContinuumUrl(username) {
    replaceCurrentUrl((url) => {
        setUrlSearchParam(url, "username", username || null);
    });
}

function navigateToArena(options = {}) {
    navigateToUrl(buildArenaUrl({
        ...options,
        source: "continuum"
    }));
}

async function login(event) {
    return loginView(buildContinuumContext(), event);
}

async function register() {
    return registerView(buildContinuumContext());
}

async function logout() {
    return logoutView(buildContinuumContext());
}

function showAuthFeedback(message, type = "idle") {
    applyAuthFeedback(refs, message, type);
}
