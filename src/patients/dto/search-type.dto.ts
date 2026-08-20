import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SearchType {
  DOCUMENT_ID = 'document_id',
  NAME = 'name',
  HISTORY_NUMBER = 'history_number',
}

export class SearchTypeDto {
  @ApiProperty({
    description: 'Valor a buscar',
  })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiPropertyOptional({
    description: 'Tipo de valor a buscar',
    enum: SearchType,
  })
  @IsEnum(SearchType)
  @IsOptional()
  type: SearchType = SearchType.DOCUMENT_ID;
}
