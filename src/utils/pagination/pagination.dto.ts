import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Pagina que se quiere buscar',
    example: 1,
    default: 1,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 10,
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Limite de elementos a mostrar (max 1000)',
    example: 10,
    default: 10,
  })
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : 10,
  )
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit: number = 10;
}
