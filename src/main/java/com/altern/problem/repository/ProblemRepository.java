package com.altern.problem.repository;
import java.util.List;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByDifficulty(Difficulty difficulty);
    List<Problem> findByTitleContainingIgnoreCase(String title);
}