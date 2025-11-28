import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CheckinDto } from './dto/checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { VisitStatus } from '../../common/enums/visit-status.enum';

@ApiTags('visits')
@ApiBearerAuth('JWT-auth')
@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new visit' })
  @ApiResponse({ status: 201, description: 'Visit created successfully' })
  create(@Body() createVisitDto: CreateVisitDto, @CurrentUser() user: any) {
    return this.visitsService.create(createVisitDto, user.id);
  }

  @Get('today')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get all visits for today (scheduled and unexpected)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Today visits retrieved successfully',
    schema: {
      example: {
        scheduled: [],
        unexpected: [],
        total: 0,
      },
    },
  })
  getTodayVisits() {
    return this.visitsService.getTodayVisits();
  }

  @Get()
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get all visits with optional filters' })
  @ApiQuery({ name: 'status', enum: VisitStatus, required: false })
  @ApiQuery({ name: 'programada', type: Boolean, required: false })
  @ApiQuery({ name: 'startDate', type: Date, required: false })
  @ApiQuery({ name: 'endDate', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Visits retrieved successfully' })
  findAll(
    @Query('status') status?: VisitStatus,
    @Query('programada') programada?: boolean,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.visitsService.findAll({ status, programada, startDate, endDate });
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'startDate', type: Date, required: false })
  @ApiQuery({ name: 'endDate', type: Date, required: false })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  getAuditLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.visitsService.getAuditLogs({ entityType, entityId, startDate, endDate });
  }

  @Get(':id')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN, UserRole.AUTORIZANTE)
  @ApiOperation({ summary: 'Get visit by ID' })
  @ApiResponse({ status: 200, description: 'Visit found' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update visit' })
  @ApiResponse({ status: 200, description: 'Visit updated successfully' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  update(
    @Param('id') id: string,
    @Body() updateVisitDto: UpdateVisitDto,
    @CurrentUser() user: any,
  ) {
    return this.visitsService.update(id, updateVisitDto, user.id);
  }

  @Post('checkin')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Check-in a visitor (scheduled or unexpected)',
    description: 'Creates a new visit or checks-in an existing scheduled visit. Sends notification to authorizer.',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Visitor checked in successfully. Notification sent to authorizer.',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        visitorName: 'Juan Pérez',
        dni: '12345678',
        programada: false,
        status: 'pending',
        checkinTime: '2025-11-28T16:45:00.000Z',
        notificationSent: true,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  checkinVisitor(@Body() checkinDto: CheckinDto, @CurrentUser() user: any) {
    return this.visitsService.checkinVisitor(checkinDto, user.id);
  }

  @Post(':id/checkin')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check-in an existing scheduled visit by ID' })
  @ApiResponse({ status: 200, description: 'Visit checked in successfully' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  checkin(@Param('id') id: string, @CurrentUser() user: any) {
    return this.visitsService.checkin(id, user.id);
  }

  @Post(':id/checkout')
  @Roles(UserRole.RECEPCIONISTA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check-out a visit' })
  @ApiResponse({ status: 200, description: 'Visit checked out successfully' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  checkout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.visitsService.checkout(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete visit (Admin only)' })
  @ApiResponse({ status: 200, description: 'Visit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.visitsService.remove(id, user.id);
  }
}
