import { Controller } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly svc: AppService) {}

  @EventPattern('client-messages')
  async receive(@Payload() msg: any, @Ctx() ctx: KafkaContext) {
    await this.svc.handleMessage(msg, ctx);
  }
  @EventPattern('client-messages-retry')
  async retry(@Payload() msg: any, @Ctx() ctx: KafkaContext) {
    await this.svc.handleMessage(msg, ctx);
  }
}
