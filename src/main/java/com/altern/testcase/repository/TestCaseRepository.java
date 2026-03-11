package com.altern.testcase.repository;

import com.altern.testcase.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    
    List<TestCase> findByProblem_Id(Long problemId);
    Optional<TestCase> findByIdAndProblem_Id(Long id, Long problemId);
    long countByProblem_Id(Long problemId);

    @Query("""
            select tc
            from TestCase tc
            where tc.problem.id = :problemId
              and (tc.hidden = false or tc.hidden is null)
            """)
    List<TestCase> findVisibleByProblemId(Long problemId);

    @Query("""
            select count(tc)
            from TestCase tc
            where tc.problem.id = :problemId
              and (tc.hidden = false or tc.hidden is null)
            """)
    long countVisibleByProblemId(Long problemId);
}
