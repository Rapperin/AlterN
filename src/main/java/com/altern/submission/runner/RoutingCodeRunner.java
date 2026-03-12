package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class RoutingCodeRunner implements CodeRunner {

    private final RunnerHealthService runnerHealthService;
    private final DockerSandboxCodeRunner dockerSandboxCodeRunner;
    private final JavaProcessCodeRunner javaProcessCodeRunner;
    private final PythonProcessCodeRunner pythonProcessCodeRunner;
    private final CppProcessCodeRunner cppProcessCodeRunner;
    private final MockCodeRunner mockCodeRunner;

    public RoutingCodeRunner(
            RunnerHealthService runnerHealthService,
            DockerSandboxCodeRunner dockerSandboxCodeRunner,
            JavaProcessCodeRunner javaProcessCodeRunner,
            PythonProcessCodeRunner pythonProcessCodeRunner,
            CppProcessCodeRunner cppProcessCodeRunner,
            MockCodeRunner mockCodeRunner
    ) {
        this.runnerHealthService = runnerHealthService;
        this.dockerSandboxCodeRunner = dockerSandboxCodeRunner;
        this.javaProcessCodeRunner = javaProcessCodeRunner;
        this.pythonProcessCodeRunner = pythonProcessCodeRunner;
        this.cppProcessCodeRunner = cppProcessCodeRunner;
        this.mockCodeRunner = mockCodeRunner;
    }

    @Override
    public ExecutionResult run(ExecutionRequest request) {
        if (runnerHealthService.shouldUseDockerSandbox() && supportsDockerSandbox(request.getLanguage())) {
            return dockerSandboxCodeRunner.run(request);
        }
        if (request.getLanguage() == ProgrammingLanguage.JAVA) {
            return javaProcessCodeRunner.run(request);
        }
        if (request.getLanguage() == ProgrammingLanguage.PYTHON) {
            return pythonProcessCodeRunner.run(request);
        }
        if (request.getLanguage() == ProgrammingLanguage.CPP) {
            return cppProcessCodeRunner.run(request);
        }

        ExecutionResult mockResult = mockCodeRunner.run(request);
        return new ExecutionResult(
                mockResult.getStatus(),
                mockResult.getOutput(),
                mockResult.getExecutionTime(),
                mockResult.getMemoryUsage(),
                "Real execution currently supports JAVA, PYTHON, and CPP. Mock runner used for "
                        + request.getLanguage() + "."
        );
    }

    private boolean supportsDockerSandbox(ProgrammingLanguage language) {
        return language == ProgrammingLanguage.JAVA
                || language == ProgrammingLanguage.PYTHON
                || language == ProgrammingLanguage.CPP;
    }
}
