import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './users.entity';
import { Test } from './test.entity';

@Entity()
export class Result {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Test, (test) => test.id)
  test: Test;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  totalQuestions: number;

  @Column({ type: 'float', default: 0 })
  percentage: number;

  @Column({ default: 'F' })
  grade: string;

  @Column({ default: 0 })
  tabSwitchCount: number;

  @Column({ default: 0 })
  webcamOffCount: number;

  @Column({ default: false })
  malpracticeFlag: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  timeSpentSeconds?: number;

  @Column({ nullable: true })
  timeLimitSeconds?: number;

  @Column({ default: false })
  isFinalized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;
}
