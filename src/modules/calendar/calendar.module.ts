import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { VisitsModule } from '../visits/visits.module';

@Module({
  imports: [VisitsModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
