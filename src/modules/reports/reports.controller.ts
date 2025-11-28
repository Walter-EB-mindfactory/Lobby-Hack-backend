import { Controller, Get, Query, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { VisitsReportQueryDto } from './dto/visits-report-query.dto';
import { StatsQueryDto } from './dto/stats-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.AUTORIZANTE, UserRole.RECEPCIONISTA)
  @ApiOperation({ 
    summary: 'Get today summary statistics',
    description: 'Returns summary of visits for the current day including total, average duration, pending unexpected, and visits by hour',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Summary retrieved successfully',
    schema: {
      example: {
        totalToday: 24,
        avgDurationMinutes: 37,
        pendingUnexpected: 3,
        byHour: [
          { hour: 8, count: 2 },
          { hour: 9, count: 4 },
          { hour: 10, count: 6 },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('visits-by-status')
  @Roles(UserRole.ADMIN, UserRole.AUTORIZANTE, UserRole.RECEPCIONISTA)
  @ApiOperation({ 
    summary: 'Get visits count by status',
    description: 'Returns count of visits grouped by status (PROGRAMADA, INGRESADA, FINALIZADA, PENDIENTE)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Visits by status retrieved successfully',
    schema: {
      example: {
        PROGRAMADA: 8,
        INGRESADA: 10,
        FINALIZADA: 3,
        PENDIENTE: 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  getVisitsByStatus() {
    return this.reportsService.getVisitsByStatus();
  }

  @Get('visits')
  @Roles(UserRole.ADMIN, UserRole.AUTORIZANTE, UserRole.RECEPCIONISTA)
  @ApiOperation({ 
    summary: 'Get historical visits with filters and pagination',
    description: 'Returns paginated list of visits with filters by date, authorizer, status, and type',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Visits retrieved successfully',
    schema: {
      example: {
        data: [],
        total: 150,
        page: 1,
        limit: 10,
        totalPages: 15,
      },
    },
  })
  getVisits(@Query() query: VisitsReportQueryDto) {
    return this.reportsService.getVisitsReport(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ 
    summary: 'Get aggregated visit statistics',
    description: 'Returns metrics like visits per day, approved, rejected, and unexpected visits',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalVisits: 150,
        visitsByDay: [
          { date: '2025-11-28', count: 15 },
          { date: '2025-11-27', count: 12 },
        ],
        byStatus: {
          pending: 5,
          approved: 100,
          rejected: 10,
          in_progress: 20,
          completed: 15,
        },
        byType: {
          scheduled: 120,
          unexpected: 30,
        },
        avgDurationHours: 2.5,
        peakHours: [
          { hour: 10, count: 25 },
          { hour: 14, count: 20 },
        ],
      },
    },
  })
  getStats(@Query() query: StatsQueryDto) {
    return this.reportsService.getStats(query);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get visit statistics' })
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
    return this.reportsService.getVisitStatistics(startDate, endDate);
  }

  @Get('visitors')
  @Roles(UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get visitor report by company' })
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  @ApiResponse({ status: 200, description: 'Visitor report retrieved successfully' })
  getVisitorReport(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
    return this.reportsService.getVisitorReport(startDate, endDate);
  }

  @Get('authorizers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get authorizer report' })
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  @ApiResponse({ status: 200, description: 'Authorizer report retrieved successfully' })
  getAuthorizerReport(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
    return this.reportsService.getAuthorizerReport(startDate, endDate);
  }

  @Get('audit')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit report' })
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  @ApiResponse({ status: 200, description: 'Audit report retrieved successfully' })
  getAuditReport(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
    return this.reportsService.getAuditReport(startDate, endDate);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @Header('Content-Type', 'text/plain')
  @ApiResponse({ status: 200, description: 'Metrics for Prometheus/Grafana' })
  async getMetrics() {
    return this.reportsService.getMetrics();
  }
}
