import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnrollmentsService } from './enrollments.service';

@UseGuards(AuthGuard('jwt'))
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentService: EnrollmentsService) {}

  // STUDENT REGISTER COURSES
  @Post(':courseId')
  enroll(@Param('courseId') courseId: number, @Request() req) {
    return this.enrollmentService.enroll(req.user.userId, +courseId);
  }

  // STUDENT SEE'S THEIR COURSES
  @Get('my-courses')
  myCourses(@Request() req) {
    return this.enrollmentService.findMyCourses(req.user.userId);
  }

  @Get('course/:courseId')
  enrollmentForCourse(
    @Param('courseId') courseId: string,
    @Request() req,
  ) {
    return this.enrollmentService.findMyEnrollmentByCourse(
      req.user.userId,
      +courseId,
    );
  }
}
