package com.altern.submission.mapper;

import com.altern.submission.dto.SubmissionDetailResponse;
import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.entity.Submission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {
    
    @Mapping(target = "problemId", source = "problem.id")
    @Mapping(target = "language", expression = "java(submission.getLanguage() == null ? null : submission.getLanguage().name())")
    @Mapping(target = "status", expression = "java(submission.getStatus() == null ? null : submission.getStatus().name())")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "judgedAt", source = "judgedAt")
    @Mapping(target = "problemTitle", source = "problem.title")
    @Mapping(target = "executionTime", source = "executionTime")
    @Mapping(target = "memoryUsage", source = "memoryUsage")
    @Mapping(target = "verdictMessage", source = "verdictMessage")
    SubmissionResponse toResponse(Submission submission);

    @Mapping(target = "problemId", source = "problem.id")
    @Mapping(target = "language", expression = "java(submission.getLanguage() == null ? null : submission.getLanguage().name())")
    @Mapping(target = "status", expression = "java(submission.getStatus() == null ? null : submission.getStatus().name())")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "judgedAt", source = "judgedAt")
    @Mapping(target = "problemTitle", source = "problem.title")
    @Mapping(target = "executionTime", source = "executionTime")
    @Mapping(target = "memoryUsage", source = "memoryUsage")
    @Mapping(target = "verdictMessage", source = "verdictMessage")
    @Mapping(target = "sourceCode", source = "sourceCode")
    @Mapping(target = "failedTestIndex", source = "failedTestIndex")
    @Mapping(target = "failedVisible", source = "failedVisibleCase")
    @Mapping(target = "failedInputPreview", source = "failedInputPreview")
    @Mapping(target = "failedExpectedOutputPreview", source = "failedExpectedOutputPreview")
    @Mapping(target = "failedActualOutputPreview", source = "failedActualOutputPreview")
    SubmissionDetailResponse toDetailResponse(Submission submission);
}
