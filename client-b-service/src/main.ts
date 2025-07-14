import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'client-b',
        brokers: process.env.KAFKA_BROKERS
          ? [process.env.KAFKA_BROKERS]
          : ['localhost:29092'],
      },
      consumer: {
        groupId: 'client-b-group',
      },
    },
  });
  await app.listen();
}
bootstrap();
