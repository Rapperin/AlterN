package com.altern.problem.mapper;

import com.altern.problem.dto.ProblemExamplePayload;
import com.altern.problem.dto.ProblemResponse;
import com.altern.problem.entity.Problem;
import com.altern.problem.entity.ProblemExampleValue;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ProblemMapper {

    public ProblemResponse toResponse(Problem problem) {
        if (problem == null) {
            return null;
        }

        ProblemResponse response = new ProblemResponse();
        response.setId(problem.getId());
        response.setTitle(problem.getTitle());
        response.setDescription(problem.getDescription());
        response.setConstraints(problem.getConstraints());
        response.setInputFormat(problem.getInputFormat());
        response.setOutputFormat(problem.getOutputFormat());
        response.setHintTitle(problem.getHintTitle());
        response.setHintContent(problem.getHintContent());
        response.setEditorialTitle(problem.getEditorialTitle());
        response.setEditorialContent(problem.getEditorialContent());
        response.setDifficulty(problem.getDifficulty() == null ? null : problem.getDifficulty().name());
        response.setTimeLimitMs(problem.resolveTimeLimitMs());
        response.setMemoryLimitMb(problem.resolveMemoryLimitMb());
        response.setTags(problem.getTags() == null ? new ArrayList<>() : new ArrayList<>(problem.getTags()));
        response.setExamples(toExamplePayloads(problem.getExamples()));
        response.setStarterCodes(toStarterCodes(problem));
        response.setSubmissionCount(problem.getSubmissions() == null ? 0 : problem.getSubmissions().size());
        return response;
    }

    public ProblemExamplePayload toExamplePayload(ProblemExampleValue value) {
        if (value == null) {
            return null;
        }

        ProblemExamplePayload payload = new ProblemExamplePayload();
        payload.setInput(value.getInput());
        payload.setOutput(value.getOutput());
        payload.setExplanation(value.getExplanation());
        return payload;
    }

    private List<ProblemExamplePayload> toExamplePayloads(List<ProblemExampleValue> values) {
        if (values == null || values.isEmpty()) {
            return new ArrayList<>();
        }

        List<ProblemExamplePayload> payloads = new ArrayList<>(values.size());
        for (ProblemExampleValue value : values) {
            ProblemExamplePayload payload = toExamplePayload(value);
            if (payload != null) {
                payloads.add(payload);
            }
        }
        return payloads;
    }

    private Map<String, String> toStarterCodes(Problem problem) {
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
