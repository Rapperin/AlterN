package com.altern.testcase.entity;
import com.altern.problem.entity.Problem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "test_cases")
@Getter
@Setter
public class TestCase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String input;
    
    private String expectedOutput;

    @Column(columnDefinition = "boolean default false")
    private Boolean hidden;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id")
    private Problem problem;

    @PrePersist
    void applyDefaults() {
        if (hidden == null) {
            hidden = false;
        }
    }
}
