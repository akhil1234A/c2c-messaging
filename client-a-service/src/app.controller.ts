import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { AppService } from './app.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Kafka client connected');
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to connect to Kafka', { err: error.message });
      throw err;
    }
  }

  @Post('send-message')
  async sendMessage(
    @Body() body: { from: string; to: string; message: string },
  ) {
    if (!body.from || !body.to || !body.message) {
      this.logger.error('Missing required fields', { body });
      throw new Error('Missing required fields');
    }
    if (body.from !== 'clientA') {
      this.logger.error('Invalid sender: must be clientA', { body });
      throw new Error('Invalid sender: must be clientA');
    }
    try {
      await this.appService.saveMessage(body);
      this.kafkaClient.emit('client-messages', body);
      this.logger.log('Message sent to Kafka', { body });
      return 'Message sent';
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to send message', { err: error.message, body });
      throw err;
    }
  }
}
