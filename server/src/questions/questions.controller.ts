import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.questionService.updateQuestion(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionService.deleteQuestion(+id);
  }
}
