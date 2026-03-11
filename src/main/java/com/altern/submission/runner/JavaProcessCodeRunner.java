package com.altern.submission.runner;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

@Component
public class JavaProcessCodeRunner {

    private static final Duration DEFAULT_COMPILE_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration DEFAULT_RUN_TIMEOUT = Duration.ofSeconds(5);
    private static final int DEFAULT_MEMORY_USAGE_MB = 64;
    private final Duration compileTimeout;
    private final Duration runTimeout;

    public JavaProcessCodeRunner() {
        this(DEFAULT_COMPILE_TIMEOUT, DEFAULT_RUN_TIMEOUT);
    }

    JavaProcessCodeRunner(Duration compileTimeout, Duration runTimeout) {
        this.compileTimeout = compileTimeout;
        this.runTimeout = runTimeout;
    }

    public ExecutionResult run(ExecutionRequest request) {
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("altern-java-runner-");
            Files.writeString(tempDir.resolve("Solution.java"), request.getSourceCode(), StandardCharsets.UTF_8);
            Files.writeString(tempDir.resolve("RunnerHarness.java"), runnerHarnessSource(), StandardCharsets.UTF_8);

            ProcessExecutionSupport.ProcessOutcome compileResult = ProcessExecutionSupport.execute(
                    tempDir,
                    compileTimeout,
                    null,
                    "javac",
                    "Solution.java",
                    "RunnerHarness.java"
            );
            if (compileResult.timedOut()) {
                return ExecutionResult.compilationError("Compilation timed out.");
            }
            if (compileResult.exitCode() != 0) {
                return ExecutionResult.compilationError(ProcessExecutionSupport.cleanMessage(compileResult.stderr()));
            }

            long startedAt = System.nanoTime();
            ProcessExecutionSupport.ProcessOutcome runResult = ProcessExecutionSupport.execute(
                    tempDir,
                    resolveRunTimeout(request),
                    request.getInput(),
                    "java",
                    "-cp",
                    tempDir.toString(),
                    "RunnerHarness"
            );
            int executionTime = ProcessExecutionSupport.elapsedMillis(startedAt);

            if (runResult.timedOut()) {
                return ExecutionResult.timeLimitExceeded("Execution timed out.", executionTime, DEFAULT_MEMORY_USAGE_MB);
            }
            if (runResult.exitCode() != 0) {
                return ExecutionResult.runtimeError(
                        ProcessExecutionSupport.cleanMessage(runResult.stderr()),
                        executionTime,
                        DEFAULT_MEMORY_USAGE_MB
                );
            }

            return ExecutionResult.success(runResult.stdout().trim(), executionTime, DEFAULT_MEMORY_USAGE_MB, null);
        } catch (IOException e) {
            return ExecutionResult.runtimeError("Runner IO error: " + e.getMessage(), 0, 0);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ExecutionResult.runtimeError("Runner interrupted.", 0, 0);
        } finally {
            ProcessExecutionSupport.deleteDirectoryQuietly(tempDir);
        }
    }

    private String runnerHarnessSource() {
        return """
                import java.io.ByteArrayInputStream;
                import java.lang.reflect.InvocationTargetException;
                import java.lang.reflect.Method;
                import java.lang.reflect.Modifier;
                import java.nio.charset.StandardCharsets;

                public class RunnerHarness {

                    public static void main(String[] args) {
                        try {
                            byte[] rawInput = System.in.readAllBytes();
                            String input = new String(rawInput, StandardCharsets.UTF_8).trim();

                            Class<?> solutionClass = Class.forName("Solution");
                            Method solveMethod = findSolveMethod(solutionClass);
                            if (solveMethod != null) {
                                solveMethod.setAccessible(true);
                                Object target = Modifier.isStatic(solveMethod.getModifiers())
                                        ? null
                                        : solutionClass.getDeclaredConstructor().newInstance();
                                Object argument = adaptInput(input, solveMethod.getParameterTypes()[0]);
                                Object result = solveMethod.invoke(target, argument);
                                if (result != null) {
                                    System.out.print(String.valueOf(result));
                                }
                                return;
                            }

                            Method mainMethod = solutionClass.getMethod("main", String[].class);
                            System.setIn(new ByteArrayInputStream(rawInput));
                            mainMethod.invoke(null, (Object) new String[0]);
                        } catch (InvocationTargetException ex) {
                            Throwable cause = ex.getTargetException();
                            if (cause != null) {
                                cause.printStackTrace(System.err);
                            } else {
                                ex.printStackTrace(System.err);
                            }
                            System.exit(1);
                        } catch (Exception ex) {
                            ex.printStackTrace(System.err);
                            System.exit(1);
                        }
                    }

                    private static Method findSolveMethod(Class<?> solutionClass) {
                        Class<?>[] preferredTypes = new Class<?>[] {
                                String.class,
                                int.class,
                                Integer.class,
                                long.class,
                                Long.class
                        };

                        for (Class<?> parameterType : preferredTypes) {
                            for (Method method : solutionClass.getDeclaredMethods()) {
                                if (!method.getName().equals("solve")) {
                                    continue;
                                }
                                if (method.getParameterCount() != 1) {
                                    continue;
                                }
                                if (method.getParameterTypes()[0].equals(parameterType)) {
                                    return method;
                                }
                            }
                        }

                        return null;
                    }

                    private static Object adaptInput(String input, Class<?> parameterType) {
                        if (parameterType.equals(String.class)) {
                            return input;
                        }
                        if (parameterType.equals(int.class) || parameterType.equals(Integer.class)) {
                            return Integer.parseInt(input);
                        }
                        if (parameterType.equals(long.class) || parameterType.equals(Long.class)) {
                            return Long.parseLong(input);
                        }
                        return input;
                    }
                }
                """;
    }

    private Duration resolveRunTimeout(ExecutionRequest request) {
        Integer customTimeLimitMs = request.getTimeLimitMs();
        if (customTimeLimitMs == null || customTimeLimitMs < 1) {
            return runTimeout;
        }

        return Duration.ofMillis(customTimeLimitMs);
    }
}
