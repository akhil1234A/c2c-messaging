# Client-to-Client Messaging System

This project implements a client-to-client messaging system using **Kafka** and **NestJS**, with **MongoDB** for storage. It consists of two services: `client-a-service` (producer) and `client-b-service` (consumer). The system supports message sending, filtering, retries, and a Dead Letter Queue (DLQ), and is deployed on **Render** with **Confluent Cloud** for Kafka.

## Features
- **client-a-service**: Exposes a POST `/send-message` endpoint to send messages to the `client-messages` Kafka topic and saves them to MongoDB.
- **client-b-service**: Consumes messages from `client-messages` and `client-messages-retry`, filters for `to: 'clientB'`, saves to MongoDB, and handles retries (up to 3) and DLQ (`client-messages-dlt`).
- **MongoDB Atlas**: Stores messages with a unique index to prevent duplicates.
- **Kafka**: Manages message queues with retry and DLQ mechanisms.
- **Render Deployment**: Hosts both services with Confluent Cloud for production Kafka.

## Prerequisites
- Node.js (v18 or later)
- Docker (for local Kafka)
- MongoDB Atlas account
- Confluent Cloud account (for production)
- Render account
- Git

## Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone <https://github.com/akhil1234A/c2c-messaging.git>
   cd c2c-messaging
   ```
2. **Install Dependencies**:
   ```bash
   cd client-a-service
   npm install
   cd ../client-b-service
   npm install
   ```
3. **Set Up Environment Variables**:
   - Create `.env` files in both `client-a-service` and `client-b-service`:
     ```plaintext
     KAFKA_BROKERS=localhost:29092
     MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/message-db?retryWrites=true&w=majority
     ```
   - For production (Render/Confluent Cloud):
     ```plaintext
     KAFKA_BROKERS=<confluent-broker-url>
     KAFKA_USERNAME=<confluent-username>
     KAFKA_PASSWORD=<confluent-password>
     MONGODB_URI=<atlas-uri>
     ```
4. **Start Kafka (Local)**:
   ```bash
   cd client-a-service
   docker-compose up -d
   ```
   Create topics:
   ```bash
   docker exec -it kafka kafka-topics.sh --create --topic client-messages --bootstrap-server localhost:29092 --partitions 1 --replication-factor 1
   docker exec -it kafka kafka-topics.sh --create --topic client-messages-retry --bootstrap-server localhost:29092 --partitions 1 --replication-factor 1
   docker exec -it kafka kafka-topics.sh --create --topic client-messages-dlt --bootstrap-server localhost:29092 --partitions 1 --replication-factor 1
   ```
5. **Start Services**:
   ```bash
   cd client-a-service
   npm run start:dev
   cd ../client-b-service
   npm run start:dev
   ```

## Testing Instructions
1. **Send a Successful Message**:
   ```bash
   curl -X POST http://localhost:3000/send-message -H "Content-Type: application/json" -d '{"from":"clientA","to":"clientB","message":"Test success"}'
   ```
   - Check logs: `"Message saved to MongoDB"` (client-a-service), `"Message saved"` (client-b-service, 20% chance).
   - Check MongoDB (`message-db`, `messages`): Two entries if successful.
2. **Test Non-`clientB` Message**:
   ```bash
   curl -X POST http://localhost:3000/send-message -H "Content-Type: application/json" -d '{"from":"clientA","to":"clientA","message":"Test failure"}'
   ```
   - Check logs: `"Message ignored (not for clientB)"` (client-b-service).
   - Check MongoDB: One entry from client-a-service.
3. **Test Retry/DLQ**:
   - In `client-b-service/src/app.service.ts`, uncomment `if (true) throw new Error('Forced failure')`.
   - Send a message:
     ```bash
     curl -X POST http://localhost:3000/send-message -H "Content-Type: application/json" -d '{"from":"clientA","to":"clientB","message":"Test failure"}'
     ```
   - Check logs: `"Retry scheduled #1"`, `#2`, `#3`, `"Moved to DLQ"`.
   - Check Kafka:
     ```bash
     kcat -b localhost:29092 -t client-messages-retry -C
     kcat -b localhost:29092 -t client-messages-dlt -C
     ```
   - Check MongoDB: One entry from client-a-service, none from client-b-service.
4. **Verify MongoDB**:
   - Use MongoDB Compass or:
     ```javascript
     use message-db
     db.messages.find()
     ```
   - Ensure no duplicates or incorrect `from` fields (e.g., `from: 'clientB'`).


## Video Demonstration
- Watch the demo: [Insert YouTube/Google Drive Link]

