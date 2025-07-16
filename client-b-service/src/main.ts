import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();

const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID ?? 'client-b',
  brokers: [process.env.KAFKA_BROKERS ?? 'localhost:29092'],
  ssl: process.env.KAFKA_SSL === 'true',
};

// Add sasl only if credentials exist
if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (kafkaConfig as any).sasl = {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: kafkaConfig,
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID ?? 'client-b-group',
        allowAutoTopicCreation: false,
      },
      run: { autoCommit: false },
    },
  });
  await app.listen();
}
bootstrap();
