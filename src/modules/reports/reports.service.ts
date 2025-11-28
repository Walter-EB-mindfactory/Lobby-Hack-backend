import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Visit } from '../visits/visit.entity';
import { AuditLog } from '../visits/audit-log.entity';
import { VisitStatus } from '../../common/enums/visit-status.enum';
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
}
