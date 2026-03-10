package com.altern.submission.mapper;

import com.altern.submission.dto.SubmissionResponse;
import com.altern.submission.entity.Submission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {
    
    @Mapping(target = "language", expression = "java(submission.getLanguage().name())")
    @Mapping(target = "status", expression = "java(submission.getStatus().name())")
    SubmissionResponse toResponse(Submission submission);
}