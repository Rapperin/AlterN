package com.altern.submission.entity;

import com.altern.auth.entity.UserAccount;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;
    
    @Enumerated(EnumType.STRING)
    private ProgrammingLanguage language;
    
    @Column(length = 5000)
    private String sourceCode;
    
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;
    
    private LocalDateTime createdAt;
    
    private Integer passedTestCount;
    private Integer totalTestCount;
    private LocalDateTime judgedAt;
    private Integer executionTime;
    private Integer memoryUsage;

    @Column(length = 2000)
    private String verdictMessage;

    private Integer failedTestIndex;
    private Boolean failedVisibleCase;

    @Column(length = 2000)
    private String failedInputPreview;

    @Column(length = 2000)
    private String failedExpectedOutputPreview;

    @Column(length = 2000)
    private String failedActualOutputPreview;
}
