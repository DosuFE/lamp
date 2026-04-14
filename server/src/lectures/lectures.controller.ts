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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LecturesService } from './lectures.service';

@Controller('lectures')
export class LecturesController {
  constructor(private readonly lectureService: LecturesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: any, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can create lecture');
    }

    return this.lectureService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: number, @Request() req) {
    return this.lectureService.findByCourse(+courseId, req.user.userId);
  }

  @Get()
  findAll() {
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
