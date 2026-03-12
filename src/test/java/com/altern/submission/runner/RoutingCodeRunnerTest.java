package com.altern.submission.runner;

import com.altern.submission.entity.ProgrammingLanguage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RoutingCodeRunnerTest {

    @Test
    void usesDockerSandboxWhenEnabled() {
        RunnerHealthService runnerHealthService = mock(RunnerHealthService.class);
        DockerSandboxCodeRunner dockerSandboxCodeRunner = mock(DockerSandboxCodeRunner.class);
        JavaProcessCodeRunner javaProcessCodeRunner = mock(JavaProcessCodeRunner.class);
        PythonProcessCodeRunner pythonProcessCodeRunner = mock(PythonProcessCodeRunner.class);
        CppProcessCodeRunner cppProcessCodeRunner = mock(CppProcessCodeRunner.class);
        MockCodeRunner mockCodeRunner = mock(MockCodeRunner.class);

        RoutingCodeRunner routingCodeRunner = new RoutingCodeRunner(
                runnerHealthService,
                dockerSandboxCodeRunner,
                javaProcessCodeRunner,
                pythonProcessCodeRunner,
                cppProcessCodeRunner,
                mockCodeRunner
        );
        ExecutionRequest request = new ExecutionRequest(ProgrammingLanguage.JAVA, "class Solution {}", "10");
        ExecutionResult expected = ExecutionResult.success("23", 12, 192, null);
        when(runnerHealthService.shouldUseDockerSandbox()).thenReturn(true);
        when(dockerSandboxCodeRunner.run(request)).thenReturn(expected);

        ExecutionResult result = routingCodeRunner.run(request);

        assertEquals(expected, result);
        verify(dockerSandboxCodeRunner).run(request);
        verifyNoInteractions(javaProcessCodeRunner, pythonProcessCodeRunner, cppProcessCodeRunner, mockCodeRunner);
    }

    @Test
    void usesLocalRunnerWhenDockerSandboxIsDisabled() {
        RunnerHealthService runnerHealthService = mock(RunnerHealthService.class);
        DockerSandboxCodeRunner dockerSandboxCodeRunner = mock(DockerSandboxCodeRunner.class);
        JavaProcessCodeRunner javaProcessCodeRunner = mock(JavaProcessCodeRunner.class);
        PythonProcessCodeRunner pythonProcessCodeRunner = mock(PythonProcessCodeRunner.class);
        CppProcessCodeRunner cppProcessCodeRunner = mock(CppProcessCodeRunner.class);
        MockCodeRunner mockCodeRunner = mock(MockCodeRunner.class);

        RoutingCodeRunner routingCodeRunner = new RoutingCodeRunner(
                runnerHealthService,
                dockerSandboxCodeRunner,
                javaProcessCodeRunner,
                pythonProcessCodeRunner,
                cppProcessCodeRunner,
                mockCodeRunner
        );
        ExecutionRequest request = new ExecutionRequest(ProgrammingLanguage.PYTHON, "print(23)", "10");
        ExecutionResult expected = ExecutionResult.success("23", 8, 64, null);
        when(runnerHealthService.shouldUseDockerSandbox()).thenReturn(false);
        when(pythonProcessCodeRunner.run(request)).thenReturn(expected);

        ExecutionResult result = routingCodeRunner.run(request);

        assertEquals(expected, result);
        verify(pythonProcessCodeRunner).run(request);
        verifyNoInteractions(dockerSandboxCodeRunner, javaProcessCodeRunner, cppProcessCodeRunner, mockCodeRunner);
    }
}
