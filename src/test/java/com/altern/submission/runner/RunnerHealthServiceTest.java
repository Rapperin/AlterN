package com.altern.submission.runner;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RunnerHealthServiceTest {

    @Test
    void reportsLocalModeWhenDockerSandboxIsDisabled() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(false);

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> toolchainAwareOutcome(command)
        );

        RunnerHealthResponse health = service.getRunnerHealth();

        assertEquals("LOCAL", health.getRequestedMode());
        assertEquals("LOCAL", health.getMode());
        assertFalse(health.isDockerEnabled());
        assertFalse(health.isDockerAvailable());
        assertFalse(health.isSandboxActive());
        assertEquals("LOCAL", health.getFallbackMode());
        assertEquals("READY", health.getReadiness());
        assertEquals(3, health.getAvailableLanguageCount());
        assertEquals(3, health.getSupportedLanguageCount());
        assertFalse(health.isActionRequired());
        assertTrue(health.getMessage().contains("Local runners active"));
        assertEquals(3, health.getLocalToolchains().size());
        assertTrue(health.getLocalToolchains().stream().allMatch(LanguageRuntimeHealthResponse::isAvailable));
        assertNotNull(health.getCheckedAt());
    }

    @Test
    void reportsDockerModeWhenDaemonIsAvailable() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(true);

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> {
                    if ("docker".equals(command[0])) {
                        return new ProcessExecutionSupport.ProcessOutcome(0, "27.0.3\n", "", false);
                    }
                    return toolchainAwareOutcome(command);
                }
        );

        RunnerHealthResponse health = service.getRunnerHealth();

        assertEquals("DOCKER", health.getRequestedMode());
        assertEquals("DOCKER", health.getMode());
        assertTrue(health.isDockerEnabled());
        assertTrue(health.isDockerAvailable());
        assertTrue(health.isSandboxActive());
        assertEquals("READY", health.getReadiness());
        assertEquals(3, health.getAvailableLanguageCount());
        assertEquals("27.0.3", health.getDockerVersion());
        assertEquals(3, health.getLocalToolchains().size());
        assertTrue(service.shouldUseDockerSandbox());
    }

    @Test
    void fallsBackToLocalModeWhenDaemonIsUnavailable() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(true);

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> {
                    if ("docker".equals(command[0])) {
                        return new ProcessExecutionSupport.ProcessOutcome(
                                1,
                                "",
                                "Cannot connect to the Docker daemon.",
                                false
                        );
                    }
                    return toolchainAwareOutcome(command);
                }
        );

        RunnerHealthResponse health = service.getRunnerHealth();

        assertEquals("DOCKER", health.getRequestedMode());
        assertEquals("LOCAL", health.getMode());
        assertTrue(health.isDockerEnabled());
        assertFalse(health.isDockerAvailable());
        assertFalse(health.isSandboxActive());
        assertEquals("DEGRADED", health.getReadiness());
        assertTrue(health.isActionRequired());
        assertTrue(health.getMessage().contains("unavailable"));
        assertEquals(3, health.getLocalToolchains().size());
        assertFalse(service.shouldUseDockerSandbox());
    }

    @Test
    void cachesDockerProbeResultsBriefly() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(true);
        AtomicInteger calls = new AtomicInteger();

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> {
                    if ("docker".equals(command[0])) {
                        calls.incrementAndGet();
                        return new ProcessExecutionSupport.ProcessOutcome(0, "27.1.0", "", false);
                    }
                    return toolchainAwareOutcome(command);
                }
        );

        RunnerHealthResponse first = service.getRunnerHealth();
        RunnerHealthResponse second = service.getRunnerHealth();

        assertEquals("DOCKER", first.getRequestedMode());
        assertEquals("DOCKER", first.getMode());
        assertEquals("DOCKER", second.getMode());
        assertEquals(1, calls.get());
    }

    @Test
    void refreshRunnerHealthBypassesCachedProbe() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(true);
        AtomicInteger calls = new AtomicInteger();

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> {
                    if ("docker".equals(command[0])) {
                        calls.incrementAndGet();
                        return new ProcessExecutionSupport.ProcessOutcome(0, "27.1.0", "", false);
                    }
                    return toolchainAwareOutcome(command);
                }
        );

        RunnerHealthResponse first = service.getRunnerHealth();
        RunnerHealthResponse refreshed = service.refreshRunnerHealth();

        assertEquals(2, calls.get());
        assertNotEquals(first.getCheckedAt(), refreshed.getCheckedAt());
    }

    @Test
    void reportsMissingLocalToolchainWhenBinaryIsUnavailable() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(false);

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> {
                    if ("g++".equals(command[0])) {
                        return new ProcessExecutionSupport.ProcessOutcome(1, "", "g++ not found", false);
                    }
                    return toolchainAwareOutcome(command);
                }
        );

        RunnerHealthResponse health = service.getRunnerHealth();
        LanguageRuntimeHealthResponse cppHealth = health.getLocalToolchains().stream()
                .filter(toolchain -> "CPP".equals(toolchain.getLanguage()))
                .findFirst()
                .orElseThrow();

        assertFalse(cppHealth.isAvailable());
        assertTrue(cppHealth.getMessage().contains("unavailable"));
        assertNotNull(health.getLocalToolchains());
        assertEquals("DEGRADED", health.getReadiness());
        assertEquals(2, health.getAvailableLanguageCount());
        assertNotNull(cppHealth.getSetupSummary());
        assertNotNull(cppHealth.getSetupCommand());
    }

    @Test
    void reportsBlockedWhenNoExecutionRuntimeIsAvailable() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setEnabled(false);

        RunnerHealthService service = new RunnerHealthService(
                properties,
                (timeout, stdin, command) -> new ProcessExecutionSupport.ProcessOutcome(1, "", command[0] + " not found", false)
        );

        RunnerHealthResponse health = service.getRunnerHealth();

        assertEquals("BLOCKED", health.getReadiness());
        assertEquals(0, health.getAvailableLanguageCount());
        assertTrue(health.isActionRequired());
        assertTrue(health.getActionMessage().contains("Install at least one local runtime toolchain"));
    }

    private ProcessExecutionSupport.ProcessOutcome toolchainAwareOutcome(String[] command) {
        return switch (command[0]) {
            case "javac" -> new ProcessExecutionSupport.ProcessOutcome(0, "javac 24.0.1", "", false);
            case "java" -> new ProcessExecutionSupport.ProcessOutcome(0, "", "openjdk version \"24.0.1\"", false);
            case "python3" -> new ProcessExecutionSupport.ProcessOutcome(0, "Python 3.12.0", "", false);
            case "g++" -> new ProcessExecutionSupport.ProcessOutcome(0, "g++ (GCC) 14.0.0", "", false);
            default -> throw new IllegalArgumentException("Unexpected command: " + command[0]);
        };
    }
}
