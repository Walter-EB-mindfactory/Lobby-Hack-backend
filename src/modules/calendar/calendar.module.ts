import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { VisitsModule } from '../visits/visits.module';
import { Visit } from '../visits/visit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit]),
    VisitsModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
