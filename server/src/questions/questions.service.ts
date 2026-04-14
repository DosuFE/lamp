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

  async updateQuestion(
    id: number,
    dto: Partial<{
      question: string;
      options: string[];
      correctAnswer: string;
      testId: number;
    }>,
  ) {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['test'],
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (dto.testId !== undefined) {
      const test = await this.testRepo.findOne({
        where: { id: dto.testId },
      });

      if (!test) {
        throw new NotFoundException('Test not found');
      }

      question.test = test;
    }

    if (dto.question !== undefined) question.question = dto.question;
    if (dto.options !== undefined) question.options = dto.options;
    if (dto.correctAnswer !== undefined) {
      question.correctAnswer = dto.correctAnswer;
    }

    return this.questionRepo.save(question);
  }

  async deleteQuestion(id: number) {
    const question = await this.questionRepo.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.questionRepo.remove(question);
    return { message: 'Question deleted successfully' };
  }
}
