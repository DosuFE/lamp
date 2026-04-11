import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../entities/question.entity';
import { Test } from '../entities/test.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Test])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
