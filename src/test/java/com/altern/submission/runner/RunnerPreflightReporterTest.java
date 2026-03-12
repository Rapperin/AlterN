package com.altern.submission.runner;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class RunnerPreflightReporterTest {

    @Test
    void logsInfoWhenRuntimeIsReady() {
        RunnerHealthService healthService = mock(RunnerHealthService.class);
        CapturingLogSink logSink = new CapturingLogSink();
        RunnerPreflightReporter reporter = new RunnerPreflightReporter(healthService, logSink);

        given(healthService.getRunnerHealth()).willReturn(health("READY", "LOCAL", "LOCAL", 3, 3, false, null));

        reporter.reportAtStartup();

        assertEquals("INFO", logSink.level);
        assertTrue(logSink.message.contains("Runner preflight [READY]"));
        assertTrue(logSink.message.contains("languages=3/3"));
    }

    @Test
    void logsWarnWhenRuntimeIsDegraded() {
        RunnerHealthService healthService = mock(RunnerHealthService.class);
        CapturingLogSink logSink = new CapturingLogSink();
        RunnerPreflightReporter reporter = new RunnerPreflightReporter(healthService, logSink);

        given(healthService.getRunnerHealth()).willReturn(
                health("DEGRADED", "DOCKER", "LOCAL", 2, 3, true, "Start Docker to restore sandboxed execution.")
        );

        reporter.reportAtStartup();

        assertEquals("WARN", logSink.level);
        assertTrue(logSink.message.contains("Runner preflight [DEGRADED]"));
        assertTrue(logSink.message.contains("Start Docker"));
    }

    @Test
    void logsErrorWhenRuntimeIsBlocked() {
        RunnerHealthService healthService = mock(RunnerHealthService.class);
        CapturingLogSink logSink = new CapturingLogSink();
        RunnerPreflightReporter reporter = new RunnerPreflightReporter(healthService, logSink);

        given(healthService.getRunnerHealth()).willReturn(
                health("BLOCKED", "LOCAL", "LOCAL", 0, 3, true, "Install at least one local runtime toolchain.")
        );

        reporter.reportAtStartup();

        assertEquals("ERROR", logSink.level);
        assertTrue(logSink.message.contains("Runner preflight [BLOCKED]"));
        assertTrue(logSink.message.contains("languages=0/3"));
    }

    @Test
    void logsWarnWhenRuntimeHealthIsUnavailableAtStartup() {
        RunnerHealthService healthService = mock(RunnerHealthService.class);
        CapturingLogSink logSink = new CapturingLogSink();
        RunnerPreflightReporter reporter = new RunnerPreflightReporter(healthService, logSink);

        given(healthService.getRunnerHealth()).willReturn(null);

        reporter.reportAtStartup();

        assertEquals("WARN", logSink.level);
        assertEquals("Runner preflight unavailable at startup.", logSink.message);
    }

    private RunnerHealthResponse health(
            String readiness,
            String requestedMode,
            String mode,
            int availableLanguageCount,
            int supportedLanguageCount,
            boolean actionRequired,
            String actionMessage
    ) {
        return new RunnerHealthResponse(
                readiness,
                requestedMode,
                mode,
                "DOCKER".equals(requestedMode),
                false,
                false,
                "LOCAL",
                "Runner health message",
                null,
                supportedLanguageCount,
                availableLanguageCount,
                actionRequired,
                actionMessage,
                java.util.List.of(),
                java.time.Instant.parse("2026-03-12T03:00:00Z")
        );
    }

    private static final class CapturingLogSink implements RunnerPreflightReporter.PreflightLogSink {

        private String level;
        private String message;

        @Override
        public void info(String message) {
            this.level = "INFO";
            this.message = message;
        }

        @Override
        public void warn(String message) {
            this.level = "WARN";
            this.message = message;
        }

        @Override
        public void error(String message) {
            this.level = "ERROR";
            this.message = message;
        }
    }
}
