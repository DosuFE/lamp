import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Result } from '../entities/result.entity';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Result]), AuthModule],
  controllers: [ResultsController],
  providers: [ResultsService],
})
export class ResultsModule {}
