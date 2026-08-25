import {
  BadRequestException,
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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
import {
  PaginationQueryParamsDto,
  Scope,
} from '../utils/pagination/pagination.dto';
import { SearchType, SearchTypeDto } from './dto/search-type.dto';
import { FindOneDto, FindOneType } from './dto/findone-type.dto';
import { isUUID } from 'class-validator';
import { ActiveUser } from '../users/users.decorator';
import { User } from '../users/entities/user.entity';
import { FindOptionsWhere, ILike } from 'typeorm';
import { Patient } from './entities/patient.entity';

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
  create(@Body() dto: CreatePatientDto, @ActiveUser() user: User) {
    return this.patientsService.create(dto, user.id);
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
  findAll(
    @Query() pagination: PaginationQueryParamsDto,
    @ActiveUser() user: User,
  ) {
    const whereCondition: FindOptionsWhere<Patient> =
      pagination.scope === Scope.ME
        ? {
            status: true,
            created_by: user.id,
          }
        : {
            status: true,
          };
    return this.patientsService.findAll(pagination, whereCondition);
  }

  /**
   * GET /search/:value
   * Busca un paciente por su cedula, nombre o numero de historia
   */
  @Get('search')
  @ApiOperation({ summary: 'Buscar paciente por un filtro' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  searchBy(
    @Query() searchParams: SearchTypeDto,
    @Query() pagination: PaginationQueryParamsDto,
    @ActiveUser() user: User,
  ) {
    let whereCondition:
      | FindOptionsWhere<Patient>
      | FindOptionsWhere<Patient>[]
      | undefined = undefined;
    if (searchParams.type === SearchType.DOCUMENT_ID) {
      whereCondition = {
        document_id: ILike(`%${searchParams.q}%`),
        status: true,
      };
    } else if (searchParams.type === SearchType.HISTORY_NUMBER) {
      whereCondition = {
        history_numbers: {
          history_number: ILike(`%${searchParams.q}%`),
        },
        status: true,
      };
    } else if (searchParams.type === SearchType.NAME) {
      whereCondition = [
        {
          lastnames: ILike(`%${searchParams.q}%`),
          status: true,
        },
        {
          names: ILike(`%${searchParams.q}%`),
          status: true,
        },
      ];
    }

    if (pagination.scope === Scope.ME) {
      if (Array.isArray(whereCondition)) {
        whereCondition = whereCondition.map((e) => ({
          ...e,
          created_by: user.id,
        }));
      } else {
        whereCondition = {
          ...whereCondition,
          created_by: user.id,
        };
      }
    }
    return this.patientsService.findAll(pagination, whereCondition);
  }

  /**
   * GET /patients/:id
   * Retorna un paciente por su UUID interno, incluyendo sus historias clínicas.
   */
  @Get(':value')
  @ApiOperation({ summary: 'Buscar paciente por ID' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  findOne(@Param('value') value: string, @Query() findType: FindOneDto) {
    if (findType.type === FindOneType.ID) {
      if (!isUUID(value)) {
        throw new BadRequestException(
          'El parámetro proporcionado debe ser un UUID válido',
        );
      }
      return this.patientsService.findOne({ id: value });
    } else if (findType.type === FindOneType.DOCUMENT_ID) {
      return this.patientsService.findOne({ document_id: value });
    } else if (findType.type === FindOneType.HISTORY_NUMBER) {
      return this.patientsService.findOne({
        history_numbers: {
          history_number: value,
        },
      });
    }
    throw new BadRequestException(
      `"${findType.type}" No es valor valido para buscar`,
    );
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
