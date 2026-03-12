package com.altern.bookmark.repository;

import com.altern.bookmark.entity.ProblemBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProblemBookmarkRepository extends JpaRepository<ProblemBookmark, Long> {

    boolean existsByUser_IdAndProblem_Id(Long userId, Long problemId);

    Optional<ProblemBookmark> findByUser_IdAndProblem_Id(Long userId, Long problemId);

    List<ProblemBookmark> findByUser_IdOrderByCreatedAtDesc(Long userId);

    void deleteByProblem_Id(Long problemId);
}
