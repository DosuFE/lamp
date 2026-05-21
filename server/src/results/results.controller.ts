import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResultsService } from './results.service';
import { FaceVerifiedGuard } from 'src/auth/guards/face-verified.guard';

@UseGuards(AuthGuard('jwt'), FaceVerifiedGuard)
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  myResults(@Request() req) {
    return this.resultsService.findMyResults(req.user.userId);
  }

  @Get('course/:courseId')
  myResultsForCourse(@Param('courseId') courseId: string, @Request() req) {
    return this.resultsService.findMyResultsByCourse(
      req.user.userId,
      +courseId,
    );
  }

  @Get('test/:testId')
  myResultForTest(@Param('testId') testId: string, @Request() req) {
    return this.resultsService.findMyResultByTest(req.user.userId, +testId);
  }
}
