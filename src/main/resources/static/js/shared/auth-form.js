export function bindAuthControls(refs, handlers = {}) {
    refs.authForm?.addEventListener("submit", (event) => {
        handlers.onLogin?.(event);
    });

    refs.registerButton?.addEventListener("click", () => {
        handlers.onRegister?.();
    });

    refs.logoutButton?.addEventListener("click", () => {
        handlers.onLogout?.();
    });
}

export function readAuthCredentials(refs, options = {}) {
    const username = refs.authUsername?.value.trim() || "";
    const passwordSource = refs.authPassword?.value || "";
    const password = options.trimPassword ? passwordSource.trim() : passwordSource;

    if (!username || !password) {
        return null;
    }

    return { username, password };
}

export function clearAuthPassword(refs) {
    if (refs.authPassword) {
        refs.authPassword.value = "";
    }
}
