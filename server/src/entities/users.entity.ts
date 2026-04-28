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
}
