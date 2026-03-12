package com.altern.submission.service;

import com.altern.submission.dto.JudgeQueueHealthResponse;
import com.altern.submission.entity.Submission;
import com.altern.submission.entity.SubmissionStatus;
import com.altern.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class JudgeQueueHealthService {

    private final SubmissionRepository submissionRepository;

    public JudgeQueueHealthResponse getQueueHealth() {
        int pendingSubmissions = Math.toIntExact(submissionRepository.countByStatus(SubmissionStatus.PENDING));
        Submission oldestPending = submissionRepository.findFirstByStatusOrderByCreatedAtAscIdAsc(SubmissionStatus.PENDING)
                .orElse(null);

        LocalDateTime oldestCreatedAt = oldestPending == null ? null : oldestPending.getCreatedAt();
        Long oldestAgeSeconds = oldestCreatedAt == null
                ? null
                : Math.max(Duration.between(oldestCreatedAt, LocalDateTime.now()).getSeconds(), 0);

        return new JudgeQueueHealthResponse(
                pendingSubmissions,
                oldestPending == null ? null : oldestPending.getId(),
                oldestCreatedAt,
                oldestAgeSeconds,
                resolvePressure(pendingSubmissions, oldestAgeSeconds),
                resolveMessage(pendingSubmissions, oldestAgeSeconds)
        );
    }

    private String resolvePressure(int pendingSubmissions, Long oldestAgeSeconds) {
        if (pendingSubmissions < 1) {
            return "IDLE";
        }
        if (pendingSubmissions >= 5 || (oldestAgeSeconds != null && oldestAgeSeconds >= 30)) {
            return "BACKLOGGED";
        }
        return "ACTIVE";
    }

    private String resolveMessage(int pendingSubmissions, Long oldestAgeSeconds) {
        if (pendingSubmissions < 1) {
            return "Judge queue is empty.";
        }
        if (pendingSubmissions == 1) {
            return oldestAgeSeconds == null
                    ? "1 submission is waiting for verdict."
                    : "1 submission is waiting for verdict. Oldest age: " + oldestAgeSeconds + "s.";
        }
        if (oldestAgeSeconds == null) {
            return pendingSubmissions + " submissions are waiting for verdict.";
        }
        return pendingSubmissions + " submissions are waiting for verdict. Oldest age: " + oldestAgeSeconds + "s.";
    }
}
