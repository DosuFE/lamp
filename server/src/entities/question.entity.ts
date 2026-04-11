import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Test } from './test.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column('simple-array')
  options: string[];

  @Column()
  correctAnswer: string;

  @ManyToOne(() => Test, (test) => test.id)
  test: Test;
}
