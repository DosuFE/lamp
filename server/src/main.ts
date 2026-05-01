import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,https://lamp-chi-six.vercel.app/,https://lamp-3-pfnr.onrender.com/'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/files/' });
  await app.listen(process.env.PORT ?? 5051);
}
bootstrap();
