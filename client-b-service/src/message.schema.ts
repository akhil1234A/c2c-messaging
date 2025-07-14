import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message extends Document {
  @Prop()
  from: string;

  @Prop()
  to: string;

  @Prop()
  message: string;

  @Prop()
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
