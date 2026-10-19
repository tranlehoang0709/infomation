import 'reflect-metadata';
import cookieParser = require('cookie-parser');
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<{ frontendOrigin: string; port: number }>('CONFIG');

  app.use(cookieParser());
  app.enableCors({
    origin: config.frontendOrigin,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  await app.listen(config.port);
}

bootstrap();
