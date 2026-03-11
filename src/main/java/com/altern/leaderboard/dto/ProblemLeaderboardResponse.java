package com.altern.leaderboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProblemLeaderboardResponse {

    private Long problemId;
    private String problemTitle;
    private Integer totalAcceptedUsers;
    private Integer totalAcceptedSubmissions;
    private List<ProblemLeaderboardEntryResponse> entries;
}
