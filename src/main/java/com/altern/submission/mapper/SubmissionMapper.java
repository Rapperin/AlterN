package com.altern.submission.mapper;

import com.altern.submission.dto.SubmissionDetailResponse;
import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.entity.Submission;
import org.springframework.stereotype.Component;

@Component
public class SubmissionMapper {

    public SubmissionResponse toResponse(Submission submission) {
        if (submission == null) {
            return null;
        }

        SubmissionResponse response = new SubmissionResponse();
        applyBaseFields(submission, response);
        return response;
    }

    public SubmissionDetailResponse toDetailResponse(Submission submission) {
        if (submission == null) {
            return null;
        }

        SubmissionDetailResponse response = new SubmissionDetailResponse();
        applyBaseFields(submission, response);
        response.setSourceCode(submission.getSourceCode());
        response.setFailedTestIndex(submission.getFailedTestIndex());
        response.setFailedVisible(submission.getFailedVisibleCase());
        response.setFailedInputPreview(submission.getFailedInputPreview());
        response.setFailedExpectedOutputPreview(submission.getFailedExpectedOutputPreview());
        response.setFailedActualOutputPreview(submission.getFailedActualOutputPreview());
        return response;
    }

    private void applyBaseFields(Submission submission, SubmissionResponse response) {
        response.setId(submission.getId());
        response.setProblemId(submission.getProblem() == null ? null : submission.getProblem().getId());
        response.setLanguage(submission.getLanguage() == null ? null : submission.getLanguage().name());
        response.setStatus(submission.getStatus() == null ? null : submission.getStatus().name());
        response.setCreatedAt(submission.getCreatedAt());
        response.setJudgedAt(submission.getJudgedAt());
        response.setPassedTestCount(submission.getPassedTestCount());
        response.setTotalTestCount(submission.getTotalTestCount());
        response.setProblemTitle(submission.getProblem() == null ? null : submission.getProblem().getTitle());
        response.setExecutionTime(submission.getExecutionTime());
        response.setMemoryUsage(submission.getMemoryUsage());
        response.setVerdictMessage(submission.getVerdictMessage());
    }
}
