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
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * POST /patients
   * Registra un nuevo paciente en el sistema.
   * Falla con 409 si la cédula o el número de historia ya existen.
   */
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo paciente' })
  @ApiResponse({
    status: 201,
    description: 'Paciente registrado exitosamente.',
  })
  @ApiResponse({
    status: 409,
    description: 'La cédula o el número de historia ya existen.',
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  /**
   * GET /patients
   * Retorna todos los pacientes ordenados alfabéticamente.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los pacientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes devuelta exitosamente.',
  })
  findAll() {
    return this.patientsService.findAll();
  }

  /**
   * GET /patients/cedula/:cedula
   * Busca un paciente por su cédula de identidad.
   */
  @Get('cedula/:cedula')
  @ApiOperation({ summary: 'Buscar paciente por cédula' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  findByCedula(@Param('cedula') cedula: string) {
    return this.patientsService.findByCedula(cedula);
  }

  /**
   * GET /patients/cedula/search/:cedula
   * Busca un paciente por su cédula de identidad.
   */
  @Get('cedula/search/:cedula')
  @ApiOperation({ summary: 'Buscar pacientes por cédula' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  searchByCedula(@Param('cedula') cedula: string) {
    return this.patientsService.searchByCedula(cedula);
  }

  /**
   * GET /history/:historia
   * Busca un paciente por su numero de historia
   */
  @Get('history/:historia')
  @ApiOperation({ summary: 'Buscar paciente por cédula' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  findByHistoryNumber(@Param('historia') historia: string) {
    return this.patientsService.findByHistoryNumber(historia);
  }

  /**
   * GET /history/search/:historia
   * Busca un paciente por su numero de historia
   */
  @Get('history/search/:historia')
  @ApiOperation({ summary: 'Buscar pacientes por cédula' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  searchByHistoryNumber(@Param('historia') historia: string) {
    return this.patientsService.searchByHistoryNumber(historia);
  }

  /**
   * GET /patients/:id
   * Retorna un paciente por su UUID interno, incluyendo sus historias clínicas.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar paciente por ID' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  /**
   * PATCH /patients/:id
   * Actualiza los datos de un paciente.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de paciente' })
  @ApiResponse({
    status: 200,
    description: 'Paciente actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, dto);
  }

  /**
   * DELETE /patients/:id
   * Elimina un paciente del sistema.
   * RESTRICCIÓN: No se puede eliminar si tiene historias clínicas asociadas (RESTRICT en FK).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar paciente' })
  @ApiResponse({ status: 204, description: 'Paciente eliminado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: El paciente tiene historias clínicas asociadas.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }

  /**
   * DELETE /patients/:id
   * Elimina el numero de historia del paciente del sistema.
   */
  @Delete('history/:id/:history')
  @ApiOperation({ summary: 'Eliminar nro de historia del paciente' })
  @ApiResponse({ status: 204, description: 'Nro de historia eliminado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: El paciente tiene historias clínicas asociadas.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeHistoryNumber(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('history') history: string,
  ) {
    return this.patientsService.removeHistoryNumber(id, history);
  }
}
