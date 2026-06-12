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
import { CreateAdmissionDto, UpdateAdmissionDto } from './dto/admission.dto';
import {
  CreateHospitalEvolutionDto,
  UpdateHospitalEvolutionDto,
} from './dto/hospital-evolution.dto';
import { CreateDischargeDto, UpdateDischargeDto } from './dto/discharge.dto';

@ApiTags('clinical-records')
@Controller('clinical-records')
export class ClinicalRecordsController {
  constructor(
    private readonly clinicalRecordsService: ClinicalRecordsService,
  ) {}

  // --- Admissions ---

  @Post('admissions')
  @ApiOperation({ summary: 'Create a new admission' })
  @ApiResponse({ status: 201, description: 'Admission created successfully.' })
  @HttpCode(HttpStatus.CREATED)
  createAdmission(@Body() dto: CreateAdmissionDto) {
    return this.clinicalRecordsService.createAdmission(dto);
  }

  @Get('admissions')
  @ApiOperation({ summary: 'Get all admissions' })
  findAllAdmissions() {
    return this.clinicalRecordsService.findAllAdmissions();
  }

  @Get('admissions/:id')
  @ApiOperation({ summary: 'Get admission by ID' })
  findOneAdmission(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.findOneAdmission(id);
  }

  @Patch('admissions/:id')
  @ApiOperation({ summary: 'Update admission by ID' })
  updateAdmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdmissionDto,
  ) {
    return this.clinicalRecordsService.updateAdmission(id, dto);
  }

  @Delete('admissions/:id')
  @ApiOperation({ summary: 'Delete admission by ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAdmission(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.removeAdmission(id);
  }

  // --- Hospital Evolutions ---

  @Post('evolutions')
  @ApiOperation({ summary: 'Create a hospital evolution note' })
  @HttpCode(HttpStatus.CREATED)
  createEvolution(@Body() dto: CreateHospitalEvolutionDto) {
    return this.clinicalRecordsService.createEvolution(dto);
  }

  @Get('evolutions/admission/:admissionId')
  @ApiOperation({ summary: 'Get all evolutions for an admission' })
  findAllEvolutions(@Param('admissionId', ParseUUIDPipe) admissionId: string) {
    return this.clinicalRecordsService.findAllEvolutions(admissionId);
  }

  @Get('evolutions/:id')
  @ApiOperation({ summary: 'Get evolution by ID' })
  findOneEvolution(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.findOneEvolution(id);
  }

  @Patch('evolutions/:id')
  @ApiOperation({ summary: 'Update evolution by ID' })
  updateEvolution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHospitalEvolutionDto,
  ) {
    return this.clinicalRecordsService.updateEvolution(id, dto);
  }

  @Delete('evolutions/:id')
  @ApiOperation({ summary: 'Delete evolution by ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEvolution(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.removeEvolution(id);
  }

  // --- Discharges ---

  @Post('discharges')
  @ApiOperation({ summary: 'Create a new discharge' })
  @HttpCode(HttpStatus.CREATED)
  createDischarge(@Body() dto: CreateDischargeDto) {
    return this.clinicalRecordsService.createDischarge(dto);
  }

  @Get('discharges')
  @ApiOperation({ summary: 'Get all discharges' })
  findAllDischarges() {
    return this.clinicalRecordsService.findAllDischarges();
  }

  @Get('discharges/:id')
  @ApiOperation({ summary: 'Get discharge by ID' })
  findOneDischarge(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.findOneDischarge(id);
  }

  @Patch('discharges/:id')
  @ApiOperation({ summary: 'Update discharge by ID' })
  updateDischarge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDischargeDto,
  ) {
    return this.clinicalRecordsService.updateDischarge(id, dto);
  }

  @Delete('discharges/:id')
  @ApiOperation({ summary: 'Delete discharge by ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeDischarge(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicalRecordsService.removeDischarge(id);
  }
}
