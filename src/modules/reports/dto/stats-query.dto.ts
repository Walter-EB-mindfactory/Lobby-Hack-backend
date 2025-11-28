import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StatsQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio para las estadísticas',
    example: '2025-11-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para las estadísticas',
    example: '2025-11-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
