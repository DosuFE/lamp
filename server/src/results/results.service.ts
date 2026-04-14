import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Result } from '../entities/result.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private readonly resultRepo: Repository<Result>,
  ) {}

  async findMyResults(userId: number) {
    return this.resultRepo.find({
      where: { user: { id: userId } },
      relations: ['test', 'test.course'],
      order: { submittedAt: 'DESC' },
    });
  }

  async findMyResultByTest(userId: number, testId: number) {
    const result = await this.resultRepo.findOne({
      where: {
        user: { id: userId },
        test: { id: testId },
      },
      relations: ['test', 'test.course'],
    });

    if (!result) {
      throw new NotFoundException('Result not found for this test');
    }

    return result;
  }

  async findMyResultsByCourse(userId: number, courseId: number) {
    return this.resultRepo.find({
      where: {
        user: { id: userId },
        test: { course: { id: courseId } },
      },
      relations: ['test', 'test.course'],
      order: { submittedAt: 'DESC' },
    });
  }
}
