package com.altern.problem.mapper;

import com.altern.problem.dto.ProblemExamplePayload;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.ProblemExampleValue;
import com.altern.problem.entity.Problem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.LinkedHashMap;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface ProblemMapper {
    
    @Mapping(target = "difficulty", expression = "java(problem.getDifficulty() == null ? null : problem.getDifficulty().name())")
    @Mapping(target = "timeLimitMs", expression = "java(problem.resolveTimeLimitMs())")
    @Mapping(target = "memoryLimitMb", expression = "java(problem.resolveMemoryLimitMb())")
    @Mapping(target = "submissionCount", expression = "java(problem.getSubmissions() == null ? 0 : problem.getSubmissions().size())")
    @Mapping(target = "starterCodes", expression = "java(toStarterCodes(problem))")
    @Mapping(target = "hintAvailable", ignore = true)
    @Mapping(target = "hintUnlocked", ignore = true)
    @Mapping(target = "editorialAvailable", ignore = true)
    @Mapping(target = "editorialUnlocked", ignore = true)
    @Mapping(target = "viewerSolved", ignore = true)
    @Mapping(target = "viewerBookmarked", ignore = true)
    @Mapping(target = "viewerStatus", ignore = true)
    @Mapping(target = "testCaseCount", ignore = true)
    @Mapping(target = "bestSubmissionStatus", ignore = true)
    ProblemResponse toResponse(Problem problem);

    ProblemExamplePayload toExamplePayload(ProblemExampleValue value);

    default Map<String, String> toStarterCodes(Problem problem) {
        Map<String, String> starterCodes = new LinkedHashMap<>();

        if (problem.getStarterCodeJava() != null && !problem.getStarterCodeJava().isBlank()) {
            starterCodes.put("JAVA", problem.getStarterCodeJava());
        }
        if (problem.getStarterCodePython() != null && !problem.getStarterCodePython().isBlank()) {
            starterCodes.put("PYTHON", problem.getStarterCodePython());
        }
        if (problem.getStarterCodeCpp() != null && !problem.getStarterCodeCpp().isBlank()) {
            starterCodes.put("CPP", problem.getStarterCodeCpp());
        }

        return starterCodes;
    }
}
