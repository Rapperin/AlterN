# AlterN

AlterN is a backend-first coding challenge platform inspired by Project Euler.
Users can browse problems, submit solutions, and get evaluated results.

## Features

- List coding problems
- Get problem by id
- Create new problems
- Create submissions
- List submissions
- Get submission by id
- Validation support
- Global exception handling
- Swagger / OpenAPI documentation
- DTO-based API design
- MapStruct-based object mapping

## Tech Stack

- Java 17
- Spring Boot
- Maven
- Lombok
- MapStruct
- Spring Validation
- Springdoc OpenAPI

## API Endpoints

### Health
- `GET /api/health`

### Problems
- `GET /api/problems`
- `GET /api/problems/{id}`
- `POST /api/problems`

### Submissions
- `GET /api/submissions`
- `GET /api/submissions/{id}`
- `POST /api/submissions`

## Swagger

Swagger UI:
```text
http://localhost:8080/swagger