import { buildPageUrl } from "./page-links.js";

export function readPositiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
}

export function normalizeProgrammingLanguage(value) {
    const normalized = String(value || "").toUpperCase();
    return ["JAVA", "PYTHON", "CPP"].includes(normalized) ? normalized : null;
}

export function normalizeProblemDifficulty(value) {
    const normalized = String(value || "").toUpperCase();
    return ["EASY", "MEDIUM", "HARD"].includes(normalized) ? normalized : null;
}

export function normalizeProblemScope(value) {
    const normalized = String(value || "").toUpperCase();
    return ["ALL", "REMAINING", "ATTEMPTED", "SOLVED", "BOOKMARKED"].includes(normalized)
        ? normalized
        : null;
}

export function buildArenaUrl(options = {}, origin = window.location.origin) {
    return buildPageUrl("/arena.html", {
        problemId: options.problemId || null,
        submissionId: options.submissionId || null,
        language: options.suggestedLanguage || null,
        primeSample: options.primeSample ? "true" : null,
        scope: options.scope && options.scope !== "ALL" ? options.scope : null,
        difficulty: options.difficulty && options.difficulty !== "ALL" ? options.difficulty : null,
        tag: options.tag && options.tag !== "ALL" ? options.tag : null,
        search: options.search ? String(options.search).trim() : null,
        source: options.source || null
    }, origin);
}
