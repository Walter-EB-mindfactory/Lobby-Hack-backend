import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { google } from 'googleapis';
import { VisitsService } from '../visits/visits.service';
import { Visit } from '../visits/visit.entity';
import { VisitStatus } from '../../common/enums/visit-status.enum';
import { ReserveCalendarDto } from './dto/reserve-calendar.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private visitsService: VisitsService,
    private configService: ConfigService,
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
  ) {}

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

  async reserveCalendar(reserveDto: ReserveCalendarDto): Promise<{ eventId: string; eventLink: string }> {
    try {
      // Validar que la visita existe
      const visit = await this.visitsRepository.findOne({
        where: { id: reserveDto.visitId },
      });

      if (!visit) {
        throw new BadRequestException('Visit not found');
      }

      // Validar solapamiento en la misma ubicación
      if (reserveDto.location) {
        const hasOverlap = await this.checkOverlap(
          reserveDto.startDateTime,
          reserveDto.endDateTime,
          reserveDto.location,
        );

        if (hasOverlap) {
          throw new BadRequestException(
            'There is already a visit scheduled for this location at the selected time',
          );
        }
      }

      // Crear evento en Google Calendar
      const oauth2Client = this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: reserveDto.summary,
        description: reserveDto.description,
        location: reserveDto.location || '',
        start: {
          dateTime: reserveDto.startDateTime,
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
          dateTime: reserveDto.endDateTime,
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        attendees: [
          { email: reserveDto.authorizerEmail },
          ...(reserveDto.attendees || []).map((email) => ({ email })),
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 día antes
            { method: 'popup', minutes: 30 }, // 30 minutos antes
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Enviar notificaciones a todos los asistentes
      });

      // Guardar el ID del evento en la visita
      visit.googleCalendarEventId = response.data.id;
      visit.location = reserveDto.location;
      await this.visitsRepository.save(visit);

      this.logger.log(`Calendar event created: ${response.data.id} for visit ${visit.id}`);

      return {
        eventId: response.data.id,
        eventLink: response.data.htmlLink || '',
      };
    } catch (error) {
      this.logger.error(`Failed to create calendar event: ${error.message}`);
      throw new BadRequestException(`Failed to create calendar event: ${error.message}`);
    }
  }

  async checkAvailability(checkDto: CheckAvailabilityDto): Promise<{
    available: boolean;
    busySlots: Array<{ start: string; end: string }>;
  }> {
    try {
      const startOfDay = new Date(checkDto.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(checkDto.date);
      endOfDay.setHours(23, 59, 59, 999);

      // Buscar visitas existentes para ese día y autorizante
      const query = this.visitsRepository
        .createQueryBuilder('visit')
        .leftJoinAndSelect('visit.authorizer', 'authorizer')
        .where('visit.scheduledDate BETWEEN :start AND :end', {
          start: startOfDay,
          end: endOfDay,
        })
        .andWhere('authorizer.email = :email', { email: checkDto.authorizerEmail })
        .andWhere('visit.status != :cancelled', { cancelled: VisitStatus.REJECTED });

      if (checkDto.location) {
        query.andWhere('visit.location = :location', { location: checkDto.location });
      }

      const busyVisits = await query.getMany();

      const busySlots = busyVisits.map((visit) => ({
        start: visit.scheduledDate?.toISOString() || '',
        end: new Date(visit.scheduledDate.getTime() + 60 * 60 * 1000).toISOString(), // +1 hora por defecto
      }));

      return {
        available: busySlots.length === 0,
        busySlots,
      };
    } catch (error) {
      this.logger.error(`Failed to check availability: ${error.message}`);
      throw new BadRequestException(`Failed to check availability: ${error.message}`);
    }
  }

  async cancelCalendarEvent(visitId: string): Promise<{ success: boolean }> {
    try {
      const visit = await this.visitsRepository.findOne({
        where: { id: visitId },
      });

      if (!visit) {
        throw new BadRequestException('Visit not found');
      }

      if (!visit.googleCalendarEventId) {
        this.logger.warn(`Visit ${visitId} has no calendar event associated`);
        return { success: true };
      }

      // Cancelar evento en Google Calendar
      const oauth2Client = this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: visit.googleCalendarEventId,
        sendUpdates: 'all', // Notificar a todos los asistentes
      });

      // Limpiar el ID del evento
      visit.googleCalendarEventId = null;
      visit.status = VisitStatus.REJECTED;
      await this.visitsRepository.save(visit);

      this.logger.log(`Calendar event deleted: ${visit.googleCalendarEventId} for visit ${visitId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to cancel calendar event: ${error.message}`);
      throw new BadRequestException(`Failed to cancel calendar event: ${error.message}`);
    }
  }

  async updateCalendarEvent(visitId: string, updates: Partial<ReserveCalendarDto>): Promise<{ success: boolean }> {
    try {
      const visit = await this.visitsRepository.findOne({
        where: { id: visitId },
      });

      if (!visit || !visit.googleCalendarEventId) {
        throw new BadRequestException('Visit or calendar event not found');
      }

      const oauth2Client = this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const updatePayload: any = {};

      if (updates.summary) updatePayload.summary = updates.summary;
      if (updates.description) updatePayload.description = updates.description;
      if (updates.location) updatePayload.location = updates.location;

      if (updates.startDateTime && updates.endDateTime) {
        updatePayload.start = {
          dateTime: updates.startDateTime,
          timeZone: 'America/Argentina/Buenos_Aires',
        };
        updatePayload.end = {
          dateTime: updates.endDateTime,
          timeZone: 'America/Argentina/Buenos_Aires',
        };
      }

      await calendar.events.patch({
        calendarId: 'primary',
        eventId: visit.googleCalendarEventId,
        requestBody: updatePayload,
        sendUpdates: 'all',
      });

      this.logger.log(`Calendar event updated: ${visit.googleCalendarEventId} for visit ${visitId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update calendar event: ${error.message}`);
      throw new BadRequestException(`Failed to update calendar event: ${error.message}`);
    }
  }

  private async checkOverlap(startDateTime: string, endDateTime: string, location: string): Promise<boolean> {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    const overlappingVisits = await this.visitsRepository
      .createQueryBuilder('visit')
      .where('visit.location = :location', { location })
      .andWhere('visit.scheduledDate < :end', { end })
      .andWhere('visit.scheduledDate > :start', { start })
      .andWhere('visit.status != :cancelled', { cancelled: VisitStatus.REJECTED })
      .getCount();

    return overlappingVisits > 0;
  }

  private getOAuth2Client() {
    // TODO: En producción, obtener el token del usuario autenticado
    // Por ahora usa credenciales de service account o OAuth2 del sistema
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_CALLBACK_URL'),
    );

    // TODO: Implementar refresh token storage y retrieval
    // oauth2Client.setCredentials({
    //   access_token: 'token-del-usuario',
    //   refresh_token: 'refresh-token-del-usuario',
    // });

    return oauth2Client;
  }
}
