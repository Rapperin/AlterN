package com.altern.problem.entity;
import com.altern.submission.entity.Submission;
import java.util.List;

import com.altern.testcase.entity.TestCase;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Setter
@Entity
@Table(name = "problems")
public class Problem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;
    
    @JsonIgnore
    @OneToMany(mappedBy = "problem")
    private List<Submission> submissions;
    
    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL)
    private List<TestCase> testCases;
}