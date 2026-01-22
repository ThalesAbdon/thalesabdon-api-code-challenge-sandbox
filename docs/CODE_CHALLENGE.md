# API Engineer Candidate Tasks

This document outlines the tasks completed as part of the API engineering candidate evaluation process.  
All tasks were implemented with a focus on **quality, resilience, reliability, and clear communication**.  

---

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
|---------|----------------|
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

- The OpenAPI specification was updated to include the new `GET /api/generation/{generationId}` endpoint.
- Clear descriptions of each generation status.
- Expected responses for success and error scenarios.

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

### Run unit tests:
- nestjs: npm test
- mock-ai-server: npm test

### Run E2E tests:
- in root: npm run test:e2e
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

# Task 2 – Retry Mechanism for Failed AI Server Requests

This section implements **Task 2**, adding a **retry mechanism** with **exponential backoff** to handle AI server request failures gracefully.

---

## ✅ Task 2 Objectives

- Implement a retry strategy for failed AI generation requests
- Track retry attempts in the database (`retryCount`)
- Ensure robust error handling and detailed logging
- Provide clear test coverage
- Run the AI generation process asynchronously in the background

---

## 🔄 Retry Strategy & Implementation

- **Exponential backoff**:
  - Initial delay: 2000ms
  - Multiplied by 2 for each retry attempt
  - Maximum retries: 3
- Retry attempts are **recorded in the database** (`retryCount`)
- Status is updated to `FAILED` after maximum attempts
- Logs provide full observability of each retry attempt

**Flow**
1. Generation request is created → status `PENDING`
2. Background process calls `processImageGeneration`:
   - If the AI request fails, retry with exponential backoff
   - Database `retryCount` is incremented at each attempt
   - Logs include attempt number and error details
3. Maximum attempts reached → status `FAILED`
4. Success before max attempts → status `COMPLETE`

**Background Processing**
- Image generation runs asynchronously using `Promise.resolve().then()` to avoid blocking the main request
- Immediate response to the client with the `generationId` while processing continues in the background

---

## 🧱 Architectural Integration

- Retry logic encapsulated in **AiService**
- Controllers remain thin, focusing on API requests
- Works seamlessly with the async callback mechanism from the Mock AI server
- Prisma is used for:
  - Creating generation records
  - Updating `retryCount` on failures
  - Updating `status` (`PENDING → COMPLETE / FAILED`)
  - Persisting timestamps (`createdAt` / `updatedAt`)

---

## 🧪 Testing Strategy

### Unit Tests
- Retry logic tested independently
- Ensures backoff delays increase exponentially
- Handles success and failure scenarios correctly
- Verifies proper database updates for `retryCount` and `status`

### Integration Tests
- Simulated AI server failures
- Validates database records for multiple attempts
- Confirms correct final status (`COMPLETE` or `FAILED`)

### End-to-End Tests
- Full lifecycle with retries:
  1. Create generation
  2. Background process attempts AI request
  3. Automatic retries handled
  4. Final status and generated images returned
- Ensures API and background processing work seamlessly together

### Run unit tests:
- nestjs: npm test
- mock-ai-server: npm test

### Run E2E tests:
- in root: npm run test:e2e

---

## ⚠️ Error Handling & Edge Cases

- Prevents infinite retry loops
- Proper logging for each retry attempt (including Axios error details)
- Database remains consistent after multiple failures
- Status transitions are atomic and clearly defined (`PENDING → COMPLETE / FAILED`)

---

## 🧩 Code Quality & Best Practices

- Retry logic is **modular and reusable**
- Background image generation avoids blocking API responses
- Clear separation between retry mechanism and main generation flow
- Strong typing with TypeScript
- Logs provide full observability without affecting production performance
- Prisma used effectively for atomic updates

---


**✅ Both Task 1 and Task 2 are fully implemented, tested, and documented.**

## Evidence (Tests & API Responses)

<img width="1545" height="745" alt="Task1-1" src="https://github.com/user-attachments/assets/5b9402ca-6a3a-4b1c-8155-8a8604e368cc" />
<img width="1919" height="255" alt="Task1-2" src="https://github.com/user-attachments/assets/2fc649c3-14b5-4df5-a786-64d90fc89d31" />
<img width="1548" height="791" alt="Task1-3" src="https://github.com/user-attachments/assets/b3fefacf-a298-4971-9b98-9f28e4ca128a" />
<img width="1552" height="885" alt="Task1-4" src="https://github.com/user-attachments/assets/4f9e6cdf-7583-4cff-b720-3d72604931c8" />
<img width="1914" height="287" alt="Task1-5" src="https://github.com/user-attachments/assets/f7ce66eb-40a4-41f3-9fb6-ed91e884cdf5" />
<img width="648" height="316" alt="image" src="https://github.com/user-attachments/assets/5927773a-4eb5-4872-856b-6d7972f87c16" />

