package com.altern.submission.runner;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class RunnerPreflightReporter {

    private static final Logger LOGGER = LoggerFactory.getLogger(RunnerPreflightReporter.class);

    private final RunnerHealthService runnerHealthService;
    private final PreflightLogSink logSink;

    @Autowired
    public RunnerPreflightReporter(RunnerHealthService runnerHealthService) {
        this(
                runnerHealthService,
                new PreflightLogSink() {
                    @Override
                    public void info(String message) {
                        LOGGER.info(message);
                    }

                    @Override
                    public void warn(String message) {
                        LOGGER.warn(message);
                    }

                    @Override
                    public void error(String message) {
                        LOGGER.error(message);
                    }
                }
        );
    }

    RunnerPreflightReporter(RunnerHealthService runnerHealthService, PreflightLogSink logSink) {
        this.runnerHealthService = runnerHealthService;
        this.logSink = logSink;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void reportAtStartup() {
        RunnerHealthResponse health = runnerHealthService.getRunnerHealth();
        if (health == null) {
            logSink.warn("Runner preflight unavailable at startup.");
            return;
        }

        String message = buildStartupMessage(health);

        switch (health.getReadiness()) {
            case "BLOCKED" -> logSink.error(message);
            case "DEGRADED" -> logSink.warn(message);
            default -> logSink.info(message);
        }
    }

    String buildStartupMessage(RunnerHealthResponse health) {
        String readiness = valueOrFallback(health.getReadiness(), "UNKNOWN");
        String requested = valueOrFallback(health.getRequestedMode(), "LOCAL");
        String effective = valueOrFallback(health.getMode(), "LOCAL");
        int available = Math.max(health.getAvailableLanguageCount(), 0);
        int supported = Math.max(health.getSupportedLanguageCount(), 0);
        String detail = valueOrFallback(health.getActionMessage(), health.getMessage());

        return "Runner preflight [" + readiness + "] requested=" + requested
                + ", effective=" + effective
                + ", languages=" + available + "/" + supported
                + ". " + detail;
    }

    private String valueOrFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    interface PreflightLogSink {
        void info(String message);

        void warn(String message);

        void error(String message);
    }
}
