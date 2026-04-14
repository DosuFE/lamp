import {
  BadRequestException,
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

type UpdateTestDto = Partial<CreateTestDto>;

type StartAttemptDto = {
  startedAt?: string;
};

type SubmitTestDto = {
  answers: Record<number, string>;
  startedAt?: string;
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

  async updateTest(id: number, dto: UpdateTestDto) {
    const test = await this.testRepo.findOne({ where: { id } });
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    if (dto.courseId !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new BadRequestException('Invalid courseId');
      }
      test.course = course;
    }

    if (dto.title !== undefined) test.title = dto.title;
    if (dto.duration !== undefined) test.duration = dto.duration;

    return this.testRepo.save(test);
  }

  async deleteTest(id: number) {
    const test = await this.testRepo.findOne({ where: { id } });
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    await this.testRepo.remove(test);
    return { message: 'Test deleted successfully' };
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

  async submitTest(userId: number, testId: number, data: SubmitTestDto) {
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

    const questions = await this.questionRepo.find({
      where: { test: { id: testId } },
    });

    const totalQuestions = questions.length;
    const answers = data.answers ?? {};
    let score = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const percentage =
      totalQuestions > 0
        ? Number(((score / totalQuestions) * 100).toFixed(2))
        : 0;
    const grade = this.gradeFromPercentage(percentage);

    const startedAt = data.startedAt ? new Date(data.startedAt) : undefined;
    const submittedAt = new Date();
    const timeLimitSeconds = test.duration * 60;
    const timeSpentSeconds = startedAt
      ? Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000)
      : undefined;

    const previousAttempt = await this.resultRepo.findOne({
      where: { user: { id: userId }, test: { id: testId } },
    });

    const tabSwitchCount = previousAttempt?.tabSwitchCount ?? 0;
    const webcamOffCount = previousAttempt?.webcamOffCount ?? 0;
    const exceededTime =
      typeof timeSpentSeconds === 'number' &&
      timeSpentSeconds > timeLimitSeconds;

    const result = previousAttempt ?? this.resultRepo.create();
    result.user = { id: userId } as any;
    result.test = { id: testId } as any;
    result.score = score;
    result.totalQuestions = totalQuestions;
    result.percentage = percentage;
    result.grade = grade;
    result.startedAt = startedAt;
    result.timeSpentSeconds = timeSpentSeconds;
    result.timeLimitSeconds = timeLimitSeconds;
    result.tabSwitchCount = tabSwitchCount;
    result.webcamOffCount = webcamOffCount;
    result.malpracticeFlag =
      tabSwitchCount > 0 || webcamOffCount > 0 || exceededTime;
    result.submittedAt = submittedAt;
    result.isFinalized = true;

    return this.resultRepo.save(result);
  }

  async startAttempt(userId: number, testId: number, dto: StartAttemptDto) {
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

    const startedAt = dto.startedAt ? new Date(dto.startedAt) : new Date();
    const existing = await this.resultRepo.findOne({
      where: { user: { id: userId }, test: { id: testId } },
    });

    const attempt = existing ?? this.resultRepo.create();
    attempt.user = { id: userId } as any;
    attempt.test = { id: testId } as any;
    attempt.startedAt = startedAt;
    attempt.timeLimitSeconds = test.duration * 60;
    attempt.isFinalized = false;

    await this.resultRepo.save(attempt);

    return {
      message: 'Attempt started',
      startedAt,
      timeLimitSeconds: attempt.timeLimitSeconds,
    };
  }

  async reportTabSwitch(userId: number, testId: number) {
    const attempt = await this.findOrCreateAttempt(userId, testId);
    attempt.tabSwitchCount = (attempt.tabSwitchCount ?? 0) + 1;
    attempt.malpracticeFlag = true;
    await this.resultRepo.save(attempt);

    return {
      message: 'Tab switch recorded',
      tabSwitchCount: attempt.tabSwitchCount,
    };
  }

  async reportWebcamStatus(userId: number, testId: number, isOn: boolean) {
    const attempt = await this.findOrCreateAttempt(userId, testId);

    if (!isOn) {
      attempt.webcamOffCount = (attempt.webcamOffCount ?? 0) + 1;
      attempt.malpracticeFlag = true;
    }

    await this.resultRepo.save(attempt);

    return {
      message: 'Webcam status recorded',
      webcamOffCount: attempt.webcamOffCount ?? 0,
    };
  }

  private gradeFromPercentage(percentage: number) {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    return 'C';
  }

  private async findOrCreateAttempt(userId: number, testId: number) {
    const existing = await this.resultRepo.findOne({
      where: { user: { id: userId }, test: { id: testId } },
    });

    if (existing) {
      return existing;
    }

    const created = this.resultRepo.create({
      user: { id: userId } as any,
      test: { id: testId } as any,
      isFinalized: false,
      score: 0,
      totalQuestions: 0,
      percentage: 0,
      grade: 'F',
      tabSwitchCount: 0,
      webcamOffCount: 0,
      malpracticeFlag: false,
    });

    return this.resultRepo.save(created);
  }
}
