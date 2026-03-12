package com.altern.submission.runner;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "altern.runner.docker")
public class DockerRunnerProperties {

    private boolean enabled = false;
    private String binary = "docker";
    private int memoryLimitMb = 256;
    private String cpuLimit = "1.0";
    private int compileTimeoutMs = 10_000;
    private String javaImage = "eclipse-temurin:17-jdk";
    private String pythonImage = "python:3.11-alpine";
    private String cppImage = "gcc:13";
}
