package com.altern.problem.mapper;

import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.Problem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProblemMapper {
    
    @Mapping(target = "difficulty", expression = "java(problem.getDifficulty().name())")
    @Mapping(target = "submissionCount", expression = "java(problem.getSubmissions() == null ? 0 : problem.getSubmissions().size())")
    ProblemResponse toResponse(Problem problem);
}