import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './message.schema';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
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
      },
    ]),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/message-db',
    ),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
