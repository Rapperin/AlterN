package com.altern.leaderboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GlobalLeaderboardResponse {

    private Integer totalRankedUsers;
    private Integer totalAcceptedSubmissions;
    private List<GlobalLeaderboardEntryResponse> entries;
}
