import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { Enrollment } from '../entities/enrollment.entity';
import { User } from '../entities/users.entity';
import { Course } from '../entities/course.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, User, Course]), AuthModule],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
