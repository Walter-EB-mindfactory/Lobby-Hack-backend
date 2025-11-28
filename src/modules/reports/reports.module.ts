import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Visit } from '../visits/visit.entity';
import { AuditLog } from '../visits/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, AuditLog])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
