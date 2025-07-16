import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Message } from './message.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async saveMessage(message: { from: string; to: string; message: string }) {
    try {
      this.logger.log('Attempting to save message to MongoDB', { message });
      const newMessage = new this.messageModel({
        ...message,
        timestamp: new Date(),
      });
      await newMessage.save();
      this.logger.log('Message saved to MongoDB', { message });
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to save message to MongoDB', {
        err: error.message,
        message,
      });
      throw err;
    }
  }
}
