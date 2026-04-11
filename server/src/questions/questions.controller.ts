import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorators';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles/roles.guard';
import { QuestionsService } from './questions.service';

@Controller('questions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class QuestionsController {
  constructor(private readonly questionService: QuestionsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.questionService.create(dto);
  }
}
