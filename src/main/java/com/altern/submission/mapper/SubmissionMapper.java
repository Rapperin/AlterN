package com.altern.submission.mapper;

import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.entity.Submission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {
    
    @Mapping(target = "problemId", source = "problem.id")
    @Mapping(target = "language", expression = "java(submission.getLanguage().name())")
    @Mapping(target = "status", expression = "java(submission.getStatus().name())")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "problemTitle", source = "problem.title")
    SubmissionResponse toResponse(Submission submission);
}