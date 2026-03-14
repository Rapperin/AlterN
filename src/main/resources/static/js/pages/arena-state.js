export function matchesProblemScope(context, problem) {
    const { state } = context;
    if (state.problemScope === "ALL" || !state.currentUser) {
        return true;
    }

    if (state.problemScope === "SOLVED") {
        return Boolean(problem.viewerSolved);
    }

    if (state.problemScope === "ATTEMPTED") {
        return Boolean(problem.viewerStatus)
            && problem.viewerStatus !== "NOT_STARTED"
            && problem.viewerStatus !== "ACCEPTED";
    }

    if (state.problemScope === "REMAINING") {
        return !problem.viewerSolved;
    }

    if (state.problemScope === "BOOKMARKED") {
        return Boolean(problem.viewerBookmarked);
    }

    return true;
}

export function matchesProblemDifficulty(context, problem) {
    return context.state.problemDifficultyFilter === "ALL" || problem.difficulty === context.state.problemDifficultyFilter;
}

export function matchesProblemTag(context, problem) {
    return context.state.problemTagFilter === "ALL" || (problem.tags || []).includes(context.state.problemTagFilter);
}

export function setProblemScope(context, scope) {
    context.state.problemScope = scope || "ALL";
    void context.refreshProblemArchive();
}

export function setProblemDifficultyFilter(context, filter) {
    context.state.problemDifficultyFilter = filter || "ALL";
    void context.refreshProblemArchive();
}

export function setProblemTagFilter(context, filter) {
    context.state.problemTagFilter = filter || "ALL";
    void context.refreshProblemArchive();
}

export function clearProblemFilters(context) {
    context.state.problemScope = "ALL";
    context.state.problemDifficultyFilter = "ALL";
    context.state.problemTagFilter = "ALL";
    if (context.refs.problemSearch) {
        context.refs.problemSearch.value = "";
    }
    void context.refreshProblemArchive();
}

export function isAdmin(context) {
    return context.state.currentUser?.role === "ADMIN";
}

export function starterTemplate(language) {
    switch (language) {
        case "PYTHON":
            return `n = int(input().strip())\ntotal = sum(i for i in range(n) if i % 3 == 0 or i % 5 == 0)\nprint(total)\n`;
        case "CPP":
            return `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n\n    long long total = 0;\n    for (long long i = 0; i < n; i++) {\n        if (i % 3 == 0 || i % 5 == 0) {\n            total += i;\n        }\n    }\n\n    cout << total;\n    return 0;\n}\n`;
        case "JAVA":
        default:
            return `public class Solution {\n    public static int solve(int n) {\n        int total = 0;\n        for (int i = 0; i < n; i++) {\n            if (i % 3 == 0 || i % 5 == 0) {\n                total += i;\n            }\n        }\n        return total;\n    }\n}\n`;
    }
}

export function persistDraftForContext(context, problemId, language, sourceCode) {
    const { state } = context;
    if (!problemId || !language) {
        context.renderDraftStatus();
        return;
    }

    const problemKey = String(problemId);
    const previousProblemHasDraft = context.hasProblemDraft(problemId);
    const nextDrafts = {
        ...state.editorDrafts
    };
    const draftGroup = {
        ...(nextDrafts[problemKey] || {})
    };
    const normalizedSource = String(sourceCode ?? "");
    const existingDraft = draftGroup[language];

    if (!normalizedSource.trim() || !shouldPersistDraft(context, problemId, language, normalizedSource, existingDraft)) {
        delete draftGroup[language];
    } else {
        draftGroup[language] = {
            sourceCode: normalizedSource,
            updatedAt: new Date().toISOString()
        };
    }

    if (Object.keys(draftGroup).length === 0) {
        delete nextDrafts[problemKey];
    } else {
        nextDrafts[problemKey] = draftGroup;
    }

    state.editorDrafts = nextDrafts;
    persistEditorDrafts(context);
    context.renderDraftStatus();

    if (previousProblemHasDraft !== context.hasProblemDraft(problemId)) {
        context.renderProblemList();
    }
}

export function loadEditorDrafts(storageKey) {
    try {
        const rawDrafts = localStorage.getItem(storageKey);
        if (!rawDrafts) {
            return {};
        }

        const parsed = JSON.parse(rawDrafts);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
    } catch (error) {
        return {};
    }
}

export function persistEditorDrafts(context) {
    localStorage.setItem(context.EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(context.state.editorDrafts));
}

export function shouldPersistDraft(context, problemId, language, sourceCode, existingDraft) {
    const starterSource = resolveProblemStarterCode(context, problemId, language);
    return Boolean(existingDraft) || String(sourceCode ?? "") !== starterSource;
}

export function resolveProblemStarterCode(context, problemId, language) {
    const { state } = context;
    const selectedProblemMatches = state.selectedProblem?.id === problemId;
    const problem = selectedProblemMatches
        ? state.selectedProblem
        : state.problems.find((entry) => entry.id === problemId);

    const problemStarter = problem?.starterCodes?.[language];
    if (problemStarter && String(problemStarter).trim()) {
        return String(problemStarter);
    }

    return starterTemplate(language);
}
