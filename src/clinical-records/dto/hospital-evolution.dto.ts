import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHospitalEvolutionDto {
  @ApiProperty({
    description: 'Identificador único (UUID) del registro de admisión asociado',
    example: '8b7c4142-2d17-4952-97a5-7186d38e2101',
  })
  @IsUUID()
  @IsNotEmpty()
  admission_record_id: string;

  @ApiProperty({
    description:
      'Nota de evolución clínica detallada sobre el estado actual y cambios del paciente',
    example:
      'El paciente presenta una evolución favorable. Tolerando la vía oral, afebril en las últimas 24 horas y con signos vitales estables. Se planifica disminución de la dosis de analgésicos.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateHospitalEvolutionDto {
  @ApiPropertyOptional({
    description:
      'Nota de evolución clínica detallada sobre el estado actual y cambios del paciente',
    example:
      'El paciente presenta una evolución favorable. Tolerando la vía oral, afebril en las últimas 24 horas y con signos vitales estables. Se planifica disminución de la dosis de analgésicos.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
