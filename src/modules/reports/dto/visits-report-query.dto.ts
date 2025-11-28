import { IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VisitStatus } from '../../../common/enums/visit-status.enum';

export class VisitsReportQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio',
    example: '2025-11-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin',
    example: '2025-11-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Email del autorizante',
    example: 'autorizante@empresa.com',
  })
  @IsOptional()
  @IsString()
  authorizerEmail?: string;

  @ApiPropertyOptional({
    description: 'Estado de la visita',
    enum: VisitStatus,
  })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({
    description: 'Tipo de visita (programada o inesperada)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  programada?: boolean;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    example: 'createdAt',
    enum: ['createdAt', 'scheduledDate', 'checkinTime', 'visitorName'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Orden de clasificación',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
