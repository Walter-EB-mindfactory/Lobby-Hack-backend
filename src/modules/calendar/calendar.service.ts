import { Injectable } from '@nestjs/common';
import { VisitsService } from '../visits/visits.service';
import { VisitStatus } from '../../common/enums/visit-status.enum';

@Injectable()
export class CalendarService {
  constructor(private visitsService: VisitsService) {}

  async getScheduledVisits(startDate: Date, endDate: Date) {
    return this.visitsService.findAll({
      programada: true,
      startDate,
      endDate,
    });
  }

  async getTodayVisits() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.visitsService.findAll({
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  async getUpcomingVisits(days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.visitsService.findAll({
      programada: true,
      status: VisitStatus.APPROVED,
      startDate,
      endDate,
    });
  }

  async getPendingApprovals() {
    return this.visitsService.findAll({
      status: VisitStatus.PENDING,
    });
  }
}
