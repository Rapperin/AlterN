package com.altern.submission.service;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.entity.Submission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.altern.common.SubmissionNotFoundException;
import java.util.ArrayList;
import java.util.List;
import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.mapper.SubmissionMapper;
import com.altern.submission.dto.SubmissionCreateRequest;
import com.altern.problem.service.ProblemService;
import com.altern.submission.entity.ProgrammingLanguage;
import com.altern.common.InvalidProgrammingLanguageException;
@Service
@RequiredArgsConstructor

public class SubmissionService {
    
    private final ProblemService problemService;
    private final SubmissionMapper submissionMapper;
    private final List<Submission> submissions = new ArrayList<>();
    
    public Submission addSubmission(Submission submission) {
        submission.setId((long) (submissions.size() + 1));
        
        if (submission.getSourceCode() != null &&
                submission.getSourceCode().contains("class Solution")) {
            submission.setStatus(SubmissionStatus.ACCEPTED);
        } else {
            submission.setStatus(SubmissionStatus.WRONG_ANSWER);
        }
        
        submissions.add(submission);
        return submission;
    }
    
    public List<SubmissionResponse> getSubmissions() {
        return submissions.stream()
                .map(submissionMapper::toResponse)
                .toList();
    }
    public SubmissionResponse getSubmissionById(Long id) {
        Submission submission = submissions.stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new SubmissionNotFoundException(id));
        
        return submissionMapper.toResponse(submission);
    }
 
    public SubmissionResponse createSubmission(Submission submission) {
        Submission created = addSubmission(submission);
        return submissionMapper.toResponse(submission);
    }
    
    public SubmissionResponse createSubmission(SubmissionCreateRequest request) {
        problemService.getProblemById(request.getProblemId());
        Submission submission = new Submission();
        submission.setProblemId(request.getProblemId());
        try {
            submission.setLanguage(ProgrammingLanguage.valueOf(request.getLanguage().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new InvalidProgrammingLanguageException(request.getLanguage());
        }
        submission.setSourceCode(request.getSourceCode());
        
        Submission created = addSubmission(submission);
        return submissionMapper.toResponse(created);
    }
    
}