// Utility to convert Google Drive share link to direct download link
function convertDriveLink(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/(.*?)(\/|$)/);
  if (!match) return url;
  const fileId = match[1];
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Lecture } from '../entities/lecture.entity';
import { UpdateLectureDto } from './dto/update-lecture.dto';

type CreateLectureInput = {
  courseId: number;
  title: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  date: Date;
};

@Injectable()
export class LecturesService {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepo: Repository<Lecture>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,

    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
  ) {}

  async create(dto: CreateLectureInput) {
    const content = dto.content?.trim() || null;
    const videoUrl = dto.videoUrl?.trim() || null;
    const pdfUrl = convertDriveLink(dto.pdfUrl?.trim() || null);

    if (!content && !videoUrl && !pdfUrl) {
      throw new BadRequestException(
        'Add lecture notes, a video link, and/or a PDF link.',
      );
    }

    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const lecture = this.lectureRepo.create({
      title: dto.title.trim(),
      content,
      videoUrl,
      pdfUrl,
      date: dto.date,
      course,
    });

    return this.lectureRepo.save(lecture);
  }

  async findByCourse(courseId: number, userId: number) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
      relations: ['user', 'course'],
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled');
    }

    return this.lectureRepo.find({
      where: { course: { id: courseId } },
      relations: ['course'],
      order: { date: 'ASC' },
    });
  }

  findAll() {
    return this.lectureRepo.find({
      relations: ['course'],
    });
  }

  async updateLecture(lectureId: number, dto: UpdateLectureDto) {
    const lecture = await this.lectureRepo.findOne({
      where: { id: lectureId },
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    if (dto.courseId !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      lecture.course = course;
    }

    if (dto.title !== undefined) lecture.title = dto.title;
    if (dto.content !== undefined) {
      lecture.content = dto.content?.trim() || null;
    }
    if (dto.videoUrl !== undefined) {
      lecture.videoUrl = dto.videoUrl?.trim() || null;
    }
    if (dto.pdfUrl !== undefined) {
      lecture.pdfUrl = convertDriveLink(dto.pdfUrl?.trim() || null);
    }
    if (dto.date !== undefined) lecture.date = new Date(dto.date);

    if (
      !lecture.content?.trim() &&
      !lecture.videoUrl?.trim() &&
      !lecture.pdfUrl?.trim()
    ) {
      throw new BadRequestException(
        'Lecture must keep at least notes, a video link, and/or a PDF link.',
      );
    }

    return this.lectureRepo.save(lecture);
  }

  async deleteLecture(lectureId: number) {
    const lecture = await this.lectureRepo.findOne({
      where: { id: lectureId },
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    await this.lectureRepo.remove(lecture);
    return { message: 'Lecture deleted successfully' };
  }
}
