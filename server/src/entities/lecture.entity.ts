import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity()
export class Lecture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'text', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'boolean', default: false })
  hasPdf: boolean;

  // Stored in DB (Postgres bytea). Keep out of default selects.
  @Column({ type: 'bytea', nullable: true, select: false })
  pdfData: Buffer | null;

  @Column({ type: 'varchar', length: 100, nullable: true, select: false })
  pdfMimeType: string | null;

  @ManyToOne(() => Course, (course) => course.lectures)
  course: Course;

  @Column()
  date: Date;
}
