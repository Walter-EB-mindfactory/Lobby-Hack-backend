import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Visit } from './visit.entity';
import { AuditLog } from './audit-log.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CheckinDto } from './dto/checkin.dto';
import { VisitStatus } from '../../common/enums/visit-status.enum';

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createVisitDto: CreateVisitDto, userId?: string): Promise<Visit> {
    const visit = this.visitsRepository.create(createVisitDto);
    const savedVisit = await this.visitsRepository.save(visit);

    await this.createAuditLog('CREATE_VISIT', userId, 'Visit', savedVisit.id, {
      visitorName: savedVisit.visitorName,
      dni: savedVisit.dni,
    });

    return savedVisit;
  }

  async getTodayVisits(): Promise<{
    scheduled: Visit[];
    unexpected: Visit[];
    total: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Visitas programadas para hoy
    const scheduled = await this.visitsRepository.find({
      where: {
        programada: true,
        scheduledDate: Between(startOfDay, endOfDay),
      },
      relations: ['authorizer'],
      order: { scheduledDate: 'ASC' },
    });

    // Visitas inesperadas (check-in hoy)
    const unexpected = await this.visitsRepository.find({
      where: {
        programada: false,
        checkinTime: Between(startOfDay, endOfDay),
      },
      relations: ['authorizer'],
      order: { checkinTime: 'DESC' },
    });

    return {
      scheduled,
      unexpected,
      total: scheduled.length + unexpected.length,
    };
  }

  async findAll(filters?: {
    status?: VisitStatus;
    programada?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Visit[]> {
    const query = this.visitsRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.authorizer', 'authorizer');

    if (filters?.status) {
      query.andWhere('visit.status = :status', { status: filters.status });
    }

    if (filters?.programada !== undefined) {
      query.andWhere('visit.programada = :programada', { programada: filters.programada });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('visit.scheduledDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.orderBy('visit.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Visit> {
    const visit = await this.visitsRepository.findOne({
      where: { id },
      relations: ['authorizer'],
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    return visit;
  }

  async update(id: string, updateVisitDto: UpdateVisitDto, userId?: string): Promise<Visit> {
    const visit = await this.findOne(id);

    Object.assign(visit, updateVisitDto);
    const updatedVisit = await this.visitsRepository.save(visit);

    await this.createAuditLog('UPDATE_VISIT', userId, 'Visit', id, updateVisitDto);

    return updatedVisit;
  }

  async checkinVisitor(checkinDto: CheckinDto, userId?: string): Promise<Visit & { notificationSent: boolean }> {
    // Buscar si existe una visita programada con ese DNI para hoy
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let visit = await this.visitsRepository.findOne({
      where: {
        dni: checkinDto.dni,
        programada: true,
        scheduledDate: Between(startOfDay, endOfDay),
      },
      relations: ['authorizer'],
    });

    let isProgrammed = false;

    if (visit) {
      // Visita programada encontrada - hacer check-in
      isProgrammed = true;
      visit.checkinTime = new Date();
      visit.status = VisitStatus.PENDING; // Espera aprobación del autorizante
      
      this.logger.log(`Scheduled visit found for DNI ${checkinDto.dni}. Checking in.`);
    } else {
      // Visita inesperada - crear nueva visita
      visit = this.visitsRepository.create({
        ...checkinDto,
        programada: false,
        checkinTime: new Date(),
        status: VisitStatus.PENDING, // Espera aprobación del autorizante
      });

      this.logger.log(`Unexpected visit for ${checkinDto.visitorName}. Creating new visit.`);
    }

    const savedVisit = await this.visitsRepository.save(visit);

    // Registrar en audit log
    await this.createAuditLog(
      isProgrammed ? 'CHECKIN_SCHEDULED_VISIT' : 'CHECKIN_UNEXPECTED_VISIT',
      userId,
      'Visit',
      savedVisit.id,
      {
        visitorName: savedVisit.visitorName,
        dni: savedVisit.dni,
        checkinTime: savedVisit.checkinTime,
        isProgrammed,
      },
    );

    // Enviar notificación al autorizante
    const notificationSent = await this.sendNotificationToAuthorizer(savedVisit);

    return {
      ...savedVisit,
      notificationSent,
    };
  }

  async checkin(id: string, userId?: string): Promise<Visit> {
    const visit = await this.findOne(id);

    if (visit.status === VisitStatus.COMPLETED) {
      throw new Error('Visit already completed');
    }

    visit.checkinTime = new Date();
    visit.status = VisitStatus.IN_PROGRESS;

    const updatedVisit = await this.visitsRepository.save(visit);

    await this.createAuditLog('CHECKIN_VISIT', userId, 'Visit', id, {
      checkinTime: visit.checkinTime,
    });

    return updatedVisit;
  }

  private async sendNotificationToAuthorizer(visit: Visit): Promise<boolean> {
    try {
      // TODO: Implementar envío de notificación real (email, push, webhook, etc.)
      // Por ahora, solo logueamos
      this.logger.log(
        `📧 Notification sent to authorizer ${visit.authorizedById} for visitor ${visit.visitorName}`,
      );
      
      // Simular envío exitoso
      // En producción aquí iría:
      // - Envío de email
      // - Push notification
      // - Webhook a sistema de terceros
      // - etc.
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      return false;
    }
  }

  async checkout(id: string, userId?: string): Promise<Visit> {
    const visit = await this.findOne(id);

    if (!visit.checkinTime) {
      throw new Error('Visit must be checked in first');
    }

    visit.checkoutTime = new Date();
    visit.status = VisitStatus.COMPLETED;

    const updatedVisit = await this.visitsRepository.save(visit);

    await this.createAuditLog('CHECKOUT_VISIT', userId, 'Visit', id, {
      checkoutTime: visit.checkoutTime,
    });

    return updatedVisit;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const visit = await this.findOne(id);

    await this.createAuditLog('DELETE_VISIT', userId, 'Visit', id, {
      visitorName: visit.visitorName,
      dni: visit.dni,
    });

    await this.visitsRepository.remove(visit);
  }

  private async createAuditLog(
    action: string,
    userId: string,
    entityType: string,
    entityId: string,
    details: any,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      action,
      userId,
      entityType,
      entityId,
      details,
    });

    await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (filters?.entityType) {
      query.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters?.entityId) {
      query.andWhere('log.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.orderBy('log.timestamp', 'DESC').getMany();
  }
}
