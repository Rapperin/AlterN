package com.altern.submission.runner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class RunnerHealthService {

    private static final Duration DOCKER_CHECK_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration CACHE_TTL = Duration.ofSeconds(5);
    private static final int SUPPORTED_LANGUAGE_COUNT = 3;

    private final DockerRunnerProperties dockerRunnerProperties;
    private final RunnerHealthCommandExecutor commandExecutor;

    private volatile CachedRunnerHealth cachedRunnerHealth;

    @Autowired
    public RunnerHealthService(DockerRunnerProperties dockerRunnerProperties) {
        this(dockerRunnerProperties, ProcessExecutionSupport::execute);
    }

    RunnerHealthService(DockerRunnerProperties dockerRunnerProperties, RunnerHealthCommandExecutor commandExecutor) {
        this.dockerRunnerProperties = dockerRunnerProperties;
        this.commandExecutor = commandExecutor;
    }

    public RunnerHealthResponse getRunnerHealth() {
        CachedRunnerHealth cached = cachedRunnerHealth;
        Instant now = Instant.now();
        if (cached != null && cached.checkedAt().plus(CACHE_TTL).isAfter(now)) {
            return cached.response();
        }

        synchronized (this) {
            cached = cachedRunnerHealth;
            now = Instant.now();
            if (cached != null && cached.checkedAt().plus(CACHE_TTL).isAfter(now)) {
                return cached.response();
            }

            RunnerHealthResponse refreshed = refreshRunnerHealth(now);
            cachedRunnerHealth = new CachedRunnerHealth(refreshed, now);
            return refreshed;
        }
    }

    public RunnerHealthResponse refreshRunnerHealth() {
        synchronized (this) {
            Instant now = Instant.now();
            RunnerHealthResponse refreshed = refreshRunnerHealth(now);
            cachedRunnerHealth = new CachedRunnerHealth(refreshed, now);
            return refreshed;
        }
    }

    public boolean shouldUseDockerSandbox() {
        RunnerHealthResponse health = getRunnerHealth();
        return health.isDockerEnabled() && health.isDockerAvailable() && health.isSandboxActive();
    }

    public boolean isLanguageExecutionAvailable(com.altern.submission.entity.ProgrammingLanguage language) {
        if (language == null) {
            return false;
        }

        if (shouldUseDockerSandbox() && supportsDockerSandbox(language)) {
            return true;
        }

        LanguageRuntimeHealthResponse toolchain = getLocalToolchain(language);
        return toolchain != null && toolchain.isAvailable();
    }

    public String buildLanguageUnavailableMessage(com.altern.submission.entity.ProgrammingLanguage language) {
        String languageLabel = language == null ? "Selected language" : language.name();
        RunnerHealthResponse health = getRunnerHealth();
        LanguageRuntimeHealthResponse toolchain = getLocalToolchain(language);

        if (toolchain != null && !toolchain.isAvailable()) {
            if (health.isDockerEnabled() && !health.isDockerAvailable()) {
                return languageLabel + " execution is unavailable right now. Docker sandbox was requested but is unavailable, and local "
                        + toolchain.getCommand()
                        + " is not ready. "
                        + toolchain.getMessage();
            }

            return languageLabel + " execution is unavailable right now. " + toolchain.getMessage();
        }

        if (health.isDockerEnabled() && !health.isDockerAvailable()) {
            return languageLabel + " execution is unavailable right now. Docker sandbox is unavailable and AlterN could not fall back safely.";
        }

        return languageLabel + " execution is unavailable right now.";
    }

    private RunnerHealthResponse refreshRunnerHealth(Instant checkedAt) {
        return dockerRunnerProperties.isEnabled()
                ? probeDocker(checkedAt)
                : localOnlyHealth(checkedAt);
    }

    private RunnerHealthResponse localOnlyHealth(Instant checkedAt) {
        return buildHealth(
                "LOCAL",
                "LOCAL",
                false,
                false,
                false,
                "LOCAL",
                "Docker sandbox disabled. Local runners active.",
                null,
                probeLocalToolchains(),
                checkedAt
        );
    }

    private RunnerHealthResponse probeDocker(Instant checkedAt) {
        try {
            ProcessExecutionSupport.ProcessOutcome outcome = commandExecutor.execute(
                    DOCKER_CHECK_TIMEOUT,
                    null,
                    dockerRunnerProperties.getBinary(),
                    "info",
                    "--format",
                    "{{.ServerVersion}}"
            );

            if (outcome.timedOut()) {
                return unavailable("Docker health check timed out.", checkedAt);
            }
            if (outcome.exitCode() != 0) {
                String message = ProcessExecutionSupport.cleanMessage(
                        outcome.stderr().isBlank() ? outcome.stdout() : outcome.stderr()
                );
                return unavailable(message, checkedAt);
            }

            String version = outcome.stdout().trim();
            return buildHealth(
                    "DOCKER",
                    "DOCKER",
                    true,
                    true,
                    true,
                "LOCAL",
                "Docker sandbox active.",
                version.isBlank() ? null : version,
                probeLocalToolchains(),
                checkedAt
            );
        } catch (IOException exception) {
            return unavailable("Docker check failed: " + exception.getMessage(), checkedAt);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return unavailable("Docker check interrupted.", checkedAt);
        }
    }

    private RunnerHealthResponse unavailable(String message, Instant checkedAt) {
        return buildHealth(
                "DOCKER",
                "LOCAL",
                true,
                false,
                false,
                "LOCAL",
                "Docker sandbox requested but unavailable. Local runners active. " + message,
                null,
                probeLocalToolchains(),
                checkedAt
        );
    }

    private RunnerHealthResponse buildHealth(
            String requestedMode,
            String mode,
            boolean dockerEnabled,
            boolean dockerAvailable,
            boolean sandboxActive,
            String fallbackMode,
            String message,
            String dockerVersion,
            List<LanguageRuntimeHealthResponse> localToolchains,
            Instant checkedAt
    ) {
        int availableLanguageCount = sandboxActive
                ? SUPPORTED_LANGUAGE_COUNT
                : (int) localToolchains.stream()
                .filter(LanguageRuntimeHealthResponse::isAvailable)
                .count();
        String readiness = resolveReadiness(dockerEnabled, dockerAvailable, sandboxActive, availableLanguageCount);
        boolean actionRequired = !"READY".equals(readiness);
        String actionMessage = buildActionMessage(
                readiness,
                dockerEnabled,
                dockerAvailable,
                sandboxActive,
                availableLanguageCount
        );

        return new RunnerHealthResponse(
                readiness,
                requestedMode,
                mode,
                dockerEnabled,
                dockerAvailable,
                sandboxActive,
                fallbackMode,
                message,
                dockerVersion,
                SUPPORTED_LANGUAGE_COUNT,
                availableLanguageCount,
                actionRequired,
                actionMessage,
                localToolchains,
                checkedAt
        );
    }

    private List<LanguageRuntimeHealthResponse> probeLocalToolchains() {
        String hostPlatform = detectHostPlatform();
        return List.of(
                probeJavaToolchain(hostPlatform),
                probeToolchain("PYTHON", "python3", hostPlatform, "python3", "--version"),
                probeToolchain("CPP", "g++", hostPlatform, "g++", "--version")
        );
    }

    private LanguageRuntimeHealthResponse probeJavaToolchain(String hostPlatform) {
        CommandProbe javacProbe = probeCommand("javac", "javac", "-version");
        CommandProbe javaProbe = probeCommand("java", "java", "-version");
        boolean available = javacProbe.available() && javaProbe.available();
        String version = firstNonBlank(javacProbe.version(), javaProbe.version());
        String message = available
                ? "javac and java available for local execution."
                : "Java local toolchain unavailable. javac="
                + availabilityLabel(javacProbe.available())
                + ", java="
                + availabilityLabel(javaProbe.available())
                + ".";

        return new LanguageRuntimeHealthResponse(
                "JAVA",
                "LOCAL",
                available,
                "javac/java",
                message,
                version,
                available ? null : buildSetupSummary("JAVA", hostPlatform),
                available ? null : buildSetupCommand("JAVA", hostPlatform)
        );
    }

    private LanguageRuntimeHealthResponse probeToolchain(
            String language,
            String label,
            String hostPlatform,
            String... command
    ) {
        CommandProbe probe = probeCommand(label, command);
        String message = probe.available()
                ? label + " available for local execution."
                : label + " unavailable for local execution. " + probe.message();

        return new LanguageRuntimeHealthResponse(
                language,
                "LOCAL",
                probe.available(),
                label,
                message.trim(),
                probe.version(),
                probe.available() ? null : buildSetupSummary(language, hostPlatform),
                probe.available() ? null : buildSetupCommand(language, hostPlatform)
        );
    }

    private String buildSetupSummary(String language, String hostPlatform) {
        return switch (hostPlatform) {
            case "macOS" -> switch (language) {
                case "JAVA" -> "Install a JDK and expose java/javac on PATH.";
                case "PYTHON" -> "Install Python 3 and expose python3 on PATH.";
                case "CPP" -> "Install Xcode Command Line Tools or a Homebrew g++ toolchain.";
                default -> "Install the required runtime and expose it on PATH.";
            };
            case "Linux" -> switch (language) {
                case "JAVA" -> "Install a JDK package and expose java/javac on PATH.";
                case "PYTHON" -> "Install python3 from your distro package manager.";
                case "CPP" -> "Install g++ from your distro package manager.";
                default -> "Install the required runtime and expose it on PATH.";
            };
            case "Windows" -> switch (language) {
                case "JAVA" -> "Install a JDK and add java/javac to PATH.";
                case "PYTHON" -> "Install Python 3 and add python3/python to PATH.";
                case "CPP" -> "Install a g++ toolchain and add it to PATH.";
                default -> "Install the required runtime and expose it on PATH.";
            };
            default -> "Install the required runtime and expose it on PATH.";
        };
    }

    private String buildSetupCommand(String language, String hostPlatform) {
        return switch (hostPlatform) {
            case "macOS" -> switch (language) {
                case "JAVA" -> "brew install openjdk@21";
                case "PYTHON" -> "brew install python";
                case "CPP" -> "xcode-select --install";
                default -> null;
            };
            case "Linux" -> switch (language) {
                case "JAVA" -> "sudo apt-get install openjdk-21-jdk";
                case "PYTHON" -> "sudo apt-get install python3";
                case "CPP" -> "sudo apt-get install g++";
                default -> null;
            };
            case "Windows" -> switch (language) {
                case "JAVA" -> "winget install EclipseAdoptium.Temurin.21.JDK";
                case "PYTHON" -> "winget install Python.Python.3.12";
                case "CPP" -> "Install MSYS2 or another g++ toolchain and add g++ to PATH";
                default -> null;
            };
            default -> null;
        };
    }

    private String detectHostPlatform() {
        String osName = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        if (osName.contains("mac") || osName.contains("darwin")) {
            return "macOS";
        }
        if (osName.contains("win")) {
            return "Windows";
        }
        if (osName.contains("nux") || osName.contains("nix")) {
            return "Linux";
        }
        return "Unknown";
    }

    private CommandProbe probeCommand(String label, String... command) {
        try {
            ProcessExecutionSupport.ProcessOutcome outcome = commandExecutor.execute(
                    DOCKER_CHECK_TIMEOUT,
                    null,
                    command
            );
            if (outcome.timedOut()) {
                return new CommandProbe(false, null, label + " check timed out.");
            }
            if (outcome.exitCode() != 0) {
                String message = ProcessExecutionSupport.cleanMessage(
                        outcome.stderr().isBlank() ? outcome.stdout() : outcome.stderr()
                );
                return new CommandProbe(false, null, message);
            }

            String version = firstNonBlank(outcome.stdout().trim(), outcome.stderr().trim());
            return new CommandProbe(true, version.isBlank() ? null : version, label + " available.");
        } catch (IOException exception) {
            return new CommandProbe(false, null, label + " check failed: " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return new CommandProbe(false, null, label + " check interrupted.");
        }
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private String availabilityLabel(boolean available) {
        return available ? "ready" : "missing";
    }

    private String resolveReadiness(
            boolean dockerEnabled,
            boolean dockerAvailable,
            boolean sandboxActive,
            int availableLanguageCount
    ) {
        if (sandboxActive) {
            return "READY";
        }
        if (availableLanguageCount == 0) {
            return "BLOCKED";
        }
        if ((dockerEnabled && !dockerAvailable) || availableLanguageCount < SUPPORTED_LANGUAGE_COUNT) {
            return "DEGRADED";
        }
        return "READY";
    }

    private String buildActionMessage(
            String readiness,
            boolean dockerEnabled,
            boolean dockerAvailable,
            boolean sandboxActive,
            int availableLanguageCount
    ) {
        if ("READY".equals(readiness)) {
            return "Execution environment is fully ready.";
        }
        if ("BLOCKED".equals(readiness)) {
            if (dockerEnabled && !dockerAvailable) {
                return "Start Docker or install at least one local runtime toolchain before submitting code.";
            }
            return "Install at least one local runtime toolchain before submitting code.";
        }
        if (sandboxActive) {
            return "Execution is available, but sandbox coverage is partially degraded.";
        }
        if (dockerEnabled && !dockerAvailable) {
            return "Start Docker to restore sandboxed execution, or continue with the " + availableLanguageCount + " local runtime(s) that are ready.";
        }
        return "Install the missing local runtime toolchains to restore full language coverage.";
    }

    private boolean supportsDockerSandbox(com.altern.submission.entity.ProgrammingLanguage language) {
        return language == com.altern.submission.entity.ProgrammingLanguage.JAVA
                || language == com.altern.submission.entity.ProgrammingLanguage.PYTHON
                || language == com.altern.submission.entity.ProgrammingLanguage.CPP;
    }

    private LanguageRuntimeHealthResponse getLocalToolchain(com.altern.submission.entity.ProgrammingLanguage language) {
        if (language == null) {
            return null;
        }

        return getRunnerHealth().getLocalToolchains().stream()
                .filter(toolchain -> toolchain.getLanguage() != null
                        && toolchain.getLanguage().equals(language.name().toUpperCase(Locale.ROOT)))
                .findFirst()
                .orElse(null);
    }

    @FunctionalInterface
    interface RunnerHealthCommandExecutor {
        ProcessExecutionSupport.ProcessOutcome execute(Duration timeout, String stdin, String... command)
                throws IOException, InterruptedException;
    }

    private record CachedRunnerHealth(RunnerHealthResponse response, Instant checkedAt) {
    }

    private record CommandProbe(boolean available, String version, String message) {
    }
}
