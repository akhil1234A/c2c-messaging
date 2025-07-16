import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './message.schema';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { Kafka } from 'kafkajs';
import * as dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'client-b-producer',
  brokers: process.env.KAFKA_BROKERS
    ? [process.env.KAFKA_BROKERS]
    : ['localhost:29092'],
  ssl: process.env.KAFKA_SSL === 'true',
  sasl:
    process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
      ? {
          mechanism: 'plain',
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        }
      : undefined,
});

const producer = kafka.producer();
const MAX_RETRIES = 3;

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Message.name) private readonly msgModel: Model<Message>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      await producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to connect Kafka producer', {
        err: error.message,
      });
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to disconnect Kafka producer', {
        err: error.message,
      });
    }
  }

  async handleMessage(
    @Payload() message: { from: string; to: string; message: string },
    @Ctx() ctx: KafkaContext,
  ) {
    this.logger.log('Received message', { message, topic: ctx.getTopic() });

    if (message.to !== 'clientB') {
      this.logger.log('Message ignored (not for clientB)', { message });
      await ctx.getConsumer().commitOffsets([
        {
          topic: ctx.getTopic(),
          partition: ctx.getPartition(),
          offset: (Number(ctx.getMessage().offset) + 1).toString(),
        },
      ]);
      return;
    }

    try {
      // throw new Error('Forced failure');
      if (Math.random() < 0.8) throw new Error('Random failure');

      await this.msgModel.create({ ...message, timestamp: new Date() });
      this.logger.log('Message saved', { message });

      await ctx.getConsumer().commitOffsets([
        {
          topic: ctx.getTopic(),
          partition: ctx.getPartition(),
          offset: (Number(ctx.getMessage().offset) + 1).toString(),
        },
      ]);
    } catch (err) {
      const error = err as Error;
      this.logger.error('Processing failed', { message, err: error.message });

      const retry = Number(ctx.getMessage().headers?.retry || 0) + 1;

      if (retry <= MAX_RETRIES) {
        const delay = 2 ** retry * 1000;
        await producer.send({
          topic: 'client-messages-retry',
          messages: [
            {
              value: JSON.stringify(message),
              headers: { retry: Buffer.from(String(retry)) },
            },
          ],
        });
        this.logger.warn(`Retry scheduled #${retry}`, { message, delay });
      } else {
        await producer.send({
          topic: 'client-messages-dlt',
          messages: [{ value: JSON.stringify(message) }],
        });
        this.logger.error('Moved to DLQ', { message });
      }

      await ctx.getConsumer().commitOffsets([
        {
          topic: ctx.getTopic(),
          partition: ctx.getPartition(),
          offset: (Number(ctx.getMessage().offset) + 1).toString(),
        },
      ]);
      this.logger.log('Offset committed', {
        topic: ctx.getTopic(),
        partition: ctx.getPartition(),
        offset: Number(ctx.getMessage().offset) + 1,
      });
    }
  }
}