---

<img width="553" height="340" alt="image" src="https://github.com/user-attachments/assets/f580978c-f895-4b20-a05c-c9a8bc65be63" />
<img width="488" height="192" alt="image" src="https://github.com/user-attachments/assets/4922518b-f3ff-4693-9887-50830e84cddb" />
<img width="626" height="251" alt="image" src="https://github.com/user-attachments/assets/9d76c060-10a9-4a58-b1f2-704e80f292c8" />

---

# Task 3: Real-time User Notification System

---
## Objective
Notify users when their image generation requests are completed, focusing on FE ↔ API interaction. Excludes AI engine communication.

---

## Architecture
<img width="8191" height="2781" alt="Mermaid Chart - Create complex, visual diagrams with text -2026-01-22-163219" src="https://github.com/user-attachments/assets/047b346d-c1ce-4da9-b21d-5c61769eb9bd" />

sequenceDiagram
    autonumber
    actor User as Frontend
    participant API as NestJS API
    participant DB as Database (PostgreSQL/Prisma)
    participant Lambda as Lambda Callback
    participant PubSub as Redis/AWS SNS

    Note over User, Lambda: === Conexão Inicial ===
    User->>API: Connect WebSocket (JWT)
    API->>API: Register active connection (UserID -> SocketID)
    API->>PubSub: SUBSCRIBE channel "notifications:user:{id}"
    API-->>User: Connection Established (Handshake OK)

    Note over Lambda, User: === Evento de Conclusão ===
    Lambda->>DB: UPDATE generation SET status='COMPLETE', url='...' WHERE id='gen_999'
    Lambda->>PubSub: PUBLISH "notifications:user:{id}" {event: "generation_complete", ...}

    Note over API, User: === Entrega e Ack ===
    PubSub-->>API: Notification received
    API->>User: PUSH MESSAGE {event: "generation_complete", data: {...}}
    User->>User: Display notification "Image ready!"
    User->>API: SEND ACK {generationId: "gen_999", status: "received"}

    Note right of API: Retry if no ACK, store pending messages for offline users

- Frontend: subscribes to real-time updates.
- API (NestJS): manages connections, status updates.
- Database (PostgreSQL/Prisma): tracks generation status (PENDING, COMPLETE, FAILED).
- Lambda Callback: receives AI completion events.
- Pub/Sub (Redis/AWS SNS): optional, for scalability and decoupling.
  
---

## Message

- ```json 
   { 
     "event": "generation_complete",
     "data": {
       "generationId": "uuid",
       "status": "COMPLETE",
       "imageUrl": "https://.../image.png",
       "timestamp": "2026-01-22T12:00:00Z"
     }
  }
- - -
## Key Features

- Security: HTTPS, JWT authentication, rate limiting.
- Scalability: Redis Pub/Sub, WebSocket clustering, sharding.
- Offline Users: store pending notifications in DB/Redis, deliver on reconnect.
- Acknowledgement: FE sends ack to confirm receipt.
- ```json 
  {
    "generationId": "uuid",
    "status": "received"
  }

- Error Handling: retry with backoff, logs, reconnection.
- Trade-offs: WebSocket (more complex, bidirectional) vs SSE (simpler, unidirectional). Redis (fast/local) vs SNS (scalable/global, costlier).

- - - 
## Implementation Complexity
- WebSocket + Pub/Sub: Medium
- SSE: Low
- Security/auth: Medium
- Overall: Moderate

## Optional ( good to have )
- Multi-device Sync: A user may be connected on multiple devices. 
  Ensure that all devices receive the same notification, using Pub/Sub channels per userId.
- Delivery Guarantees: Implement at-least-once delivery using a persistent queue (Redis Streams or SQS) to ensure critical notifications are never lost, even if Lambda/API crashes.
  Messages can be idempotent, using generationId as the key to avoid duplicates on the frontend.  
- Token Rotation: Rotating JWTs or WebSocket tokens periodically to reduce risk in case a token is compromised.
