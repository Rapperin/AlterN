package com.altern.achievement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JourneyGoalResponse {

    private String code;
    private String title;
    private String description;
    private Integer currentValue;
    private Integer targetValue;
    private String unit;
}
