import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: '1//0gabcdef...' })
  @IsString()
  refreshToken: string;
}
