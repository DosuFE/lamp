import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from '../entities/lecture.entity';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from 'src/entities/enrollment.entity';

@Injectable()
export class LecturesService {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepo: Repository<Lecture>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,

    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
  ) {}

  async create(dto: any) {
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const lecture = this.lectureRepo.create({
      title: dto.title,
      content: dto.content,
      date: dto.date,
      course: course,
    });

    return this.lectureRepo.save(lecture);
  }

  async findByCourse(courseId: number, userId: number) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled');
    }

    return this.lectureRepo.find({
      where: { course: { id: courseId } },
    });
  }

  findAll() {
    return this.lectureRepo.find({
      relations: ['course'], // 👈 optional but useful
    });
  }
}
