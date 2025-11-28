import { IsDateString, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'Email del autorizante',
    example: 'autorizante@empresa.com',
  })
  @IsString()
  @IsNotEmpty()
  authorizerEmail: string;

  @ApiProperty({
    description: 'Fecha para verificar disponibilidad (ISO 8601)',
    example: '2025-11-29',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    description: 'Ubicación/Área específica',
    example: 'Oficina Central',
  })
  @IsString()
  @IsOptional()
  location?: string;
}
