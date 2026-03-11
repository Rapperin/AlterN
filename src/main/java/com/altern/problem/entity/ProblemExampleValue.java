package com.altern.problem.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Embeddable
public class ProblemExampleValue {

    @Column(name = "example_input", length = 2000, nullable = false)
    private String input;

    @Column(name = "example_output", length = 2000, nullable = false)
    private String output;

    @Column(name = "example_explanation", length = 2000)
    private String explanation;
}
