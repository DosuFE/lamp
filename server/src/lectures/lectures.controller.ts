import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { CreateLectureDto } from './dto/create-lecture.dto';
import { LecturesService } from './lectures.service';

@Controller('lectures')
export class LecturesController {
  constructor(private readonly lectureService: LecturesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  create(@Body() dto: CreateLectureDto, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can create lecture');
    }

    return this.lectureService.create({
      courseId: dto.courseId,
      title: dto.title,
      content: dto.content,
      videoUrl: dto.videoUrl,
      date: new Date(dto.date),
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: number, @Request() req) {
    return this.lectureService.findByCourse(+courseId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can list all lectures');
    }

    return this.lectureService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  updateLecture(@Param('id') id: string, @Body() dto: any, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can update lecture');
    }

    return this.lectureService.updateLecture(+id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  deleteLecture(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can delete lecture');
    }

    return this.lectureService.deleteLecture(+id);
  }
}
