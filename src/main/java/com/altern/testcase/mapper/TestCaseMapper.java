package com.altern.testcase.mapper;

import com.altern.testcase.dto.TestCaseCreateRequest;
import com.altern.testcase.dto.TestCaseResponse;
import com.altern.testcase.entity.TestCase;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TestCaseMapper {
    
    TestCaseResponse toResponse(TestCase testCase);
    
    TestCase toEntity(TestCaseCreateRequest request);
}