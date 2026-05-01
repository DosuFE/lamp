import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Course } from './entities/course.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Lecture } from './entities/lecture.entity';
import { Test } from './entities/test.entity';
import { Question } from './entities/question.entity';
import { Result } from './entities/result.entity';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { LecturesModule } from './lectures/lectures.module';
import { TestsModule } from './tests/tests.module';
import { QuestionsModule } from './questions/questions.module';
import { ResultsModule } from './results/results.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        if (!databaseUrl) {
          if (isProduction) {
            throw new Error('DATABASE_URL is required in production');
          }
          throw new Error(
            'DATABASE_URL is missing. Set it in your environment before starting the server.',
          );
        }

        const isLocalDatabase =
          databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          synchronize: !isProduction,
          entities: [User, Course, Enrollment, Lecture, Test, Question, Result],
          ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
        };
      },
    }),
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    LecturesModule,
    TestsModule,
    QuestionsModule,
    ResultsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
