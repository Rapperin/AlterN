package com.altern.submission.repository;

import com.altern.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import java.util.List;
import com.altern.submission.entity.SubmissionStatus;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByLanguage(ProgrammingLanguage language);
    List<Submission> findByStatus(SubmissionStatus status);
    List<Submission> findByProblem_Id(Long problemId);
    long countByProblem_Id(Long problemId);
    
}