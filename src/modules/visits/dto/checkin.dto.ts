import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckinDto {
  @ApiProperty({
    description: 'Nombre del visitante',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @ApiProperty({
    description: 'DNI del visitante',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  dni: string;

  @ApiPropertyOptional({
    description: 'Empresa del visitante',
    example: 'Acme Corp',
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del visitante',
    example: '+54 9 11 1234-5678',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Email del visitante',
    example: 'juan@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Motivo de la visita',
    example: 'Reunión con equipo de ventas',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: 'ID del autorizante (usuario que debe aprobar)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  authorizedById: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Visitante llega en auto, necesita estacionamiento',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
