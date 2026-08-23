import { Admission } from './admission.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DischargeDiagnosis } from './discharges_diagnosis.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'discharge' })
export class Discharges {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Index()
  @Column({ name: 'admission_id', type: 'uuid', nullable: false })
  admission_id: string;

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
    name: 'morbility_status',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  morbility_status: boolean;

  @Column({
    name: 'treatment_plan',
    type: 'varchar',
    nullable: true,
  })
  treatment_plan: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'uuid', name: 'created_by' })
  created_by: string;

  @ManyToOne(() => User, (user) => user.discharges, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  user: User;

  @OneToOne(() => Admission)
  @JoinColumn({ name: 'admission_id' })
  admission: Admission;

  @OneToMany(
    () => DischargeDiagnosis,
    (dischargesDiagnosis) => dischargesDiagnosis.discharge,
  )
  discharges_diagnosis: DischargeDiagnosis[];
}
