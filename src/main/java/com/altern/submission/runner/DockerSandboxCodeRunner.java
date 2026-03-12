package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class DockerSandboxCodeRunner implements CodeRunner {

    private static final Duration DEFAULT_RUN_TIMEOUT = Duration.ofSeconds(5);
    private static final int DEFAULT_PIDS_LIMIT = 128;

    private final DockerRunnerProperties properties;
    private final DockerCommandExecutor commandExecutor;

    @Autowired
    public DockerSandboxCodeRunner(DockerRunnerProperties properties) {
        this(properties, ProcessExecutionSupport::execute);
    }

    DockerSandboxCodeRunner(DockerRunnerProperties properties, DockerCommandExecutor commandExecutor) {
        this.properties = properties;
        this.commandExecutor = commandExecutor;
    }

    @Override
    public ExecutionResult run(ExecutionRequest request) {
        if (request.getLanguage() == ProgrammingLanguage.JAVA) {
            return runJava(request);
        }
        if (request.getLanguage() == ProgrammingLanguage.PYTHON) {
            return runPython(request);
        }
        if (request.getLanguage() == ProgrammingLanguage.CPP) {
            return runCpp(request);
        }

        return ExecutionResult.runtimeError(
                "Docker sandbox does not support " + request.getLanguage() + ".",
                0,
                0
        );
    }

    private ExecutionResult runJava(ExecutionRequest request) {
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("altern-docker-java-");
            Files.writeString(tempDir.resolve("Solution.java"), request.getSourceCode(), StandardCharsets.UTF_8);
            Files.writeString(tempDir.resolve("RunnerHarness.java"), JavaRunnerHarnessSource.source(), StandardCharsets.UTF_8);

            ProcessExecutionSupport.ProcessOutcome compileResult = executeDocker(
                    tempDir,
                    resolveCompileTimeout(),
                    null,
                    resolveCompileMemoryLimitMb(),
                    properties.getJavaImage(),
                    "javac",
                    "Solution.java",
                    "RunnerHarness.java"
            );
            ExecutionResult compileFailure = mapCompilationFailure(compileResult);
            if (compileFailure != null) {
                return compileFailure;
            }

            long startedAt = System.nanoTime();
            ProcessExecutionSupport.ProcessOutcome runResult = executeDocker(
                    tempDir,
                    resolveRunTimeout(request),
                    request.getInput(),
                    resolveRunMemoryLimitMb(request),
                    properties.getJavaImage(),
                    "java",
                    "-cp",
                    "/workspace",
                    "RunnerHarness"
            );
            int executionTime = ProcessExecutionSupport.elapsedMillis(startedAt);
            return mapRunResult(runResult, executionTime, resolveRunMemoryLimitMb(request));
        } catch (IOException e) {
            return ExecutionResult.runtimeError("Docker sandbox IO error: " + e.getMessage(), 0, 0);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ExecutionResult.runtimeError("Docker sandbox interrupted.", 0, 0);
        } finally {
            ProcessExecutionSupport.deleteDirectoryQuietly(tempDir);
        }
    }

    private ExecutionResult runPython(ExecutionRequest request) {
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("altern-docker-python-");
            Files.writeString(tempDir.resolve("solution.py"), request.getSourceCode(), StandardCharsets.UTF_8);

            long startedAt = System.nanoTime();
            ProcessExecutionSupport.ProcessOutcome runResult = executeDocker(
                    tempDir,
                    resolveRunTimeout(request),
                    request.getInput(),
                    resolveRunMemoryLimitMb(request),
                    properties.getPythonImage(),
                    "python",
                    "/workspace/solution.py"
            );
            int executionTime = ProcessExecutionSupport.elapsedMillis(startedAt);
            return mapRunResult(runResult, executionTime, resolveRunMemoryLimitMb(request));
        } catch (IOException e) {
            return ExecutionResult.runtimeError("Docker sandbox IO error: " + e.getMessage(), 0, 0);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ExecutionResult.runtimeError("Docker sandbox interrupted.", 0, 0);
        } finally {
            ProcessExecutionSupport.deleteDirectoryQuietly(tempDir);
        }
    }

    private ExecutionResult runCpp(ExecutionRequest request) {
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("altern-docker-cpp-");
            Files.writeString(tempDir.resolve("solution.cpp"), request.getSourceCode(), StandardCharsets.UTF_8);

            ProcessExecutionSupport.ProcessOutcome compileResult = executeDocker(
                    tempDir,
                    resolveCompileTimeout(),
                    null,
                    resolveCompileMemoryLimitMb(),
                    properties.getCppImage(),
                    "g++",
                    "-std=c++20",
                    "-O2",
                    "solution.cpp",
                    "-o",
                    "solution"
            );
            ExecutionResult compileFailure = mapCompilationFailure(compileResult);
            if (compileFailure != null) {
                return compileFailure;
            }

            long startedAt = System.nanoTime();
            ProcessExecutionSupport.ProcessOutcome runResult = executeDocker(
                    tempDir,
                    resolveRunTimeout(request),
                    request.getInput(),
                    resolveRunMemoryLimitMb(request),
                    properties.getCppImage(),
                    "/workspace/solution"
            );
            int executionTime = ProcessExecutionSupport.elapsedMillis(startedAt);
            return mapRunResult(runResult, executionTime, resolveRunMemoryLimitMb(request));
        } catch (IOException e) {
            return ExecutionResult.runtimeError("Docker sandbox IO error: " + e.getMessage(), 0, 0);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ExecutionResult.runtimeError("Docker sandbox interrupted.", 0, 0);
        } finally {
            ProcessExecutionSupport.deleteDirectoryQuietly(tempDir);
        }
    }

    private ProcessExecutionSupport.ProcessOutcome executeDocker(
            Path workspace,
            Duration timeout,
            String stdin,
            int memoryLimitMb,
            String image,
            String... containerCommand
    ) throws IOException, InterruptedException {
        return commandExecutor.execute(
                workspace,
                timeout,
                stdin,
                buildDockerCommand(workspace, memoryLimitMb, image, containerCommand)
        );
    }

    private String[] buildDockerCommand(Path workspace, int memoryLimitMb, String image, String... containerCommand) {
        List<String> command = new ArrayList<>();
        command.add(properties.getBinary());
        command.add("run");
        command.add("--rm");
        command.add("-i");
        command.add("--network");
        command.add("none");
        command.add("--memory");
        command.add(memoryLimitMb + "m");
        command.add("--cpus");
        command.add(properties.getCpuLimit());
        command.add("--pids-limit");
        command.add(String.valueOf(DEFAULT_PIDS_LIMIT));
        command.add("--cap-drop");
        command.add("ALL");
        command.add("--security-opt");
        command.add("no-new-privileges");
        command.add("--tmpfs");
        command.add("/tmp:rw,noexec,nosuid,size=64m");
        command.add("-v");
        command.add(workspace.toAbsolutePath() + ":/workspace");
        command.add("-w");
        command.add("/workspace");
        command.add(image);
        command.addAll(List.of(containerCommand));
        return command.toArray(String[]::new);
    }

    private ExecutionResult mapCompilationFailure(ProcessExecutionSupport.ProcessOutcome compileResult) {
        if (compileResult == null) {
            return ExecutionResult.runtimeError("Docker sandbox compile step failed unexpectedly.", 0, 0);
        }
        if (compileResult.timedOut()) {
            return ExecutionResult.compilationError("Compilation timed out inside Docker sandbox.");
        }
        if (compileResult.exitCode() == 0) {
            return null;
        }
        if (isDockerInfrastructureError(compileResult)) {
            return ExecutionResult.runtimeError("Docker sandbox error: " + cleanInfraMessage(compileResult), 0, 0);
        }
        return ExecutionResult.compilationError(ProcessExecutionSupport.cleanMessage(compileResult.stderr()));
    }

    private ExecutionResult mapRunResult(
            ProcessExecutionSupport.ProcessOutcome runResult,
            int executionTime,
            int configuredMemoryLimitMb
    ) {
        int memoryUsage = resolveReportedMemoryUsageMb(configuredMemoryLimitMb);

        if (runResult.timedOut()) {
            return ExecutionResult.timeLimitExceeded(
                    "Execution timed out inside Docker sandbox.",
                    executionTime,
                    memoryUsage
            );
        }
        if (runResult.exitCode() != 0) {
            if (isDockerInfrastructureError(runResult)) {
                return ExecutionResult.runtimeError(
                        "Docker sandbox error: " + cleanInfraMessage(runResult),
                        executionTime,
                        0
                );
            }
            return ExecutionResult.runtimeError(
                    ProcessExecutionSupport.cleanMessage(runResult.stderr()),
                    executionTime,
                    memoryUsage
            );
        }

        return ExecutionResult.success(runResult.stdout().trim(), executionTime, memoryUsage, null);
    }

    private boolean isDockerInfrastructureError(ProcessExecutionSupport.ProcessOutcome outcome) {
        String combinedOutput = (outcome.stderr() + "\n" + outcome.stdout()).toLowerCase(Locale.ROOT);
        return combinedOutput.contains("cannot connect to the docker daemon")
                || combinedOutput.contains("permission denied while trying to connect to the docker daemon socket")
                || combinedOutput.contains("error response from daemon")
                || combinedOutput.contains("unable to find image")
                || combinedOutput.contains("pull access denied")
                || combinedOutput.contains("docker: ");
    }

    private String cleanInfraMessage(ProcessExecutionSupport.ProcessOutcome outcome) {
        return ProcessExecutionSupport.cleanMessage(outcome.stderr().isBlank() ? outcome.stdout() : outcome.stderr());
    }

    private Duration resolveCompileTimeout() {
        return Duration.ofMillis(Math.max(1, properties.getCompileTimeoutMs()));
    }

    private Duration resolveRunTimeout(ExecutionRequest request) {
        Integer customTimeLimitMs = request.getTimeLimitMs();
        if (customTimeLimitMs == null || customTimeLimitMs < 1) {
            return DEFAULT_RUN_TIMEOUT;
        }

        return Duration.ofMillis(customTimeLimitMs);
    }

    private int resolveCompileMemoryLimitMb() {
        return Math.max(32, properties.getMemoryLimitMb());
    }

    private int resolveRunMemoryLimitMb(ExecutionRequest request) {
        Integer requestedMemoryLimitMb = request.getMemoryLimitMb();
        if (requestedMemoryLimitMb == null || requestedMemoryLimitMb < 1) {
            return resolveCompileMemoryLimitMb();
        }

        return Math.max(32, requestedMemoryLimitMb);
    }

    private int resolveReportedMemoryUsageMb(int configuredMemoryLimitMb) {
        return Math.max(32, configuredMemoryLimitMb);
    }

    @FunctionalInterface
    interface DockerCommandExecutor {
        ProcessExecutionSupport.ProcessOutcome execute(
                Path workingDirectory,
                Duration timeout,
                String stdin,
                String... command
        ) throws IOException, InterruptedException;
    }
}
