package com.altern.common;

import com.altern.submission.config.JudgeAsyncProperties;
import com.altern.submission.service.JudgeQueueHealthService;
import com.altern.submission.runner.RunnerHealthService;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Health", description = "Application health check APIs")
public class HealthController {

    private final RunnerHealthService runnerHealthService;
    private final JudgeAsyncProperties judgeAsyncProperties;
    private final JudgeQueueHealthService judgeQueueHealthService;
    private final Environment environment;

    @Operation(summary = "Health check", description = "Returns application health status")
    @GetMapping("/api/health")
    public HealthResponse health(@RequestParam(defaultValue = "false") boolean refresh) {
        List<String> profiles = Arrays.asList(
                environment.getActiveProfiles().length > 0
                        ? environment.getActiveProfiles()
                        : environment.getDefaultProfiles()
        );

        return new HealthResponse(
                "UP",
                "AlterN",
                profiles,
                judgeAsyncProperties.isEnabled() ? "ASYNC" : "SYNC",
                judgeQueueHealthService.getQueueHealth(),
                refresh ? runnerHealthService.refreshRunnerHealth() : runnerHealthService.getRunnerHealth()
        );
    }
}
