import { IsString, IsOptional, IsBoolean, IsDateString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateVisitDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  visitorName: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  dni: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: '+54 11 1234-5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'visitor@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Reunión con área de ventas' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  programada?: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizedById?: string;

  @ApiPropertyOptional({ example: 'authorizer@example.com' })
  @IsOptional()
  @IsEmail()
  authorizerEmail?: string;

  @ApiPropertyOptional({ example: 'Visitor debe traer laptop' })
  @IsOptional()
  @IsString()
  notes?: string;
}
