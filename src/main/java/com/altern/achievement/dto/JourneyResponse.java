package com.altern.achievement.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class JourneyResponse {

    private Integer level;
    private String title;
    private Integer solvedProblems;
    private Integer nextLevel;
    private String nextTitle;
    private Integer nextSolvedTarget;
    private Integer progressPercent;
    private boolean maxLevel;
    private List<JourneyGoalResponse> nextGoals;
}
