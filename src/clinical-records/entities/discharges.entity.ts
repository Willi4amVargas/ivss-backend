import { Admission } from './admission.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DischargeDiagnosis } from './discharges_diagnosis.entity';

@Entity({ name: 'discharges' })
export class Discharges {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @Column({ name: 'admission_record_id', type: 'uuid', nullable: false })
  admission_record_id: string;

  @Column({
    name: 'discharge_date',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  discharge_date: Date;

  @Column({
    name: 'discharge_exam',
    type: 'varchar',
    nullable: false,
  })
  discharge_exam: string;

  @Column({
    name: 'treatment_plan',
    type: 'varchar',
    nullable: true,
  })
  treatment_plan: string;

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

  @OneToOne(() => Admission)
  @JoinColumn({ name: 'admission_record_id' })
  admission: Admission;

  @OneToMany(
    () => DischargeDiagnosis,
    (dischargesDiagnosis) => dischargesDiagnosis.discharge,
  )
  discharges_diagnosis: DischargeDiagnosis[];
}
