import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admission } from './admission.entity';
import { Discharges } from './discharges.entity';

@Entity({ name: 'discharge_diagnosis' })
export class DischargeDiagnosis {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    name: 'code',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'Código usado para las estadisticas del diagnostico de egreso',
  })
  code: string;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: 'Titulo de el diagnostico',
  })
  title: string;

  @Column({
    name: 'description',
    type: 'varchar',
    nullable: true,
  })
  description: string;

  @Index()
  @Column({ name: 'discharge_id', type: 'uuid', nullable: false })
  discharge_id: string;

  @ManyToOne(() => Discharges, (record) => record, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'discharge_id' })
  discharge: Admission;
}
