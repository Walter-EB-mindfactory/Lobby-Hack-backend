import { Controller, Get, Query, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
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
