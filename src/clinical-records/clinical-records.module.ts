import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from '../patients/patients.module';
import { ClinicalRecordsController } from './clinical-records.controller';
import { ClinicalRecordsService } from './clinical-records.service';
import { ClinicalRecord } from './entities/clinical_record.entity';
import { Diagnosis } from './entities/diagnosis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClinicalRecord, Diagnosis]),
    PatientsModule, // Para inyectar PatientsService y verificar existencia de pacientes
  ],
  controllers: [ClinicalRecordsController],
  providers: [ClinicalRecordsService],
  exports: [ClinicalRecordsService],
})
export class ClinicalRecordsModule {}
