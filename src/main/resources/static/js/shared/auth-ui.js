export function applyAuthPanelState({
    refs,
    authToken,
    currentUser,
    authenticatedStatusText = ({ currentUser: user }) => `${user?.username || "Oturum"} hazir`,
    unauthenticatedStatusText = "Giris yap",
    onAuthenticated = null,
    onUnauthenticated = null
}) {
    const authenticated = Boolean(currentUser && authToken);

    if (refs.authStatus) {
        refs.authStatus.textContent = resolveAuthLabel(
            authenticated ? authenticatedStatusText : unauthenticatedStatusText,
            currentUser,
            authToken,
            authenticated
        );
    }

    if (refs.authForm) {
        refs.authForm.hidden = authenticated;
    }

    if (refs.authCurrent) {
        refs.authCurrent.hidden = !authenticated;
    }

    if (refs.authCurrentUsername) {
        refs.authCurrentUsername.textContent = authenticated
            ? (currentUser?.username || "-")
            : "-";
    }

    if (refs.authCurrentRole) {
        refs.authCurrentRole.textContent = authenticated
            ? (currentUser?.role || "-")
            : "-";
    }

    if (authenticated) {
        onAuthenticated?.(currentUser);
    } else {
        onUnauthenticated?.();
    }

    return authenticated;
}

export function applyAuthFeedback(refsOrElement, message, type = "idle", options = {}) {
    const element = refsOrElement?.authFeedback ?? refsOrElement;
    if (!element) {
        return;
    }

    const baseClassName = options.baseClassName || "auth-feedback";
    const classNameBuilder = options.classNameBuilder
        || ((nextType) => buildAuthFeedbackClassName(nextType, baseClassName));

    element.textContent = message;
    element.className = classNameBuilder(type);
}

export function buildAuthFeedbackClassName(type = "idle", baseClassName = "auth-feedback") {
    if (!type) {
        return baseClassName;
    }

    return `${baseClassName} ${baseClassName}--${type}`;
}

function resolveAuthLabel(label, currentUser, authToken, authenticated) {
    if (typeof label === "function") {
        return label({ currentUser, authToken, authenticated });
    }

    return label || "";
}
