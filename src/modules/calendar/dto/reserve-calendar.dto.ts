import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReserveCalendarDto {
  @ApiProperty({
    description: 'ID de la visita',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  visitId: string;

  @ApiProperty({
    description: 'Título del evento',
    example: 'Visita de Juan Pérez - Acme Corp',
  })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiProperty({
    description: 'Descripción del evento',
    example: 'Reunión con equipo de ventas',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio (ISO 8601)',
    example: '2025-11-29T10:00:00-03:00',
  })
  @IsDateString()
  @IsNotEmpty()
  startDateTime: string;

  @ApiProperty({
    description: 'Fecha y hora de fin (ISO 8601)',
    example: '2025-11-29T11:00:00-03:00',
  })
  @IsDateString()
  @IsNotEmpty()
  endDateTime: string;

  @ApiProperty({
    description: 'Email del autorizante',
    example: 'autorizante@empresa.com',
  })
  @IsString()
  @IsNotEmpty()
  authorizerEmail: string;

  @ApiPropertyOptional({
    description: 'Ubicación/Área',
    example: 'Oficina Central - Piso 5',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Emails adicionales de asistentes',
    example: ['asistente1@empresa.com', 'asistente2@empresa.com'],
  })
  @IsOptional()
  attendees?: string[];
}
