import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  @Post('send-message')
  async sendMessage(
    @Body() body: { from: string; to: string; message: string },
  ) {
    if (!body.from || !body.to || !body.message) {
      throw new Error('Missing required fields');
    }
    await this.appService.saveMessage(body);
    this.kafkaClient.emit('client-messages', body);
    return 'Message sent';
  }
}
