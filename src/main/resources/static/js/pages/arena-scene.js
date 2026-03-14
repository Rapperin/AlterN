export function clearScenePulse(context) {
    const { state, refs } = context;
    if (state.scenePulseTimerId) {
        window.clearTimeout(state.scenePulseTimerId);
        state.scenePulseTimerId = null;
    }

    refs.pageShell?.classList.remove(...context.SCENE_PULSE_CLASSES);
}

export function pulseScene(context, kind) {
    const { refs, state, SCENE_PULSE_MS, SCENE_PULSE_CLASSES } = context;
    if (!refs.pageShell || !kind) {
        return;
    }

    const sceneClass = `scene-pulse--${kind}`;
    if (!SCENE_PULSE_CLASSES.includes(sceneClass)) {
        return;
    }

    clearScenePulse(context);
    refs.pageShell.offsetWidth;
    refs.pageShell.classList.add(sceneClass);
    state.scenePulseTimerId = window.setTimeout(() => {
        refs.pageShell?.classList.remove(sceneClass);
        state.scenePulseTimerId = null;
    }, SCENE_PULSE_MS);
}

export function applyProblemScene(problem) {
    document.body.dataset.problemDifficulty = (problem?.difficulty || "neutral").toLowerCase();
    document.body.dataset.problemStatus = (problem?.viewerStatus || "neutral").toLowerCase();
}

export function applyWorkspaceMode(problem) {
    document.body.dataset.workspaceMode = problem ? "engaged" : "landing";
}
