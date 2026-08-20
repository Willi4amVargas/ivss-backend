import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum FindOneType {
  ID = 'id',
  DOCUMENT_ID = 'document_id',
  HISTORY_NUMBER = 'history_number',
}

export class FindOneDto {
  @ApiPropertyOptional({
    description: 'Tipo de valor a buscar',
    enum: FindOneType,
  })
  @IsEnum(FindOneType)
  @IsOptional()
  type: FindOneType = FindOneType.ID;
}
