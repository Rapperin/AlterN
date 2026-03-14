import { fetchJson } from "../shared/api.js";
import { authHeaders as buildAuthHeaders } from "../shared/session.js";

export async function createProblem(context, event) {
    event.preventDefault();

    if (!context.isAdmin()) {
        context.showAuthorFeedback("Problem olusturmak icin admin olman gerekir.", "error");
        return;
    }

    try {
        const payload = readProblemPayload(context);
        const problem = await fetchJson("/api/problems", {
            method: "POST",
            headers: authHeaders(context, {
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        clearProblemForm(context);
        context.showAuthorFeedback(`Problem olusturuldu: ${problem.title}`, "success");
        await context.loadProblems(problem.id);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Problem olusturulamadi.", "error");
    }
}

export async function updateProblem(context) {
    const { state } = context;
    if (!context.isAdmin() || !state.selectedProblemId) {
        context.showAuthorFeedback("Guncellemek icin once bir problem sec.", "error");
        return;
    }

    try {
        const payload = readProblemPayload(context);
        await fetchJson(`/api/problems/${state.selectedProblemId}`, {
            method: "PUT",
            headers: authHeaders(context, {
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        context.showAuthorFeedback("Secili problem guncellendi.", "success");
        await context.loadProblems(state.selectedProblemId);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Problem guncellenemedi.", "error");
    }
}

export async function deleteProblem(context) {
    const { state } = context;
    if (!context.isAdmin() || !state.selectedProblemId) {
        context.showAuthorFeedback("Silmek icin once bir problem sec.", "error");
        return;
    }

    if (!window.confirm("Secili problem silinsin mi?")) {
        return;
    }

    try {
        await fetchJson(`/api/problems/${state.selectedProblemId}`, {
            method: "DELETE",
            headers: authHeaders(context)
        });

        context.showAuthorFeedback("Problem silindi.", "success");
        clearProblemForm(context);
        state.selectedProblemId = null;
        state.selectedProblem = null;
        state.visibleTestCases = [];
        state.adminTestCases = [];
        await context.loadProblems();
    } catch (error) {
        context.showAuthorFeedback(error.message || "Problem silinemedi.", "error");
    }
}

export async function bulkCreateProblems(context, event) {
    event.preventDefault();

    if (!context.isAdmin()) {
        context.showAuthorFeedback("Bulk import icin admin olman gerekir.", "error");
        return;
    }

    try {
        const raw = context.refs.problemBulkPayload.value.trim();
        const parsed = JSON.parse(raw);
        const problems = Array.isArray(parsed) ? parsed : parsed?.problems;
        if (!Array.isArray(problems)) {
            throw new Error("Payload JSON array veya { problems: [] } olmali.");
        }

        const normalized = problems.map(normalizeProblemPayload);
        await fetchJson("/api/problems/bulk", {
            method: "POST",
            headers: authHeaders(context, {
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({ problems: normalized })
        });

        context.refs.problemBulkPayload.value = "";
        context.showAuthorFeedback(`${normalized.length} problem import edildi.`, "success");
        await context.loadProblems(context.state.selectedProblemId);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Bulk problem import basarisiz.", "error");
    }
}

export function populateProblemForm(context, problem) {
    const { refs } = context;
    refs.problemCreateTitle.value = problem?.title ?? "";
    refs.problemCreateDescription.value = problem?.description ?? "";
    refs.problemCreateConstraints.value = problem?.constraints ?? "";
    refs.problemCreateInputFormat.value = problem?.inputFormat ?? "";
    refs.problemCreateOutputFormat.value = problem?.outputFormat ?? "";
    refs.problemCreateHintTitle.value = problem?.hintTitle ?? "";
    refs.problemCreateHintContent.value = problem?.hintContent ?? "";
    refs.problemCreateEditorialTitle.value = problem?.editorialTitle ?? "";
    refs.problemCreateEditorialContent.value = problem?.editorialContent ?? "";
    refs.problemCreateDifficulty.value = problem?.difficulty ?? "EASY";
    refs.problemCreateTimeLimit.value = String(problem?.timeLimitMs ?? context.defaultTimeLimitMs);
    refs.problemCreateMemoryLimit.value = String(problem?.memoryLimitMb ?? context.defaultMemoryLimitMb);
    refs.problemCreateTags.value = (problem?.tags || []).join(", ");
    refs.problemCreateExamples.value = JSON.stringify(problem?.examples || [], null, 2);
    refs.problemCreateStarterCodes.value = JSON.stringify(problem?.starterCodes || {}, null, 2);
}

export function clearProblemForm(context) {
    const { refs } = context;
    refs.problemCreateForm.reset();
    refs.problemCreateDifficulty.value = "EASY";
    refs.problemCreateTimeLimit.value = String(context.defaultTimeLimitMs);
    refs.problemCreateMemoryLimit.value = String(context.defaultMemoryLimitMb);
    refs.problemCreateExamples.value = "[]";
    refs.problemCreateStarterCodes.value = "{}";
    context.showAuthorFeedback("Problem editoru temizlendi. Yeni codex acmaya hazir.", "idle");
}

export function applyAuthoringScaffold(context, flag) {
    const normalizedFlag = String(flag || "").toUpperCase();

    try {
        switch (normalizedFlag) {
            case "LOW_EXAMPLE_DEPTH":
                insertExampleScaffold(context);
                focusAuthoringTarget(context, "EXAMPLES", { suppressMessage: true });
                return;
            case "MISSING_HINT":
                insertHintScaffold(context);
                focusAuthoringTarget(context, "HINT", { suppressMessage: true });
                return;
            case "MISSING_EDITORIAL":
                insertEditorialScaffold(context);
                focusAuthoringTarget(context, "EDITORIAL", { suppressMessage: true });
                return;
            case "NEEDS_PUBLIC_SAMPLE":
                insertTestCaseScaffold(context, buildPublicSampleScaffold());
                focusAuthoringTarget(context, "NEEDS_PUBLIC_SAMPLE", { suppressMessage: true });
                return;
            case "NEEDS_HIDDEN_DEPTH":
                insertTestCaseScaffold(context, buildHiddenDepthScaffold());
                focusAuthoringTarget(context, "NEEDS_HIDDEN_DEPTH", { suppressMessage: true });
                return;
            case "LOW_TOTAL_CASE_COVERAGE":
                insertTestCaseScaffold(context, buildCoverageScaffold(context));
                focusAuthoringTarget(context, "LOW_TOTAL_CASE_COVERAGE", { suppressMessage: true });
                return;
            default:
                focusAuthoringTarget(context, normalizedFlag);
        }
    } catch (error) {
        context.showAuthorFeedback(error.message || "Scaffold uygulanamadi.", "error");
    }
}

export function focusAuthoringTarget(context, target, options = {}) {
    const { refs } = context;
    const normalizedTarget = String(target || "").toUpperCase();
    const suppressMessage = Boolean(options.suppressMessage);
    let input = null;
    let message = null;

    switch (normalizedTarget) {
        case "STATEMENT":
            input = refs.problemCreateDescription;
            message = "Problem statement alani odakta.";
            break;
        case "EXAMPLES":
        case "LOW_EXAMPLE_DEPTH":
            input = refs.problemCreateExamples;
            message = "Example alanina odaklanildi.";
            break;
        case "HINT":
        case "MISSING_HINT":
            input = refs.problemCreateHintTitle;
            message = "Hint alanina odaklanildi.";
            break;
        case "EDITORIAL":
        case "MISSING_EDITORIAL":
            input = refs.problemCreateEditorialTitle;
            message = "Editorial alanina odaklanildi.";
            break;
        case "TESTCASE":
            input = refs.testCaseInput;
            message = "Testcase editoru odakta.";
            break;
        case "NEEDS_PUBLIC_SAMPLE":
            refs.testCaseHidden.checked = false;
            input = refs.testCaseInput;
            message = "Public testcase depth artirmak icin testcase editoru odakta.";
            break;
        case "NEEDS_HIDDEN_DEPTH":
            refs.testCaseHidden.checked = true;
            input = refs.testCaseInput;
            message = "Hidden testcase eklemek icin testcase editoru odakta.";
            break;
        case "LOW_TOTAL_CASE_COVERAGE":
            input = refs.testCaseBulkPayload;
            message = "Case coverage artirmak icin bulk testcase alani odakta.";
            break;
        default:
            input = refs.problemCreateDescription;
            message = "Authoring editoru odakta.";
            break;
    }

    if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus({ preventScroll: true });
    }

    if (!suppressMessage && message) {
        context.showAuthorFeedback(message, "idle");
    }
}


function readProblemPayload(context) {
    const { refs } = context;
    return normalizeProblemPayload({
        title: refs.problemCreateTitle.value,
        description: refs.problemCreateDescription.value,
        constraints: refs.problemCreateConstraints.value,
        inputFormat: refs.problemCreateInputFormat.value,
        outputFormat: refs.problemCreateOutputFormat.value,
        hintTitle: refs.problemCreateHintTitle.value,
        hintContent: refs.problemCreateHintContent.value,
        editorialTitle: refs.problemCreateEditorialTitle.value,
        editorialContent: refs.problemCreateEditorialContent.value,
        difficulty: refs.problemCreateDifficulty.value,
        timeLimitMs: refs.problemCreateTimeLimit.value,
        memoryLimitMb: refs.problemCreateMemoryLimit.value,
        tags: refs.problemCreateTags.value,
        examples: parseExamplesJson(refs.problemCreateExamples.value),
        starterCodes: parseStarterCodesJson(refs.problemCreateStarterCodes.value)
    }, context);
}

function normalizeProblemPayload(payload, context = null) {
    const defaultTimeLimitMs = context?.defaultTimeLimitMs ?? 5000;
    const defaultMemoryLimitMb = context?.defaultMemoryLimitMb ?? 256;

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Problem payload object olmali.");
    }

    const tags = Array.isArray(payload.tags)
        ? payload.tags
        : String(payload.tags ?? "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

    const examples = Array.isArray(payload.examples) ? payload.examples : [];
    const normalizedExamples = examples.map((example, index) => {
        const input = String(example?.input ?? "").trim();
        const output = String(example?.output ?? "").trim();
        const explanation = String(example?.explanation ?? "").trim();

        if (!input || !output) {
            throw new Error(`Example #${index + 1} icin input ve output zorunlu.`);
        }

        return {
            input,
            output,
            explanation: explanation || null
        };
    });

    const starterCodes = payload.starterCodes && typeof payload.starterCodes === "object" && !Array.isArray(payload.starterCodes)
        ? payload.starterCodes
        : {};
    const normalizedStarterCodes = Object.fromEntries(
        Object.entries(starterCodes)
            .map(([language, code]) => [String(language).trim().toUpperCase(), String(code ?? "").trim()])
            .filter(([language, code]) => language && code)
    );

    const testCases = Array.isArray(payload.testCases) ? payload.testCases : [];
    const normalizedTestCases = testCases.map((testCase, index) => {
        const input = String(testCase?.input ?? "");
        const expectedOutput = String(testCase?.expectedOutput ?? "").trim();

        if (!input.trim() || !expectedOutput) {
            throw new Error(`Test case #${index + 1} icin input ve expectedOutput zorunlu.`);
        }

        return {
            input,
            expectedOutput,
            hidden: Boolean(testCase?.hidden)
        };
    });

    return {
        title: String(payload.title ?? "").trim(),
        description: String(payload.description ?? "").trim(),
        constraints: String(payload.constraints ?? "").trim() || null,
        inputFormat: String(payload.inputFormat ?? "").trim() || null,
        outputFormat: String(payload.outputFormat ?? "").trim() || null,
        hintTitle: String(payload.hintTitle ?? "").trim() || null,
        hintContent: String(payload.hintContent ?? "").trim() || null,
        editorialTitle: String(payload.editorialTitle ?? "").trim() || null,
        editorialContent: String(payload.editorialContent ?? "").trim() || null,
        difficulty: String(payload.difficulty ?? "").trim().toUpperCase(),
        timeLimitMs: Number(payload.timeLimitMs || defaultTimeLimitMs),
        memoryLimitMb: Number(payload.memoryLimitMb || defaultMemoryLimitMb),
        tags: tags.map((tag) => String(tag).trim()).filter(Boolean),
        examples: normalizedExamples,
        starterCodes: normalizedStarterCodes,
        testCases: normalizedTestCases
    };
}

function parseExamplesJson(rawExamples) {
    const trimmed = rawExamples.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            throw new Error("Examples alani JSON array olmali.");
        }
        return parsed;
    } catch (error) {
        throw new Error(error.message || "Examples JSON parse edilemedi.");
    }
}

function parseStarterCodesJson(rawStarterCodes) {
    const trimmed = rawStarterCodes.trim();
    if (!trimmed) {
        return {};
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Starter codes alani JSON object olmali.");
        }
        return parsed;
    } catch (error) {
        throw new Error(error.message || "Starter codes JSON parse edilemedi.");
    }
}

function insertExampleScaffold(context) {
    const existingExamples = parseExamplesJson(context.refs.problemCreateExamples.value);
    const nextIndex = existingExamples.length + 1;
    const scaffold = {
        input: existingExamples.length === 0 ? "REPLACE_WITH_SAMPLE_INPUT" : `REPLACE_WITH_EXAMPLE_${nextIndex}_INPUT`,
        output: existingExamples.length === 0 ? "REPLACE_WITH_SAMPLE_OUTPUT" : `REPLACE_WITH_EXAMPLE_${nextIndex}_OUTPUT`,
        explanation: existingExamples.length === 0
            ? "Aciklamayi problemi anlatacak sekilde guncelle."
            : `Example ${nextIndex} neden onemli, kisaca acikla.`
    };

    context.refs.problemCreateExamples.value = JSON.stringify([...existingExamples, scaffold], null, 2);
    context.showAuthorFeedback("Examples alanina yeni bir scaffold eklendi.", "success");
}

function insertHintScaffold(context) {
    const { refs, state } = context;
    if (!refs.problemCreateHintTitle.value.trim()) {
        refs.problemCreateHintTitle.value = `First step for ${state.selectedProblem?.title || "this problem"}`;
    }

    if (!refs.problemCreateHintContent.value.trim()) {
        refs.problemCreateHintContent.value = [
            "1. Kucuk inputlarla oruntuyu gozlemle.",
            "2. Sonucu direkt hesaplatan bir kalip veya formul aramayi dene.",
            "3. Hidden case'lerde hangi edge durumlarin patlayabilecegini not et."
        ].join("\n");
        context.showAuthorFeedback("Hint scaffold'i yerlestirildi.", "success");
        return;
    }

    context.showAuthorFeedback("Hint alani zaten dolu; sadece odaklandi.", "idle");
}

function insertEditorialScaffold(context) {
    const { refs, state } = context;
    if (!refs.problemCreateEditorialTitle.value.trim()) {
        refs.problemCreateEditorialTitle.value = `${state.selectedProblem?.title || "Problem"} solution outline`;
    }

    if (!refs.problemCreateEditorialContent.value.trim()) {
        refs.problemCreateEditorialContent.value = [
            "Approach:",
            "- Ana fikri bir iki cumlede acikla.",
            "",
            "Why it works:",
            "- Cozumu dogrulayan mantigi yaz.",
            "",
            "Complexity:",
            "- Time complexity:",
            "- Memory complexity:",
            "",
            "Edge cases:",
            "- Hangi sinir durumlarina dikkat edildigini not et."
        ].join("\n");
        context.showAuthorFeedback("Editorial scaffold'i yerlestirildi.", "success");
        return;
    }

    context.showAuthorFeedback("Editorial alani zaten dolu; sadece odaklandi.", "idle");
}

function insertTestCaseScaffold(context, scaffoldCases) {
    const existingCases = parseTestCaseBulkPayload(context.refs.testCaseBulkPayload.value);
    context.refs.testCaseBulkPayload.value = JSON.stringify([...existingCases, ...scaffoldCases], null, 2);
    context.showAuthorFeedback(`${scaffoldCases.length} testcase scaffold'i hazirlandi.`, "success");
}

function buildPublicSampleScaffold() {
    return [{
        input: "REPLACE_WITH_SAMPLE_INPUT",
        expectedOutput: "REPLACE_WITH_SAMPLE_OUTPUT",
        hidden: false
    }];
}

function buildHiddenDepthScaffold() {
    return [
        {
            input: "REPLACE_WITH_BOUNDARY_INPUT",
            expectedOutput: "REPLACE_WITH_BOUNDARY_OUTPUT",
            hidden: true
        },
        {
            input: "REPLACE_WITH_TRICKY_INPUT",
            expectedOutput: "REPLACE_WITH_TRICKY_OUTPUT",
            hidden: true
        }
    ];
}

function buildCoverageScaffold(context) {
    const publicCount = context.state.adminTestCases.filter((testCase) => !testCase.hidden).length;
    const base = publicCount === 0 ? buildPublicSampleScaffold() : [];
    return [
        ...base,
        {
            input: "REPLACE_WITH_EDGE_INPUT",
            expectedOutput: "REPLACE_WITH_EDGE_OUTPUT",
            hidden: true
        },
        {
            input: "REPLACE_WITH_STRESS_INPUT",
            expectedOutput: "REPLACE_WITH_STRESS_OUTPUT",
            hidden: true
        }
    ];
}

function authHeaders(context, extraHeaders = {}) {
    return buildAuthHeaders(context.state.authToken, extraHeaders);
}
