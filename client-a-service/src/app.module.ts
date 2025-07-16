import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { AppController } from './app.controller';
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
            clientId: process.env.KAFKA_CLIENT_ID ?? 'client-a',
            brokers: [process.env.KAFKA_BROKERS ?? 'localhost:29092'],
            ssl: process.env.KAFKA_SSL === 'true',
            sasl: kafkaSasl,
          },
        },
      },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
