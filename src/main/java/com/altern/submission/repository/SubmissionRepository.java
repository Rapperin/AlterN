package com.altern.submission.repository;

import com.altern.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import com.altern.submission.entity.ProgrammingLanguage;
import java.util.List;
import java.util.Optional;
import com.altern.submission.entity.SubmissionStatus;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByLanguage(ProgrammingLanguage language);
    List<Submission> findByStatus(SubmissionStatus status);
    List<Submission> findByProblem_Id(Long problemId);
    List<Submission> findByProblem_IdAndStatus(Long problemId, SubmissionStatus status);
    List<Submission> findByUser_Id(Long userId);
    List<Submission> findByUser_IdAndLanguage(Long userId, ProgrammingLanguage language);
    List<Submission> findByUser_IdAndStatus(Long userId, SubmissionStatus status);
    List<Submission> findByUser_IdAndProblem_Id(Long userId, Long problemId);
    Optional<Submission> findByIdAndUser_Id(Long id, Long userId);
    Optional<Submission> findFirstByUser_IdAndProblem_IdOrderByCreatedAtDescIdDesc(Long userId, Long problemId);
    long countByProblem_Id(Long problemId);
    boolean existsByProblem_IdAndUser_Id(Long problemId, Long userId);
    boolean existsByProblem_IdAndStatus(Long problemId, SubmissionStatus status);
    boolean existsByProblem_IdAndUser_IdAndStatus(Long problemId, Long userId, SubmissionStatus status);
    
}
