import { PartialType } from '@nestjs/swagger';
import { CreateVisitDto } from './create-visit.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from '../../../common/enums/visit-status.enum';

export class UpdateVisitDto extends PartialType(CreateVisitDto) {
  @ApiPropertyOptional({ enum: VisitStatus })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkinTime?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkoutTime?: Date;
}
