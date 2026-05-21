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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/roles/roles.guard';
import { TestsService } from './tests.service';
import { FaceVerifiedGuard } from 'src/auth/guards/face-verified.guard';
import { FaceFramesDto } from 'src/auth/dto/face-capture.dto';

@Controller('tests')
@UseGuards(AuthGuard('jwt'), FaceVerifiedGuard, RolesGuard)
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

  @Get('course/:courseId')
  listByCourse(@Param('courseId') courseId: string, @Request() req) {
    return this.testService.listByCourse(+courseId, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Roles('admin')
  @Get(':testId/with-answers')
  getQuestionsWithAnswers(@Param('testId') testId: string) {
    return this.testService.getTestQuestionsForAdmin(+testId);
  }

  @Get(':testId')
  getQuestions(@Param('testId') testId: string, @Request() req) {
    return this.testService.getTestQuestionsForStudent(
      +testId,
      req.user.userId,
    );
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

  @Post(':testId/face-check')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  faceCheck(
    @Param('testId') id: number,
    @Body() dto: FaceFramesDto,
    @Request() req,
  ) {
    return this.testService.verifyLiveFaceDuringTest(
      req.user.userId,
      +id,
      dto.frames,
    );
  }

  @Get(':testId/face-challenge')
  getChallenge(@Param('testId') id: number, @Request() req) {
    return this.testService.getFaceChallenge(req.user.userId, +id);
  }

  @Post(':testId/submit')
  submit(@Param('testId') id: number, @Body() body: any, @Request() req) {
    return this.testService.submitTest(req.user.userId, +id, {
      answers: body?.answers ?? {},
      startedAt: body?.startedAt,
    });
  }
}
