import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from '../patients/patients.module';
import { ClinicalRecordsController } from './clinical-records.controller';
import { ClinicalRecordsService } from './clinical-records.service';
import { ClinicalRecord } from './entities/clinical_record.entity';
import { Diagnosis } from './entities/diagnosis.entity';
import { Admission } from './entities/admission.entity';
import { AdmissionDiagnosis } from './entities/admission_diagnosis.entity';
import { HospitalEvolution } from './entities/hospital_evolution.entity';
import { Discharges } from './entities/discharges.entity';
import { DischargeDiagnosis } from './entities/discharges_diagnosis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalRecord,
      Diagnosis,
      Admission,
      AdmissionDiagnosis,
      HospitalEvolution,
      Discharges,
      DischargeDiagnosis,
    ]),
    PatientsModule,
  ],
  controllers: [ClinicalRecordsController],
  providers: [ClinicalRecordsService],
  exports: [ClinicalRecordsService],
})
export class ClinicalRecordsModule {}
