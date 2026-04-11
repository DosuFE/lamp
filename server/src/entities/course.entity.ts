import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Lecture } from './lecture.entity';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  department: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Lecture, (lecture) => lecture.course)
  lectures: Lecture[];
}
