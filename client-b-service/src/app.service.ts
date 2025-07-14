import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './message.schema';
import { MessagePattern } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  @MessagePattern('client-messages')
  async handleMessage(message: { from: string; to: string; message: string }) {
    if (message.to === 'clientB') {
      console.log(`Received message: ${message.message}`);
      const newMessage = new this.messageModel({
        ...message,
        timestamp: new Date(),
      });
      await newMessage.save();
    }
  }
}
