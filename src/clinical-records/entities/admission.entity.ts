import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { AdmissionDiagnosis } from './admission_diagnosis.entity';
import { Discharges } from './discharges.entity';

@Entity({ name: 'admission' })
export class Admission {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @Column({ name: 'patient_id', type: 'uuid', nullable: false })
  patient_id: string;

  @Column({
    name: 'admission_date',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  admission_date: Date;

  @Column({
    name: 'consult_reason',
    type: 'varchar',
    array: true,
  })
  consult_reason: string[];

  @Column({
    name: 'current_condition',
    type: 'varchar',
  })
  current_condition: string;

  @Column({
    name: 'background',
    type: 'varchar',
    array: true,
  })
  background: string[];

  @Column({
    name: 'admission_exam',
    type: 'varchar',
  })
  admission_exam: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => Patient, (patient) => patient.admissions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @OneToMany(
    () => AdmissionDiagnosis,
    (admissionDiagnosis) => admissionDiagnosis.admission,
  )
  admission_diagnosis: AdmissionDiagnosis[];

  @OneToOne(() => Discharges, (discharge) => discharge.admission)
  discharge: Discharges;
}
