import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';
import { Course } from '../entities/course.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(User) private userRepo: Repository<User>,

    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  async enroll(userId: number, courseId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const course = await this.courseRepo.findOne({ where: { id: courseId } });

    if (!user || !course) {
      throw new NotFoundException('User or Course not found');
    }

    const existing = await this.enrollmentRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
    });

    if (existing) {
      throw new BadRequestException('User already enrolled in this course');
    }

    const enrollment = this.enrollmentRepo.create({ user, course });
    return this.enrollmentRepo.save(enrollment);
  }

  findMyCourses(userId: number) {
    return this.enrollmentRepo.find({
      where: { user: { id: userId } },
    });
  }
}
