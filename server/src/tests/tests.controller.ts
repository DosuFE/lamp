import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class TestsController {
  constructor(private readonly testService: TestsService) {}

  @Post()
  create(@Body() dto: any) {
    return this.testService.create(dto);
  }

  @Get(':testId')
  getQuestions(@Param('testId') id: number, @Request() req) {
    return this.testService.getTestQuestions(+id, req.user.userId);
  }

  @Post(':testId/submit')
  submit(
    @Param('testId') id: number,
    @Body() body,
    @Request() req,
  ) {
    return this.testService.submitTest(req.user.userId, +id, body.answers);
  }
}
