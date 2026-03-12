package com.altern.submission.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "altern.judge.async")
public class JudgeAsyncProperties {

    private boolean enabled = false;
    private int poolSize = 2;
}
