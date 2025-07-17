
# Client-to-Client Messaging System Documentation

## Overview

This system enables client-to-client messaging using **Kafka** for message queuing, **NestJS** for service implementation, and **MongoDB Atlas** for persistent storage. It consists of two services:

- **client-a-service**: A producer that sends messages to the `client-messages` Kafka topic via a POST `/send-message` endpoint and saves them to MongoDB.
- **client-b-service**: A consumer that processes messages from `client-messages` and `client-messages-retry`, filters for `to: 'clientB'`, saves to MongoDB, and implements retry (up to 3 attempts) and DLQ (`client-messages-dlt`) mechanisms.

The system is deployed on **Render** with **Confluent Cloud** for production Kafka. 

## System Architecture

- **Kafka**:
    - Topics: `client-messages` (main), `client-messages-retry` (retries), `client-messages-dlt` (DLQ).
    - Single partition per topic to ensure ordered processing.
    - `client-b-service` uses `groupId: 'client-b-group'` with `autoCommit: false` for manual offset commits.
- **MongoDB Atlas**:
    - Database: `message-db`, Collection: `messages`.
    - Schema: `{ from: string, to: string, message: string, timestamp: Date }` with a unique index.
- **NestJS Services**:
    - **client-a-service**: REST API with POST `/send-message`.
    - **client-b-service**: Kafka consumer with retry/DLQ logic.
- **Render**: Hosts both services with Confluent Cloud integration.

## Dead Letter Queue (DLQ)

- **Purpose**: Stores messages that fail processing after 3 retries for debugging or manual handling.
- **Workflow**:
    1. `client-b-service` consumes from `client-messages` or `client-messages-retry`.
    2. If `to !== 'clientB'`, the message is ignored, and the offset is committed.
    3. If `to === 'clientB'` and processing fails (e.g., MongoDB error or forced failure):
        - Retry count increments (`retry` header: 1, 2, 3).
        - Message is sent to `client-messages-retry` with a delay (`2^retry * 1000` ms).
        - After 3 retries, the message is sent to `client-messages-dlt`.
    4. Offsets are committed after each action to prevent reprocessing.
- **Verification**:
    - Check logs: `"Retry scheduled #X"`, `"Moved to DLQ"`.
    - Check Kafka: `kcat -b localhost:29092 -t client-messages-dlt -C`.

## Setup Instructions

See `README.md` for detailed setup steps, including local Kafka, MongoDB Atlas, and service startup.

## Testing Instructions

1. **Successful Message**:
    - Send: `curl -X POST http://localhost:3000/send-message -H "Content-Type: application/json" -d '{"from":"clientA","to":"clientB","message":"Test success"}'`.
    - Expected:
        - Logs: `"Message saved to MongoDB"` (client-a-service), `"Message saved"` (client-b-service, 20% chance).
        - MongoDB: Two entries if successful.
2. **Non-`clientB` Message**:
    - Send: `curl -X POST http://localhost:3000/send-message -H "Content-Type: application/json" -d '{"from":"clientA","to":"clientA","message":"Test failure"}'`.
    - Expected: One MongoDB entry, `"Message ignored"` in client-b-service.
3. **Retry/DLQ**:
    - Enable forced failure in `client-b-service/src/app.service.ts`.
    - Send a message and check logs, Kafka topics, and MongoDB.

