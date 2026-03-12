package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DockerSandboxCodeRunnerTest {

    @Test
    void buildsDockerCommandsForJavaCompileAndRun() {
        DockerRunnerProperties properties = testProperties();
        CapturingExecutor executor = new CapturingExecutor(
                new ProcessExecutionSupport.ProcessOutcome(0, "", "", false),
                new ProcessExecutionSupport.ProcessOutcome(0, "23\n", "", false)
        );
        DockerSandboxCodeRunner codeRunner = new DockerSandboxCodeRunner(properties, executor);

        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.JAVA,
                "public class Solution { public static int solve(int n) { return 23; } }",
                "10",
                1200,
                96
        ));

        assertEquals(ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals("23", result.getOutput());
        assertEquals(96, result.getMemoryUsage());
        assertEquals(2, executor.commands.size());
        assertTrue(executor.commands.get(0).contains("eclipse-temurin:17-jdk"));
        assertTrue(executor.commands.get(0).contains("192m"));
        assertCommandEndsWith(executor.commands.get(0), "javac", "Solution.java", "RunnerHarness.java");
        assertTrue(executor.commands.get(1).contains("96m"));
        assertCommandEndsWith(executor.commands.get(1), "java", "-cp", "/workspace", "RunnerHarness");
        assertTrue(executor.commands.get(1).contains("-i"));
        assertEquals(Duration.ofMillis(1200), executor.timeouts.get(1));
        assertEquals("10", executor.stdins.get(1));
    }

    @Test
    void returnsCompilationErrorForCppCompilerFailureInsideDocker() {
        DockerRunnerProperties properties = testProperties();
        CapturingExecutor executor = new CapturingExecutor(
                new ProcessExecutionSupport.ProcessOutcome(1, "", "solution.cpp:1: error: broken", false)
        );
        DockerSandboxCodeRunner codeRunner = new DockerSandboxCodeRunner(properties, executor);

        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.CPP,
                "int main( { return 0; }",
                "10"
        ));

        assertEquals(ExecutionStatus.COMPILATION_ERROR, result.getStatus());
        assertTrue(result.getMessage().contains("error"));
        assertEquals(1, executor.commands.size());
        assertTrue(executor.commands.get(0).contains("gcc:13"));
        assertCommandEndsWith(executor.commands.get(0), "g++", "-std=c++20", "-O2", "solution.cpp", "-o", "solution");
    }

    @Test
    void returnsTimeLimitExceededForPythonTimeoutInsideDocker() {
        DockerRunnerProperties properties = testProperties();
        CapturingExecutor executor = new CapturingExecutor(
                new ProcessExecutionSupport.ProcessOutcome(-1, "", "", true)
        );
        DockerSandboxCodeRunner codeRunner = new DockerSandboxCodeRunner(properties, executor);

        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.PYTHON,
                "while True:\n    pass",
                "10",
                300,
                80
        ));

        assertEquals(ExecutionStatus.TIME_LIMIT_EXCEEDED, result.getStatus());
        assertTrue(result.getMessage().contains("timed out"));
        assertEquals(80, result.getMemoryUsage());
        assertEquals(Duration.ofMillis(300), executor.timeouts.get(0));
        assertTrue(executor.commands.get(0).contains("80m"));
        assertCommandEndsWith(executor.commands.get(0), "python", "/workspace/solution.py");
    }

    @Test
    void returnsRuntimeErrorWhenDockerDaemonIsUnavailable() {
        DockerRunnerProperties properties = testProperties();
        CapturingExecutor executor = new CapturingExecutor(
                new ProcessExecutionSupport.ProcessOutcome(
                        125,
                        "",
                        "Cannot connect to the Docker daemon at unix:///var/run/docker.sock.",
                        false
                )
        );
        DockerSandboxCodeRunner codeRunner = new DockerSandboxCodeRunner(properties, executor);

        ExecutionResult result = codeRunner.run(new ExecutionRequest(
                ProgrammingLanguage.JAVA,
                "public class Solution { public static int solve(int n) { return n; } }",
                "10"
        ));

        assertEquals(ExecutionStatus.RUNTIME_ERROR, result.getStatus());
        assertTrue(result.getMessage().contains("Docker sandbox error"));
    }

    private DockerRunnerProperties testProperties() {
        DockerRunnerProperties properties = new DockerRunnerProperties();
        properties.setBinary("docker");
        properties.setMemoryLimitMb(192);
        properties.setCpuLimit("0.75");
        properties.setCompileTimeoutMs(4_000);
        properties.setJavaImage("eclipse-temurin:17-jdk");
        properties.setPythonImage("python:3.11-alpine");
        properties.setCppImage("gcc:13");
        return properties;
    }

    private void assertCommandEndsWith(List<String> command, String... expectedSuffix) {
        List<String> suffix = command.subList(command.size() - expectedSuffix.length, command.size());
        assertEquals(List.of(expectedSuffix), suffix);
    }

    private static final class CapturingExecutor implements DockerSandboxCodeRunner.DockerCommandExecutor {

        private final List<ProcessExecutionSupport.ProcessOutcome> outcomes;
        private final List<List<String>> commands = new ArrayList<>();
        private final List<Duration> timeouts = new ArrayList<>();
        private final List<String> stdins = new ArrayList<>();
        private int index = 0;

        private CapturingExecutor(ProcessExecutionSupport.ProcessOutcome... outcomes) {
            this.outcomes = Arrays.asList(outcomes);
        }

        @Override
        public ProcessExecutionSupport.ProcessOutcome execute(
                Path workingDirectory,
                Duration timeout,
                String stdin,
                String... command
        ) {
            commands.add(List.of(command));
            timeouts.add(timeout);
            stdins.add(stdin);
            return outcomes.get(index++);
        }
    }
}
