package com.altern.submission.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.altern.problem.entity.Problem;
import java.time.LocalDateTime;
@Getter
@Setter
@Entity
@Table(name = "submissions")
public class Submission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;
    
    @Enumerated(EnumType.STRING)
    private ProgrammingLanguage language;
    
    @Column(length = 5000)
    private String sourceCode;
    
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;
    
    private LocalDateTime createdAt;
}