package com.altern.dashboard.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DashboardActivityDayResponse {

    private LocalDate date;
    private Integer submissions;
    private Integer accepted;
}
