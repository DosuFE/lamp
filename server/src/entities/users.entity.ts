import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', name: 'fullname', length: 30, nullable: true })
  fullName: string | null;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  matricNo: number;

  @Column()
  department: string;

  @Column({ default: 'student' })
  role: 'student' | 'admin';

  @Column({ type: 'text', nullable: true })
  faceImageBase64: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  facePrint: string | null;

  @Column({ type: 'boolean', default: true })
  faceVerificationRequired: boolean;

  @Column({ type: 'int', default: 0 })
  faceVerificationFailedAttempts: number;

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;
}
