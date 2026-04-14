import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { CreateCourseDto } from 'src/auth/dto/createCourse.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  create(dto: CreateCourseDto) {
    const course = this.courseRepo.create(dto);
    return this.courseRepo.save(course);
  }

  findAll() {
    return this.courseRepo.find();
  }

  async updateCourse(id: number, dto: Partial<CreateCourseDto>) {
    const course = await this.courseRepo.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  async deleteCourse(id: number) {
    const course = await this.courseRepo.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.courseRepo.remove(course);
    return { message: 'Course deleted successfully' };
  }
}
