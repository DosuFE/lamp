import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Lecture } from '../entities/lecture.entity';

type CreateLectureDto = {
  courseId: number;
  title: string;
  content: string;
  date: Date;
};

type UpdateLectureDto = Partial<CreateLectureDto>;

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

  async create(dto: CreateLectureDto) {
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
      course,
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
      relations: ['course'],
    });
  }

  findAll() {
    return this.lectureRepo.find({
      relations: ['course'],
    });
  }

  async updateLecture(lectureId: number, dto: UpdateLectureDto) {
    const lecture = await this.lectureRepo.findOne({ where: { id: lectureId } });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    if (dto.courseId !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      lecture.course = course;
    }

    if (dto.title !== undefined) lecture.title = dto.title;
    if (dto.content !== undefined) lecture.content = dto.content;
    if (dto.date !== undefined) lecture.date = dto.date;

    return this.lectureRepo.save(lecture);
  }

  async deleteLecture(lectureId: number) {
    const lecture = await this.lectureRepo.findOne({ where: { id: lectureId } });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    await this.lectureRepo.remove(lecture);
    return { message: 'Lecture deleted successfully' };
  }
}
