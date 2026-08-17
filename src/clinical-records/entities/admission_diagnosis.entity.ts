import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admission } from './admission.entity';

@Entity({ name: 'admission_diagnosis' })
export class AdmissionDiagnosis {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    name: 'code',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'Código usado para las estadisticas del diagnostico de admision',
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
  @Column({ name: 'admission_id', type: 'uuid', nullable: false })
  admission_id: string;

  @ManyToOne(() => Admission, (record) => record.admission_diagnosis, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'admission_id' })
  admission: Admission;
}
