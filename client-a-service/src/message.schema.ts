import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message extends Document {
  @Prop({ required: true }) from: string;
  @Prop({ required: true }) to: string;
  @Prop({ required: true }) message: string;
  @Prop({ required: true }) timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index(
  { from: 1, to: 1, message: 1, timestamp: 1 },
  { unique: true },
);
