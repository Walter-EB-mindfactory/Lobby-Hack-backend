import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Visit } from '../visits/visit.entity';
import { AuditLog } from '../visits/audit-log.entity';
import { User } from '../users/user.entity';
import { VisitStatus } from '../../common/enums/visit-status.enum';
import { VisitsReportQueryDto } from './dto/visits-report-query.dto';
import { StatsQueryDto } from './dto/stats-query.dto';
import { register, Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class ReportsService {
  private visitsCounter: Counter<string>;
  private activeVisitsGauge: Gauge<string>;
  private visitDurationHistogram: Histogram<string>;

  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    // Initialize Prometheus metrics
    this.visitsCounter = new Counter({
      name: 'visits_total',
      help: 'Total number of visits',
      labelNames: ['status', 'programada'],
    });

    this.activeVisitsGauge = new Gauge({
      name: 'visits_active',
      help: 'Number of active visits',
    });

    this.visitDurationHistogram = new Histogram({
      name: 'visit_duration_hours',
      help: 'Duration of visits in hours',
      buckets: [0.5, 1, 2, 4, 8, 24],
    });
  }

  async getVisitStatistics(startDate: Date, endDate: Date) {
    const visits = await this.visitsRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const statistics = {
      total: visits.length,
      byStatus: this.groupByStatus(visits),
      programmed: visits.filter((v) => v.programada).length,
      walkIn: visits.filter((v) => !v.programada).length,
      averageDuration: this.calculateAverageDuration(visits),
      peakHours: await this.calculatePeakHours(startDate, endDate),
    };

    return statistics;
  }

  private groupByStatus(visits: Visit[]) {
    return visits.reduce(
      (acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private calculateAverageDuration(visits: Visit[]) {
    const completedVisits = visits.filter((v) => v.checkinTime && v.checkoutTime);

    if (completedVisits.length === 0) return 0;

    const totalDuration = completedVisits.reduce((sum, visit) => {
      const duration =
        new Date(visit.checkoutTime).getTime() - new Date(visit.checkinTime).getTime();
      return sum + duration;
    }, 0);

    return totalDuration / completedVisits.length / (1000 * 60 * 60); // in hours
  }

  private async calculatePeakHours(startDate: Date, endDate: Date) {
    const visits = await this.visitsRepository.find({
      where: {
        checkinTime: Between(startDate, endDate),
      },
    });

    const hourCounts = visits.reduce(
      (acc, visit) => {
        if (visit.checkinTime) {
          const hour = new Date(visit.checkinTime).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  async getVisitorReport(startDate: Date, endDate: Date) {
    const visits = await this.visitsRepository
      .createQueryBuilder('visit')
      .where('visit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select('visit.company', 'company')
      .addSelect('COUNT(*)', 'visitCount')
      .groupBy('visit.company')
      .orderBy('visitCount', 'DESC')
      .limit(10)
      .getRawMany();

    return visits;
  }

  async getAuthorizerReport(startDate: Date, endDate: Date) {
    const visits = await this.visitsRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.authorizer', 'user')
      .where('visit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('visit.authorizedById IS NOT NULL')
      .select('user.email', 'authorizerEmail')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('COUNT(*)', 'authorizedCount')
      .groupBy('user.id')
      .addGroupBy('user.email')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('authorizedCount', 'DESC')
      .getRawMany();

    return visits;
  }

  async getAuditReport(startDate: Date, endDate: Date) {
    const logs = await this.auditLogRepository.find({
      where: {
        timestamp: Between(startDate, endDate),
      },
      relations: ['user'],
      order: {
        timestamp: 'DESC',
      },
      take: 100,
    });

    return logs;
  }

  async updateMetrics() {
    const activeVisits = await this.visitsRepository.count({
      where: { status: VisitStatus.IN_PROGRESS },
    });

    this.activeVisitsGauge.set(activeVisits);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = await this.visitsRepository.find({
      where: {
        createdAt: Between(today, new Date()),
      },
    });

    todayVisits.forEach((visit) => {
      this.visitsCounter.inc({
        status: visit.status,
        programada: visit.programada.toString(),
      });

      if (visit.checkinTime && visit.checkoutTime) {
        const duration =
          (new Date(visit.checkoutTime).getTime() - new Date(visit.checkinTime).getTime()) /
          (1000 * 60 * 60);
        this.visitDurationHistogram.observe(duration);
      }
    });
  }

  async getMetrics() {
    await this.updateMetrics();
    return register.metrics();
  }

  async getVisitsReport(query: VisitsReportQueryDto) {
    const {
      startDate,
      endDate,
      authorizerEmail,
      status,
      programada,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
    } = query;

    // Build where clause
    const where: FindOptionsWhere<Visit> = {};

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    if (status) {
      where.status = status;
    }

    if (programada !== undefined) {
      where.programada = programada;
    }

    // Query builder for complex filters
    const queryBuilder = this.visitsRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.authorizer', 'authorizer');

    if (startDate && endDate) {
      queryBuilder.andWhere('visit.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    if (authorizerEmail) {
      queryBuilder.andWhere('authorizer.email = :email', { email: authorizerEmail });
    }

    if (status) {
      queryBuilder.andWhere('visit.status = :status', { status });
    }

    if (programada !== undefined) {
      queryBuilder.andWhere('visit.programada = :programada', { programada });
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results with sorting
    const validSortFields = ['createdAt', 'scheduledDate', 'checkinTime', 'visitorName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const data = await queryBuilder
      .orderBy(`visit.${sortField}`, order)
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(query: StatsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    // Get all visits in range
    const visits = await this.visitsRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['authorizer'],
    });

    // Total visits
    const totalVisits = visits.length;

    // Visits by day
    const visitsByDay = this.groupVisitsByDay(visits);

    // By status
    const byStatus = visits.reduce(
      (acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // By type (scheduled vs unexpected)
    const byType = {
      scheduled: visits.filter((v) => v.programada).length,
      unexpected: visits.filter((v) => !v.programada).length,
    };

    // Average duration
    const completedVisits = visits.filter((v) => v.checkinTime && v.checkoutTime);
    let avgDurationHours = 0;

    if (completedVisits.length > 0) {
      const totalDuration = completedVisits.reduce((sum, visit) => {
        const duration =
          new Date(visit.checkoutTime).getTime() - new Date(visit.checkinTime).getTime();
        return sum + duration;
      }, 0);
      avgDurationHours = totalDuration / completedVisits.length / (1000 * 60 * 60);
    }

    // Peak hours
    const peakHours = this.calculatePeakHoursFromVisits(visits);

    // Top authorizers
    const authorizerStats = this.groupByAuthorizer(visits);

    return {
      totalVisits,
      visitsByDay,
      byStatus,
      byType,
      avgDurationHours: Math.round(avgDurationHours * 100) / 100,
      peakHours,
      topAuthorizers: authorizerStats.slice(0, 5),
    };
  }

  private groupVisitsByDay(visits: Visit[]) {
    const grouped = visits.reduce(
      (acc, visit) => {
        const date = new Date(visit.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculatePeakHoursFromVisits(visits: Visit[]) {
    const hourCounts = visits.reduce(
      (acc, visit) => {
        if (visit.checkinTime) {
          const hour = new Date(visit.checkinTime).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  private groupByAuthorizer(visits: Visit[]) {
    const grouped = visits.reduce(
      (acc, visit) => {
        if (visit.authorizer) {
          const key = visit.authorizer.email;
          if (!acc[key]) {
            acc[key] = {
              email: visit.authorizer.email,
              name: `${visit.authorizer.firstName || ''} ${visit.authorizer.lastName || ''}`.trim(),
              count: 0,
            };
          }
          acc[key].count++;
        }
        return acc;
      },
      {} as Record<string, { email: string; name: string; count: number }>,
    );

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all visits from today
    const todayVisits = await this.visitsRepository.find({
      where: {
        createdAt: Between(today, tomorrow),
      },
    });

    // Total visits today
    const totalToday = todayVisits.length;

    // Calculate average duration of completed visits
    const completedVisits = todayVisits.filter(
      (v) => v.checkinTime && v.checkoutTime,
    );

    let avgDurationMinutes = 0;
    if (completedVisits.length > 0) {
      const totalDuration = completedVisits.reduce((sum, visit) => {
        const duration =
          new Date(visit.checkoutTime).getTime() -
          new Date(visit.checkinTime).getTime();
        return sum + duration;
      }, 0);
      avgDurationMinutes = Math.round(
        totalDuration / completedVisits.length / (1000 * 60),
      );
    }

    // Pending unexpected visits
    const pendingUnexpected = todayVisits.filter(
      (v) => !v.programada && v.status === VisitStatus.PENDING,
    ).length;

    // Visits by hour
    const hourCounts: Record<number, number> = {};
    todayVisits.forEach((visit) => {
      if (visit.checkinTime) {
        const hour = new Date(visit.checkinTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const byHour = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }))
      .sort((a, b) => a.hour - b.hour);

    return {
      totalToday,
      avgDurationMinutes,
      pendingUnexpected,
      byHour,
    };
  }

  async getVisitsByStatus() {
    const visits = await this.visitsRepository.find();

    // Initialize result with all possible statuses
    const result: Record<string, number> = {
      PROGRAMADA: 0,
      INGRESADA: 0,
      FINALIZADA: 0,
      PENDIENTE: 0,
    };

    visits.forEach((visit) => {
      // Count programmed visits
      if (visit.programada) {
        result.PROGRAMADA += 1;
      }

      // Count by status
      if (visit.status === VisitStatus.PENDING) {
        result.PENDIENTE += 1;
      } else if (
        visit.status === VisitStatus.IN_PROGRESS ||
        visit.status === VisitStatus.APPROVED
      ) {
        result.INGRESADA += 1;
      } else if (visit.status === VisitStatus.COMPLETED) {
        result.FINALIZADA += 1;
      }
    });

    return result;
  }
}
