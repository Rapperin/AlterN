package com.altern.testcase.mapper;

import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseResponse;
import com.altern.testcase.entity.TestCase;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TestCaseMapper {
    
    TestCaseResponse toResponse(TestCase testCase);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "problem", ignore = true)
    TestCase toEntity(TestCaseCreateRequest request);
}
