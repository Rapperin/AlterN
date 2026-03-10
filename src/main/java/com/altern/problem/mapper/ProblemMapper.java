package com.altern.problem.mapper;

import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.Problem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProblemMapper {
    
    ProblemResponse toResponse(Problem problem);
    
}