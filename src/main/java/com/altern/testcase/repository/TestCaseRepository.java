package com.altern.testcase.repository;

import com.altern.testcase.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    
    List<TestCase> findByProblem_Id(Long problemId);
    long countByProblem_Id(Long problemId);
}