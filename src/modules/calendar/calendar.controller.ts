import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('calendar')
@ApiBearerAuth('JWT-auth')
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('scheduled')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get scheduled visits within a date range' })
  @ApiQuery({ name: 'startDate', type: Date, required: true })
  @ApiQuery({ name: 'endDate', type: Date, required: true })
  @ApiResponse({ status: 200, description: 'Scheduled visits retrieved successfully' })
  getScheduledVisits(@Query('startDate') startDate: Date, @Query('endDate') endDate: Date) {
    return this.calendarService.getScheduledVisits(startDate, endDate);
  }

  @Get('today')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN)
  @ApiOperation({ summary: "Get today's visits" })
  @ApiResponse({ status: 200, description: "Today's visits retrieved successfully" })
  getTodayVisits() {
    return this.calendarService.getTodayVisits();
  }

  @Get('upcoming')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get upcoming visits' })
  @ApiQuery({
    name: 'days',
    type: Number,
    required: false,
    description: 'Number of days ahead (default: 7)',
  })
  @ApiResponse({ status: 200, description: 'Upcoming visits retrieved successfully' })
  getUpcomingVisits(@Query('days') days?: number) {
    return this.calendarService.getUpcomingVisits(days);
  }

  @Get('pending-approvals')
  @Roles(UserRole.AUTORIZANTE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get visits pending approval' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved successfully' })
  getPendingApprovals() {
    return this.calendarService.getPendingApprovals();
  }
}
