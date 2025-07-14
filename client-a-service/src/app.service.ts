import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './message.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async saveMessage(message: { from: string; to: string; message: string }) {
    const newMessage = new this.messageModel({
      ...message,
      timestamp: new Date(),
    });
    await newMessage.save();
  }
}
