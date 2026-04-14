import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/roles/roles.guard';
import { TestsService } from './tests.service';

@Controller('tests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TestsController {
  constructor(private readonly testService: TestsService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: any) {
    return this.testService.create(dto);
  }

  @Roles('admin')
  @Patch(':testId')
  update(@Param('testId') testId: string, @Body() dto: any) {
    return this.testService.updateTest(+testId, dto);
  }

  @Roles('admin')
  @Delete(':testId')
  delete(@Param('testId') testId: string) {
    return this.testService.deleteTest(+testId);
  }

  @Get(':testId')
  getQuestions(@Param('testId') id: number, @Request() req) {
    return this.testService.getTestQuestions(+id, req.user.userId);
  }

  @Post(':testId/start')
  startAttempt(@Param('testId') id: number, @Body() body: any, @Request() req) {
    return this.testService.startAttempt(req.user.userId, +id, body ?? {});
  }

  @Post(':testId/report-tab-switch')
  reportTabSwitch(@Param('testId') id: number, @Request() req) {
    return this.testService.reportTabSwitch(req.user.userId, +id);
  }

  @Post(':testId/report-webcam-status')
  reportWebcamStatus(
    @Param('testId') id: number,
    @Body() body: any,
    @Request() req,
  ) {
    return this.testService.reportWebcamStatus(
      req.user.userId,
      +id,
      Boolean(body?.isOn),
    );
  }

  @Post(':testId/submit')
  submit(@Param('testId') id: number, @Body() body: any, @Request() req) {
    return this.testService.submitTest(req.user.userId, +id, {
      answers: body?.answers ?? {},
      startedAt: body?.startedAt,
    });
  }
}
