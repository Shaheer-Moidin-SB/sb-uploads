import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  KAFKA_CONSUMER_GROUP_ID,
  KAFKA_OPTIONS_CLIENT_ID,
} from './utils/constants/kafka-const';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KAFKA_OPTIONS_CLIENT_ID.uploads_service,
        //brokers: ['host.docker.internal:9092'],
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: KAFKA_CONSUMER_GROUP_ID.uploads_consumer,
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
