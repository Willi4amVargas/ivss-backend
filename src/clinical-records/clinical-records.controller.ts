import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClinicalRecordsService } from './clinical-records.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';

@ApiTags('clinical-records')
@Controller('clinical-records')
export class ClinicalRecordsController {
  constructor(
    private readonly clinicalRecordsService: ClinicalRecordsService,
  ) {}

  /**
   * POST /clinical-records
   * Registra un nuevo ingreso hospitalario.
   * Calcula automáticamente edad_ingreso y dias_hospitalizacion.
   */
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo ingreso hospitalario' })
  @ApiResponse({ status: 201, description: 'Historia clínica registrada exitosamente.' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClinicalRecordDto) {
    return this.clinicalRecordsService.create(dto);
  }

  /**
   * GET /clinical-records
   * Retorna todas las historias clínicas con paciente y diagnósticos.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las historias clínicas' })
  @ApiResponse({ status: 200, description: 'Lista de historias clínicas devuelta exitosamente.' })
  findAll() {
    return this.clinicalRecordsService.findAll();
  }

  /**
   * GET /clinical-records/patient/:patientId
   * Retorna todas las hospitalizaciones de un paciente específico.
   */
  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Obtener hospitalizaciones de un paciente' })
  @ApiResponse({ status: 200, description: 'Hospitalizaciones devueltas exitosamente.' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.clinicalRecordsService.findByPatient(patientId);
  }

  /**
   * GET /clinical-records/:id
   * Retorna una historia clínica con su paciente y diagnósticos.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una historia clínica por ID' })
  @ApiResponse({ status: 200, description: 'Historia clínica encontrada.' })
  @ApiResponse({ status: 404, description: 'Historia clínica no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.findOne(id);
  }

  /**
   * PATCH /clinical-records/:id
   * Actualiza una historia clínica. Uso principal: registrar el egreso.
   * Al recibir fecha_egreso, se recalcula dias_hospitalizacion automáticamente.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una historia clínica (Ej: registro de egreso)' })
  @ApiResponse({ status: 200, description: 'Historia clínica actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Historia clínica no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalRecordDto,
  ) {
    return this.clinicalRecordsService.update(id, dto);
  }

  /**
   * DELETE /clinical-records/:id
   * Elimina una historia clínica y sus diagnósticos (CASCADE).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una historia clínica' })
  @ApiResponse({ status: 204, description: 'Historia clínica eliminada.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.remove(id);
  }
}
