import { fetchJson } from "../shared/api.js";
import { authHeaders as buildAuthHeaders } from "../shared/session.js";
import { escapeHtml, renderBadge, renderEmptyState } from "../shared/ui.js";

export async function loadAdminTestCases(context, problemId) {
    const { state } = context;
    if (!context.isAdmin() || !problemId) {
        state.adminTestCases = [];
        state.editingTestCaseId = null;
        renderAdminEditors(context);
        return;
    }

    try {
        state.adminTestCases = await fetchJson(`/api/problems/${problemId}/testcases/admin`, {
            headers: authHeaders(context)
        });
    } catch (error) {
        state.adminTestCases = [];
        context.showAuthorFeedback(error.message || "Admin testcase listesi yuklenemedi.", "error");
    }

    renderAdminEditors(context);
}

export function renderAdminEditors(context) {
    const { state, refs } = context;
    const adminMode = context.isAdmin();

    refs.adminSelectedProblem.textContent = state.selectedProblem?.title ?? "-";
    refs.adminSelectedTestCase.textContent = state.editingTestCaseId ? `#${state.editingTestCaseId}` : "Yeni kayit";
    refs.testCaseSubmitButton.textContent = state.editingTestCaseId ? "Test Case Guncelle" : "Test Case Kaydet";
    refs.testCaseSubmitButton.disabled = !adminMode || !state.selectedProblemId;
    refs.testCaseCancelButton.hidden = !state.editingTestCaseId;
    refs.problemUpdateButton.disabled = !adminMode || !state.selectedProblemId;
    refs.problemDeleteButton.disabled = !adminMode || !state.selectedProblemId;

    refs.problemCreateForm.querySelectorAll("input, textarea, select, button").forEach((element) => {
        if (element.id !== "problemClearButton") {
            element.disabled = !adminMode;
        } else {
            element.disabled = false;
        }
    });
    refs.testCaseCreateForm.querySelectorAll("input, textarea, button").forEach((element) => {
        element.disabled = !adminMode || (element === refs.testCaseSubmitButton && !state.selectedProblemId);
    });
    refs.testCaseBulkForm.querySelectorAll("textarea, button").forEach((element) => {
        element.disabled = !adminMode || !state.selectedProblemId;
    });
    refs.problemBulkForm.querySelectorAll("textarea, button").forEach((element) => {
        element.disabled = !adminMode;
    });

    if (!adminMode) {
        if (!state.selectedProblem) {
            refs.adminTestCaseList.innerHTML = renderEmptyState("Bir problem sec; public sample preview burada gorunecek.");
            return;
        }

        if (state.visibleTestCases.length === 0) {
            refs.adminTestCaseList.innerHTML = renderEmptyState("Secili problemde public sample yok.");
            return;
        }

        refs.adminTestCaseList.innerHTML = state.visibleTestCases.map((testCase, index) => `
            <article class="sample-card sample-card--admin">
                <div class="sample-card__header">
                    <strong>Sample ${index + 1} ${renderBadge("PUBLIC")}</strong>
                </div>
                <p><code>input: ${escapeHtml(testCase.input)}</code></p>
                <p><code>expected: ${escapeHtml(testCase.expectedOutput)}</code></p>
            </article>
        `).join("");
        return;
    }

    if (state.adminTestCases.length === 0) {
        refs.adminTestCaseList.innerHTML = renderEmptyState("Admin gorunumu icin listelenecek testcase yok.");
        return;
    }

    refs.adminTestCaseList.innerHTML = state.adminTestCases.map((testCase, index) => `
        <article class="sample-card sample-card--admin">
            <div class="sample-card__header">
                <strong>Case ${index + 1} ${testCase.hidden ? renderBadge("HIDDEN") : renderBadge("PUBLIC")}</strong>
                <div class="sample-card__actions">
                    <button type="button" class="button button--ghost button--small" data-edit-testcase-id="${testCase.id}">Duzenle</button>
                    <button type="button" class="button button--ghost button--small button--danger" data-delete-testcase-id="${testCase.id}">Sil</button>
                </div>
            </div>
            <p><code>input: ${escapeHtml(testCase.input)}</code></p>
            <p><code>expected: ${escapeHtml(testCase.expectedOutput)}</code></p>
        </article>
    `).join("");

    refs.adminTestCaseList.querySelectorAll("[data-edit-testcase-id]").forEach((button) => {
        button.addEventListener("click", () => beginEditTestCase(context, Number(button.dataset.editTestcaseId)));
    });

    refs.adminTestCaseList.querySelectorAll("[data-delete-testcase-id]").forEach((button) => {
        button.addEventListener("click", () => {
            void deleteTestCase(context, Number(button.dataset.deleteTestcaseId));
        });
    });
}

