import { fetchJson } from "../shared/api.js";
import { bindAuthControls, clearAuthPassword, readAuthCredentials } from "../shared/auth-form.js";
import { authHeaders as buildAuthHeaders, clearAuthToken, setAuthToken } from "../shared/session.js";

export async function bootstrap(context) {
    bindEvents(context);
    await hydrateAuth(context);

    const initialUsername = context.readInitialUsername();

    await Promise.all([
        loadUserDashboard(context),
        loadGlobalLeaderboard(context)
    ]);

    if (initialUsername) {
        await openUserProfile(context, initialUsername, { scrollIntoView: false, silent: true });
    } else if (context.state.currentUser?.username) {
        await openUserProfile(context, context.state.currentUser.username, { scrollIntoView: false, silent: true });
    } else {
        context.renderUserProfile();
    }
}

export async function loadUserDashboard(context) {
    const { state } = context;
    if (!state.currentUser || !state.authToken) {
        state.userDashboard = null;
        context.renderProgressSummary();
        context.renderUserDashboard();
        return;
    }

    try {
        state.userDashboard = await fetchJson("/api/dashboard", {
            headers: authHeaders(context)
        });
    } catch (error) {
        state.userDashboard = null;
    }

    context.renderProgressSummary();
    context.renderUserDashboard();
}

export async function loadGlobalLeaderboard(context) {
    const { state } = context;
    try {
        state.globalLeaderboard = await fetchJson("/api/leaderboard", {
            headers: authHeaders(context)
        });
    } catch (error) {
        state.globalLeaderboard = null;
    }

    context.renderGlobalLeaderboard();
    if (!state.selectedUserProfile) {
        context.renderUserProfile();
    }
}

export async function openUserProfile(context, username, options = {}) {
    if (!username) {
        return;
    }

    try {
        context.state.selectedUserProfile = await fetchJson(`/api/users/${encodeURIComponent(username)}/profile`, {
            headers: authHeaders(context)
        });
        context.syncContinuumUrl(username);
        context.renderUserProfile();
        if (options.scrollIntoView !== false) {
            context.refs.userProfileCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    } catch (error) {
        if (!options.silent) {
            context.showAuthFeedback(error.message, "error");
        }
    }
}

export async function login(context, event) {
    event.preventDefault();
    const credentials = readAuthCredentials(context.refs);
    if (!credentials) {
        context.showAuthFeedback("Username ve password gerekli.", "error");
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

        applyAuthResponse(context, response, `${response.username} olarak giris yapildi.`);
        await Promise.all([
            loadUserDashboard(context),
            loadGlobalLeaderboard(context)
        ]);
        await openUserProfile(context, response.username, { scrollIntoView: false, silent: true });
    } catch (error) {
        context.showAuthFeedback(error.message, "error");
    }
}

export async function register(context) {
    const credentials = readAuthCredentials(context.refs);
    if (!credentials) {
        context.showAuthFeedback("Register icin username ve password gerekli.", "error");
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

        applyAuthResponse(context, response, `${response.username} hesabi olusturuldu.`);
        await Promise.all([
            loadUserDashboard(context),
            loadGlobalLeaderboard(context)
        ]);
        await openUserProfile(context, response.username, { scrollIntoView: false, silent: true });
    } catch (error) {
        context.showAuthFeedback(error.message, "error");
    }
}

export async function logout(context) {
    clearAuthState(context, true);
    await Promise.all([
        loadUserDashboard(context),
        loadGlobalLeaderboard(context)
    ]);
}

function bindEvents(context) {
    bindAuthControls(context.refs, {
        onLogin: (event) => {
            void login(context, event);
        },
        onRegister: () => {
            void register(context);
        },
        onLogout: () => {
            void logout(context);
        }
    });
}

async function hydrateAuth(context) {
    const { state } = context;
    if (!state.authToken) {
        context.renderAuthState();
        return;
    }

    try {
        state.currentUser = await fetchJson("/api/auth/me", {
            headers: authHeaders(context)
        });
        context.showAuthFeedback(`${state.currentUser.username} oturumu hazir.`, "success");
    } catch (error) {
        clearAuthState(context, false);
        context.showAuthFeedback("Oturum gecersiz. Tekrar giris yap.", "error");
    }

    context.renderAuthState();
}

function applyAuthResponse(context, response, message) {
    const { state, refs } = context;
    state.authToken = response.token;
    state.currentUser = {
        userId: response.userId,
        username: response.username,
        role: response.role
    };

    setAuthToken(state.authToken);
    clearAuthPassword(refs);
    context.renderAuthState();
    context.showAuthFeedback(message, "success");
}

function clearAuthState(context, showMessage) {
    const { state } = context;
    state.authToken = null;
    state.currentUser = null;
    state.userDashboard = null;
    state.selectedUserProfile = null;
    clearAuthToken();
    context.renderAuthState();
    context.renderProgressSummary();
    context.renderUserDashboard();
    context.renderUserProfile();

    if (showMessage) {
        context.showAuthFeedback("Oturum kapatildi.", "idle");
    }
}

function authHeaders(context, extraHeaders = {}) {
    return buildAuthHeaders(context.state.authToken, extraHeaders);
}
