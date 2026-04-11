import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { Test } from '../entities/test.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Question } from '../entities/question.entity';
import { Result } from '../entities/result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test, Course, Enrollment, Question, Result]),
  ],
  providers: [TestsService],
  controllers: [TestsController],
})
export class TestsModule {}
