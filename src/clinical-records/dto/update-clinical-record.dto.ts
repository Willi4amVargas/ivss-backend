import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  Validate,
} from 'class-validator';
import { FechaEgresoCoherenteConstraint } from './create-clinical-record.dto';
import { CreateClinicalRecordDto } from './create-clinical-record.dto';

/**
 * DTO para actualizar una historia clínica existente.
 * El caso más común es registrar el egreso del paciente.
 * Al proporcionar fecha_egreso, se calculará dias_hospitalizacion automáticamente.
 */
export class UpdateClinicalRecordDto extends PartialType(
  CreateClinicalRecordDto,
) {
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de egreso debe ser una fecha/hora válida en formato ISO 8601.',
    },
  )
  @Validate(FechaEgresoCoherenteConstraint)
  fecha_egreso?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estatus de mortalidad debe ser un booleano.' })
  estatus_mortalidad?: boolean;
}
