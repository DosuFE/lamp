import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Question } from '../entities/question.entity';
import { Result } from '../entities/result.entity';
import { Test } from '../entities/test.entity';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { FaceVerificationService } from 'src/auth/face-verification.service';

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

    private readonly usersService: UsersService,
    private readonly faceVerificationService: FaceVerificationService,
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

  async listByCourse(
    courseId: number,
    user: { userId: number; role?: string },
  ) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (user.role !== 'admin') {
      const enrollment = await this.enrollmentRepo.findOne({
        where: { user: { id: user.userId }, course: { id: courseId } },
      });
      if (!enrollment) {
        throw new ForbiddenException('Not enrolled');
      }
    }

    return this.testRepo.find({
      where: { course: { id: courseId } },
      order: { id: 'ASC' },
    });
  }

  async getTestQuestionsForStudent(testId: number, userId: number) {
    const blockedAttempt = await this.resultRepo.findOne({
      where: {
        user: { id: userId },
        test: { id: testId },
        faceBlocked: true,
      },
    });

    if (blockedAttempt) {
      throw new ForbiddenException('You are blocked from this test.');
    }

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

    const rows = await this.questionRepo.find({
      where: { test: { id: testId } },
    });

    return rows.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));
  }

  async getTestQuestionsForAdmin(testId: number) {
    const test = await this.testRepo.findOne({ where: { id: testId } });
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return this.questionRepo.find({
      where: { test: { id: testId } },
      order: { id: 'ASC' },
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

    if (previousAttempt?.isFinalized) {
      throw new BadRequestException('This test has already been submitted');
    }

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
    const blockedAttempt = await this.resultRepo.findOne({
      where: {
        user: { id: userId },
        test: { id: testId },
        faceBlocked: true,
      },
    });

    if (blockedAttempt) {
      throw new ForbiddenException('You are blocked from this test.');
    }

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

    const existing = await this.resultRepo.findOne({
      where: { user: { id: userId }, test: { id: testId } },
    });

    if (existing?.isFinalized) {
      throw new BadRequestException('This test has already been submitted');
    }

    if (existing && existing.startedAt && !existing.isFinalized) {
      return {
        message: 'Attempt in progress',
        startedAt: existing.startedAt,
        timeLimitSeconds: existing.timeLimitSeconds ?? test.duration * 60,
      };
    }

    const startedAt = dto.startedAt ? new Date(dto.startedAt) : new Date();
    const limitSec = test.duration * 60;

    const attempt =
      existing ??
      this.resultRepo.create({
        user: { id: userId } as any,
        test: { id: testId } as any,
        score: 0,
        totalQuestions: 0,
        percentage: 0,
        grade: 'F',
        tabSwitchCount: 0,
        webcamOffCount: 0,
        malpracticeFlag: false,
        isFinalized: false,
      });

    attempt.user = { id: userId } as any;
    attempt.test = { id: testId } as any;
    attempt.startedAt = startedAt;
    attempt.timeLimitSeconds = limitSec;
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

  async verifyLiveFaceDuringTest(
    userId: number,
    testId: number,
    frames: string[],
  ) {
    const MAX_WARNINGS = 5;

    const attempt = await this.findOrCreateAttempt(userId, testId);

    if (attempt.isFinalized) {
      throw new BadRequestException('This test has already been submitted');
    }

    if (attempt.faceBlocked) {
      throw new UnauthorizedException({
        message: 'You are blocked from this test.',
        code: 'FACE_BLOCKED',
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    if (!user.facePrint) {
      throw new ForbiddenException({
        message: 'VERIFY OR CAPTURE YOUR FACE FIRST.',
        code: 'FACE_VERIFICATION_REQUIRED',
      });
    }

    let matches = 0;

    for (const frame of frames) {
      const isMatch = await this.faceVerificationService.compare(
        frame,
        user.facePrint,
      );

      if (isMatch) {
        matches++;
      }
    }

    const passed = matches >= 2;

    // FACE MATCHED
    if (passed) {
      attempt.faceMismatchCount = 0;

      await this.resultRepo.save(attempt);

      return {
        ok: true,
        warningCount: 0,
        remainingWarnings: MAX_WARNINGS,
      };
    }

    // FACE MISMATCH
    attempt.faceMismatchCount = (attempt.faceMismatchCount ?? 0) + 1;

    const remainingWarnings = MAX_WARNINGS - attempt.faceMismatchCount;

    // Still allowed
    if (attempt.faceMismatchCount < MAX_WARNINGS) {
      await this.resultRepo.save(attempt);

      return {
        ok: false,
        warning: true,
        warningCount: attempt.faceMismatchCount,
        remainingWarnings,
        message: `Face mismatch detected. Warning ${attempt.faceMismatchCount} of ${MAX_WARNINGS}.`,
        code: 'FACE_WARNING',
      };
    }

    // FINAL BLOCK
    attempt.faceBlocked = true;
    attempt.malpracticeFlag = true;
    attempt.evidenceImages = [...(attempt.evidenceImages || []), frames[0]];

    await this.resultRepo.save(attempt);

    await this.usersService.updateUser(userId, {
      tokenVersion: (user.tokenVersion ?? 0) + 1,
    });

    throw new UnauthorizedException({
      message: 'Face mismatch limit exceeded. You have been logged out.',
      code: 'FACE_MISMATCH_LOGOUT',
    });
  }

  private generateRandomChallenge() {
    const challenges = ['LOOK_LEFT', 'LOOK_RIGHT', 'LOOK_UP', 'BLINK', 'SMILE'];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  async getFaceChallenge(userId: number, testId: number) {
    const attempt = await this.findOrCreateAttempt(userId, testId);

    const challenge = this.generateRandomChallenge();

    attempt.currentFaceChallenge = challenge;

    await this.resultRepo.save(attempt);

    return {
      challenge,
    };
  }

  private gradeFromPercentage(percentage: number) {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
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
