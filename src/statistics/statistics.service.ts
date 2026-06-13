import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Admission } from '../clinical-records/entities/admission.entity';
import { Discharges } from '../clinical-records/entities/discharges.entity';
import { AdmissionDiagnosis } from '../clinical-records/entities/admission_diagnosis.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Admission)
    private readonly admissionRepo: Repository<Admission>,
    @InjectRepository(Discharges)
    private readonly dischargeRepo: Repository<Discharges>,
    @InjectRepository(AdmissionDiagnosis)
    private readonly admissionDiagnosisRepo: Repository<AdmissionDiagnosis>,
  ) {}

  async getGlobalMetrics(startDate?: string, endDate?: string) {
    const qb = this.admissionRepo
      .createQueryBuilder('admission')
      .leftJoin('admission.patient', 'patient')
      .leftJoin(
        Discharges,
        'discharge',
        'discharge.admission_record_id = admission.id',
      )
      .select([
        'COUNT(admission.id) AS total_admissions',
        'COUNT(DISTINCT admission.patient_id) AS total_unique_patients',
        'SUM(CASE WHEN discharge.morbility_status = TRUE THEN 1 ELSE 0 END) AS total_deaths',
        'ROUND(AVG(EXTRACT(EPOCH FROM (discharge.discharge_date - admission.admission_date))/86400)::NUMERIC, 2) AS average_hospitalization_days',
        'ROUND(AVG(EXTRACT(YEAR FROM admission.admission_date) - patient.birth_year)::NUMERIC, 1) AS average_admission_age',
      ]);

    if (startDate) {
      qb.andWhere('admission.admission_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('admission.admission_date <= :endDate', { endDate });
    }

    const raw = await qb.getRawOne();

    const totalAdmissions = parseInt(raw?.total_admissions ?? '0', 10);
    const totalDeaths = parseInt(raw?.total_deaths ?? '0', 10);

    return {
      totalAdmissions,
      totalUniquePatients: parseInt(raw?.total_unique_patients ?? '0', 10),
      totalDeaths,
      globalMortalityRatePct:
        totalAdmissions > 0
          ? parseFloat(((totalDeaths / totalAdmissions) * 100).toFixed(2))
          : 0,
      averageHospitalizationDays: parseFloat(
        raw?.average_hospitalization_days ?? '0',
      ),
      averageAdmissionAge: parseFloat(raw?.average_admission_age ?? '0'),
    };
  }

  async getMorbidityByAgeRange(startDate?: string, endDate?: string) {
    const qb = this.admissionRepo
      .createQueryBuilder('admission')
      .leftJoin('admission.patient', 'patient')
      .select(
        `
        CASE
          WHEN (EXTRACT(YEAR FROM admission.admission_date) - patient.birth_year) < 18 THEN '0-17'
          WHEN (EXTRACT(YEAR FROM admission.admission_date) - patient.birth_year) BETWEEN 18 AND 35 THEN '18-35'
          WHEN (EXTRACT(YEAR FROM admission.admission_date) - patient.birth_year) BETWEEN 36 AND 50 THEN '36-50'
          WHEN (EXTRACT(YEAR FROM admission.admission_date) - patient.birth_year) BETWEEN 51 AND 65 THEN '51-65'
          ELSE '65+'
        END
      `,
        'age_range',
      )
      .addSelect('COUNT(admission.id)', 'count');

    if (startDate) {
      qb.andWhere('admission.admission_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('admission.admission_date <= :endDate', { endDate });
    }

    qb.groupBy('age_range');
    qb.orderBy('age_range', 'ASC');

    const rawData = await qb.getRawMany();

    return rawData.map((item) => ({
      ageRange: item.age_range,
      count: Number(item.count),
    }));
  }

  async getDiagnosisFrequencyWithMortality(
    startDate?: string,
    endDate?: string,
  ) {
    const qb = this.admissionDiagnosisRepo
      .createQueryBuilder('diagnosis')
      .innerJoin('diagnosis.admission', 'admission')
      .leftJoin(
        Discharges,
        'discharge',
        'discharge.admission_record_id = admission.id',
      )
      .select('diagnosis.code', 'code')
      .addSelect('diagnosis.title', 'title')
      .addSelect('COUNT(diagnosis.id)', 'frequency')
      .addSelect(
        'SUM(CASE WHEN discharge.morbility_status = TRUE THEN 1 ELSE 0 END)',
        'mortality_count',
      );

    if (startDate) {
      qb.andWhere('admission.admission_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('admission.admission_date <= :endDate', { endDate });
    }

    qb.groupBy('diagnosis.code');
    qb.addGroupBy('diagnosis.title');
    qb.orderBy('frequency', 'DESC');

    const rawData = await qb.getRawMany();

    return rawData.map((item) => ({
      code: item.code,
      title: item.title,
      frequency: Number(item.frequency),
      mortalityCount: Number(item.mortality_count),
    }));
  }

  async getAverageHospitalizationDaysByDiagnosis(
    startDate?: string,
    endDate?: string,
  ): Promise<{ code: string; title: string; averageDays: number }[]> {
    const qb = this.admissionDiagnosisRepo
      .createQueryBuilder('diagnosis')
      .innerJoin('diagnosis.admission', 'admission')
      .innerJoin(
        Discharges,
        'discharge',
        'discharge.admission_record_id = admission.id',
      )
      .select('diagnosis.code', 'code')
      .addSelect('diagnosis.title', 'title')
      .addSelect(
        'ROUND(AVG(EXTRACT(EPOCH FROM (discharge.discharge_date - admission.admission_date))/86400)::NUMERIC, 2)',
        'average_days',
      );

    if (startDate) {
      qb.andWhere('admission.admission_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('admission.admission_date <= :endDate', { endDate });
    }

    qb.groupBy('diagnosis.code');
    qb.addGroupBy('diagnosis.title');
    qb.orderBy('average_days', 'DESC');

    const rawData = await qb.getRawMany();

    return rawData.map((item: any) => ({
      code: item.code,
      title: item.title,
      averageDays: parseFloat(item.average_days ?? '0'),
    }));
  }
}
