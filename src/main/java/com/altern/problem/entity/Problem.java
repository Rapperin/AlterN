package com.altern.problem.entity;
import com.altern.submission.entity.Submission;
import java.util.List;
import java.util.ArrayList;

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

    public static final int DEFAULT_TIME_LIMIT_MS = 5000;
    public static final int DEFAULT_MEMORY_LIMIT_MB = 256;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @Column(length = 2000)
    private String description;

    @Column(name = "constraints_text", length = 3000)
    private String constraints;

    @Column(name = "input_format", length = 2000)
    private String inputFormat;

    @Column(name = "output_format", length = 2000)
    private String outputFormat;

    @Column(name = "hint_title", length = 255)
    private String hintTitle;

    @Column(name = "hint_content", length = 6000)
    private String hintContent;

    @Column(name = "editorial_title", length = 255)
    private String editorialTitle;

    @Column(name = "editorial_content", length = 12000)
    private String editorialContent;
    
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private Integer timeLimitMs;

    private Integer memoryLimitMb;

    @Column(name = "starter_code_java", length = 8000)
    private String starterCodeJava;

    @Column(name = "starter_code_python", length = 8000)
    private String starterCodePython;

    @Column(name = "starter_code_cpp", length = 8000)
    private String starterCodeCpp;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_tags", joinColumns = @JoinColumn(name = "problem_id"))
    @OrderColumn(name = "tag_order")
    @Column(name = "tag", nullable = false, length = 50)
    private List<String> tags = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "problem_examples", joinColumns = @JoinColumn(name = "problem_id"))
    @OrderColumn(name = "example_order")
    private List<ProblemExampleValue> examples = new ArrayList<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "problem")
    private List<Submission> submissions;
    
    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL)
    private List<TestCase> testCases;

    public int resolveTimeLimitMs() {
        return timeLimitMs == null || timeLimitMs < 1 ? DEFAULT_TIME_LIMIT_MS : timeLimitMs;
    }

    public int resolveMemoryLimitMb() {
        return memoryLimitMb == null || memoryLimitMb < 1 ? DEFAULT_MEMORY_LIMIT_MB : memoryLimitMb;
    }

    @PrePersist
    @PreUpdate
    void applyDefaults() {
        timeLimitMs = resolveTimeLimitMs();
        memoryLimitMb = resolveMemoryLimitMb();
        if (tags == null) {
            tags = new ArrayList<>();
        }
        if (examples == null) {
            examples = new ArrayList<>();
        }
    }
}
