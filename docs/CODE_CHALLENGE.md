# Task 1 – Generation Retrieval Endpoint & Generation Status Support

This repository implements **Task 1** of the API Code Challenge, focusing on **tracking image generation status** and **retrieving generation results via a GET endpoint**, following best practices with **NestJS**, **Prisma**, and **automated testing**.

---

## ✅ Task 1 Objectives

- Track the lifecycle of an image generation request
- Persist and expose generation status
- Allow clients to query the status and result of a generation
- Provide clear API documentation and test coverage

---

## 🧱 Architectural Overview

The solution is composed of **three isolated services**, communicating via HTTP:

| Service | Responsibility |
|------|--------------|
| **NestJS API** | Main API, persistence, business rules, status handling |
| **Mock AI Server** | Simulates an external AI image generation service |
| **Lambda-like Service** | Simulates async callback behavior |

This separation allows realistic **integration and end-to-end testing**, closely resembling a production setup.

---

## 🗄️ Database Changes (Prisma)

A new column was added to the `generations` table to track the lifecycle of each generation.

### Generation Status Values
- `PENDING` – Generation started but not finished
- `COMPLETE` – Generation finished successfully
- `FAILED` – Generation failed during processing

### Status Flow
1. Generation request is created → `PENDING`
2. External AI call fails → `FAILED`
3. External AI call succeeds → `COMPLETE`

All state transitions are explicitly handled in code.

---

## 🔌 API Endpoints

### `POST /api/generation`

Starts a new image generation request.

**Behavior**
- Persists the prompt
- Sets initial status as `PENDING`
- Triggers async image generation process

---

### `GET /api/generation/{generationId}`

Retrieves the current state and result of a generation.

**Response Behavior**
- `PENDING` → returns status and prompt
- `FAILED` → returns status and prompt
- `COMPLETE` → returns status, prompt, and generated image URLs

**Error Handling**
- Returns `404` if the generation does not exist

---

## 📄 API Documentation (OpenAPI / Swagger)

The OpenAPI specification was updated to include:
- The new `GET /api/generation/{generationId}` endpoint
- Clear descriptions of each generation status
- Expected responses for success and error scenarios

Swagger UI is available when running the NestJS service.

---

## 🧪 Testing Strategy

### Unit Tests
- Service-level tests for generation logic
- Status transitions (`PENDING → COMPLETE / FAILED`)
- Error handling for missing generations

### Integration Tests
- HTTP-level validation of controllers
- Mocked external AI service responses
- Database interaction via Prisma

### End-to-End Tests
- Full request lifecycle:
  1. Create generation
  2. Query generation status
  3. Validate final response
- Ensures services work correctly together

---

## ⚠️ Error Handling & Edge Cases

- Non-existent generation IDs return proper `404` responses
- External service failures correctly mark generations as `FAILED`
- Each generation state has a clearly defined execution path
- No ambiguous or merged state handling logic

---

## 🧩 Code Quality & Best Practices

- Clear separation of concerns (controller, service, persistence)
- Explicit state handling for each generation status
- Strong typing with TypeScript
- No hidden side-effects in status transitions
- Clean and readable code structure
- Tests colocated with the relevant domain logic

---

## ▶️ How to Run

### Install dependencies
```bash
npm install
