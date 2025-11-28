import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { ReserveCalendarDto } from './dto/reserve-calendar.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
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

  @Post('reserve')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({
    summary: 'Create event in Google Calendar for scheduled visit',
    description: 'Creates a calendar event and validates no overlap in the same area',
  })
  @ApiResponse({
    status: 201,
    description: 'Calendar event created successfully',
    schema: {
      example: {
        eventId: 'abc123xyz',
        eventLink: 'https://calendar.google.com/event?eid=abc123xyz',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or overlap detected' })
  reserveCalendar(@Body() reserveDto: ReserveCalendarDto) {
    return this.calendarService.reserveCalendar(reserveDto);
  }

  @Post('availability')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({
    summary: 'Check availability of authorizer for a specific date',
    description: 'Returns busy time slots to avoid scheduling conflicts',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability checked successfully',
    schema: {
      example: {
        available: false,
        busySlots: [
          {
            start: '2025-11-29T10:00:00.000Z',
            end: '2025-11-29T11:00:00.000Z',
          },
        ],
      },
    },
  })
  checkAvailability(@Body() checkDto: CheckAvailabilityDto) {
    return this.calendarService.checkAvailability(checkDto);
  }

  @Delete('event/:visitId')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({
    summary: 'Cancel event in Google Calendar',
    description: 'Deletes the calendar event and updates visit status',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar event cancelled successfully',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Visit or event not found' })
  cancelEvent(@Param('visitId') visitId: string) {
    return this.calendarService.cancelCalendarEvent(visitId);
  }
}
