import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Patient } from '../patients/entities/patient.entity';
import { Admission } from '../clinical-records/entities/admission.entity';
import { Discharges } from '../clinical-records/entities/discharges.entity';
import { AdmissionDiagnosis } from '../clinical-records/entities/admission_diagnosis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      Admission,
      Discharges,
      AdmissionDiagnosis,
    ]),
  ],
  providers: [StatisticsService],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
