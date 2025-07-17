import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { Message, MessageSchema } from './message.schema';
import * as dotenv from 'dotenv';

dotenv.config();

const kafkaSasl =
  process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
    ? {
        mechanism: 'plain' as const,
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      }
    : undefined;

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID ?? 'client-b',
            brokers: [process.env.KAFKA_BROKERS ?? 'localhost:29092'],
            ssl: process.env.KAFKA_SSL === 'true',
            sasl: kafkaSasl,
          },
          consumer: {
            groupId: process.env.KAFKA_GROUP_ID ?? 'client-b-group',
            allowAutoTopicCreation: false,
          },
          run: { autoCommit: false },
        },
      },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