export async function createTestCase(context, event) {
    event.preventDefault();

    const { state, refs } = context;
    if (!context.isAdmin()) {
        context.showAuthorFeedback("Test case eklemek icin admin olman gerekir.", "error");
        return;
    }

    if (!state.selectedProblemId) {
        context.showAuthorFeedback("Once bir problem sec.", "error");
        return;
    }

    const payload = {
        input: refs.testCaseInput.value,
        expectedOutput: refs.testCaseExpectedOutput.value,
        hidden: refs.testCaseHidden.checked
    };

    try {
        const isEditing = Boolean(state.editingTestCaseId);
        const url = isEditing
            ? `/api/problems/${state.selectedProblemId}/testcases/${state.editingTestCaseId}`
            : `/api/problems/${state.selectedProblemId}/testcases`;

        await fetchJson(url, {
            method: isEditing ? "PUT" : "POST",
            headers: authHeaders(context, {
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(payload)
        });

        resetTestCaseEditor(context);
        context.showAuthorFeedback(isEditing ? "Test case guncellendi." : "Test case kaydedildi.", "success");
        await context.selectProblem(state.selectedProblemId);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Test case kaydedilemedi.", "error");
    }
}

export async function bulkCreateTestCases(context, event) {
    event.preventDefault();

    const { state, refs } = context;
    if (!context.isAdmin()) {
        context.showAuthorFeedback("Bulk testcase icin admin olman gerekir.", "error");
        return;
    }

    if (!state.selectedProblemId) {
        context.showAuthorFeedback("Once bir problem sec.", "error");
        return;
    }

    try {
        const testCases = parseTestCaseBulkPayload(refs.testCaseBulkPayload.value);
        await fetchJson(`/api/problems/${state.selectedProblemId}/testcases/bulk`, {
            method: "POST",
            headers: authHeaders(context, {
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({ testCases })
        });

        refs.testCaseBulkPayload.value = "";
        context.showAuthorFeedback(`${testCases.length} testcase import edildi.`, "success");
        await context.selectProblem(state.selectedProblemId);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Bulk testcase import basarisiz.", "error");
    }
}

export function resetTestCaseEditor(context) {
    context.state.editingTestCaseId = null;
    context.refs.testCaseCreateForm.reset();
    renderAdminEditors(context);
}

export function parseTestCaseBulkPayload(rawPayload) {
    const trimmed = rawPayload.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        const testCases = Array.isArray(parsed) ? parsed : parsed?.testCases;
        if (!Array.isArray(testCases)) {
            throw new Error("Bulk testcase alani JSON array veya { testCases: [] } olmali.");
        }
        return testCases.map((testCase) => ({
            input: String(testCase?.input ?? ""),
            expectedOutput: String(testCase?.expectedOutput ?? ""),
            hidden: Boolean(testCase?.hidden)
        }));
    } catch (error) {
        throw new Error(error.message || "Bulk testcase JSON parse edilemedi.");
    }
}

function beginEditTestCase(context, testCaseId) {
    const { state, refs } = context;
    const testCase = state.adminTestCases.find((entry) => entry.id === testCaseId);
    if (!testCase) {
        context.showAuthorFeedback("Test case bulunamadi.", "error");
        return;
    }

    state.editingTestCaseId = testCaseId;
    refs.testCaseInput.value = testCase.input;
    refs.testCaseExpectedOutput.value = testCase.expectedOutput;
    refs.testCaseHidden.checked = Boolean(testCase.hidden);
    renderAdminEditors(context);
    context.focusAuthoringTarget("TESTCASE", { suppressMessage: true });
    context.showAuthorFeedback(`Case #${testCaseId} duzenleme modunda.`, "idle");
}

async function deleteTestCase(context, testCaseId) {
    const { state } = context;
    if (!context.isAdmin() || !state.selectedProblemId || !testCaseId) {
        return;
    }

    if (!window.confirm("Bu test case silinsin mi?")) {
        return;
    }

    try {
        await fetchJson(`/api/problems/${state.selectedProblemId}/testcases/${testCaseId}`, {
            method: "DELETE",
            headers: authHeaders(context)
        });

        if (state.editingTestCaseId === testCaseId) {
            resetTestCaseEditor(context);
        }
        context.showAuthorFeedback("Test case silindi.", "success");
        await context.selectProblem(state.selectedProblemId);
    } catch (error) {
        context.showAuthorFeedback(error.message || "Test case silinemedi.", "error");
    }
}

function authHeaders(context, extraHeaders = {}) {
    return buildAuthHeaders(context.state.authToken, extraHeaders);
}
