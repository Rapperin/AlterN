export function setUrlSearchParam(url, key, value) {
    if (value === null || value === undefined || value === false || value === "") {
        url.searchParams.delete(key);
        return;
    }

    url.searchParams.set(key, String(value));
}

export function buildPageUrl(pathname, params = {}, origin = window.location.origin) {
    const url = new URL(pathname, origin);
    Object.entries(params).forEach(([key, value]) => {
        setUrlSearchParam(url, key, value);
    });
    return `${url.pathname}${url.search}`;
}

export function buildContinuumUrl(options = {}, origin = window.location.origin) {
    return buildPageUrl("/continuum.html", {
        username: options.username || null
    }, origin);
}

export function buildSanctumUrl(options = {}, origin = window.location.origin) {
    return buildPageUrl("/sanctum.html", {
        problemId: options.problemId || null,
        difficulty: options.difficulty && options.difficulty !== "ALL" ? options.difficulty : null,
        tag: options.tag && options.tag !== "ALL" ? options.tag : null,
        attention: options.attention && options.attention !== "ALL" ? options.attention : null,
        search: options.search ? String(options.search).trim() : null
    }, origin);
}

export function navigateToUrl(href) {
    window.location.href = href;
}

export function replaceCurrentUrl(mutator) {
    const url = new URL(window.location.href);
    mutator(url);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    return url;
}
