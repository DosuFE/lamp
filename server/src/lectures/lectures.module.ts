import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lecture } from '../entities/lecture.entity';
import { LecturesService } from './lectures.service';
import { LecturesController } from './lectures.controller';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lecture, Course, Enrollment]), AuthModule],
  controllers: [LecturesController],
  providers: [LecturesService],
  exports: [LecturesService],
})
export class LecturesModule {}
