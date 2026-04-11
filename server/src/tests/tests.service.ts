import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Question } from '../entities/question.entity';
import { Result } from '../entities/result.entity';
import { Test } from '../entities/test.entity';
import { Repository } from 'typeorm';

type CreateTestDto = {
  courseId: number;
  title: string;
  duration: number;
};

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(Test)
    private testRepo: Repository<Test>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,

    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,

    @InjectRepository(Question)
    private questionRepo: Repository<Question>,

    @InjectRepository(Result)
    private resultRepo: Repository<Result>,
  ) {}

  async create(dto: CreateTestDto) {
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const test = this.testRepo.create({
      title: dto.title,
      duration: dto.duration,
      course: course,
    });

    return this.testRepo.save(test);
  }

  async getTestQuestions(testId: number, userId: number) {
    const test = await this.testRepo.findOne({
      where: { id: testId },
      relations: ['course'],
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: test.course.id },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled');
    }

    return this.questionRepo.find({
      where: { test: { id: testId } },
    });
  }

  async submitTest(
    userId: number,
    testId: number,
    answers: Record<number, string>,
  ) {
    const questions = await this.questionRepo.find({
      where: { test: { id: testId } },
    });

    let score = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const result = this.resultRepo.create({
      user: { id: userId },
      test: { id: testId },
      score,
    });

    return this.resultRepo.save(result);
  }
}
