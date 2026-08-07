import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  // Security and Performance
  app.use(helmet());
  app.use(compression());
  
  app.enableCors({
    origin: process.env.CORS_ORIGINS === '*' ? '*' : (process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:3000']),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global DTO Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown fields
      forbidNonWhitelisted: false, // don't reject unknown fields (flexibility)
      transform: true,          // auto-transform types (string → number etc)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 El-Mahaba Wood Trading NestJS API is running on http://localhost:${port}/api`);
}
bootstrap();

