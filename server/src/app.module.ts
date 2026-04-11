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

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://neondb_owner:npg_AphDsu7mIli4@ep-fragrant-glitter-anaoi02w-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      synchronize: true,
      entities: [User, Course, Enrollment, Lecture, Test, Question, Result],
    }),
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    LecturesModule,
    TestsModule,
    QuestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
