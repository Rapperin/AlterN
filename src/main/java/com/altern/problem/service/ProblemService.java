package com.altern.problem.service;
import lombok.RequiredArgsConstructor;
import com.altern.common.ProblemNotFoundException;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import org.springframework.stereotype.Service;
import com.altern.problem.dto.ProblemCreateRequest;
import java.util.ArrayList;
import java.util.List;
import com.altern.problem.mapper.ProblemMapper;
import com.altern.common.InvalidDifficultyException;
@Service

public class ProblemService {
    
    
    private final ProblemMapper problemMapper;
    private final List<Problem> problems = new ArrayList<>();
    
    public ProblemService(ProblemMapper problemMapper) {
        this.problemMapper = problemMapper;
        
        Problem p1 = new Problem();
        p1.setId(1L);
        p1.setTitle("Multiples of 3 and 5");
        p1.setDescription("Find the sum of all multiples of 3 or 5 below 1000");
        p1.setDifficulty(Difficulty.EASY);
        
        Problem p2 = new Problem();
        p2.setId(2L);
        p2.setTitle("Even Fibonacci Numbers");
        p2.setDescription("Find the sum of even Fibonacci numbers");
        p2.setDifficulty(Difficulty.EASY);
        
        problems.add(p1);
        problems.add(p2);
    }
    
    public List<ProblemResponse> getProblems() {
        return problems.stream()
                .map(problemMapper::toResponse)
                .toList();
    }
    
    public ProblemResponse getProblemById(Long id) {
        Problem problem = problems.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ProblemNotFoundException(id));
        
        return problemMapper.toResponse(problem);
    }
    public Problem addProblem(Problem problem) {
        problem.setId((long) (problems.size() + 1));
        problems.add(problem);
        return problem;
    }
   
    public ProblemResponse createProblem(ProblemCreateRequest request) {
        Problem problem = new Problem();
        problem.setId((long) (problems.size() + 1));
        problem.setTitle(request.getTitle());
        problem.setDescription(request.getDescription());
        try {
            problem.setDifficulty(Difficulty.valueOf(request.getDifficulty().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new InvalidDifficultyException(request.getDifficulty());
        }
        
        problems.add(problem);
        
        return problemMapper.toResponse(problem);
    }
}