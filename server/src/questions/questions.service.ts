import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from 'src/entities/question.entity';
import { Test } from 'src/entities/test.entity';
import { Repository } from 'typeorm';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,

    @InjectRepository(Test)
    private testRepo: Repository<Test>,
  ) {}

  async create(dto: any) {
    const test = await this.testRepo.findOne({
      where: { id: dto.testId },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const question = this.questionRepo.create({
      question: dto.question,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      test: test,
    });

    return this.questionRepo.save(question);
  }
}
