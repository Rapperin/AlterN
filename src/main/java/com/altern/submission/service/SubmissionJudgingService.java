package com.altern.submission.service;

import com.altern.common.SubmissionNotFoundException;
import com.altern.problem.entity.Problem;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.judge.JudgeResult;
import com.altern.submission.judge.JudgeService;
import com.altern.submission.repository.SubmissionRepository;
import com.altern.testcase.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SubmissionJudgingService {

    private final JudgeService judgeService;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional
    public Submission evaluateSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new SubmissionNotFoundException(submissionId));

        JudgeResult judgeResult = runJudge(submission);
        applyJudgeResult(submission, judgeResult);
        return submissionRepository.save(submission);
    }

    @Transactional
    public Submission markSubmissionAsInternalError(Long submissionId, String message) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new SubmissionNotFoundException(submissionId));
        submission.setStatus(SubmissionStatus.RUNTIME_ERROR);
        submission.setPassedTestCount(0);
        submission.setTotalTestCount(testCaseRepository.findByProblem_Id(submission.getProblem().getId()).size());
        submission.setExecutionTime(0);
        submission.setMemoryUsage(0);
        submission.setVerdictMessage(message);
        submission.setFailedTestIndex(null);
        submission.setFailedVisibleCase(null);
        submission.setFailedInputPreview(null);
        submission.setFailedExpectedOutputPreview(null);
        submission.setFailedActualOutputPreview(null);
        submission.setJudgedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    private JudgeResult runJudge(Submission submission) {
        var testCases = testCaseRepository.findByProblem_Id(submission.getProblem().getId());
        return judgeService.judge(
                testCases,
                submission.getLanguage(),
                submission.getSourceCode(),
                resolveTimeLimitMs(submission.getProblem()),
                resolveMemoryLimitMb(submission.getProblem())
        );
    }

    private void applyJudgeResult(Submission submission, JudgeResult judgeResult) {
        submission.setPassedTestCount(judgeResult.getPassedTestCount());
        submission.setTotalTestCount(judgeResult.getTotalTestCount());
        submission.setExecutionTime(judgeResult.getExecutionTime());
        submission.setMemoryUsage(judgeResult.getMemoryUsage());
        submission.setVerdictMessage(judgeResult.getVerdictMessage());
        submission.setFailedTestIndex(judgeResult.getFailedTestIndex());
        submission.setFailedVisibleCase(judgeResult.getFailedVisible());
        submission.setFailedInputPreview(judgeResult.getFailedInputPreview());
        submission.setFailedExpectedOutputPreview(judgeResult.getFailedExpectedOutputPreview());
        submission.setFailedActualOutputPreview(judgeResult.getFailedActualOutputPreview());
        submission.setStatus(judgeResult.getStatus());
        submission.setJudgedAt(LocalDateTime.now());
    }

    private int resolveTimeLimitMs(Problem problem) {
        return problem == null ? Problem.DEFAULT_TIME_LIMIT_MS : problem.resolveTimeLimitMs();
    }

    private int resolveMemoryLimitMb(Problem problem) {
        return problem == null ? Problem.DEFAULT_MEMORY_LIMIT_MB : problem.resolveMemoryLimitMb();
    }
}
