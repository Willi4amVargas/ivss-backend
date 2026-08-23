import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admission } from '../../clinical-records/entities/admission.entity';
import { Discharges } from '../../clinical-records/entities/discharges.entity';
import { HospitalEvolution } from '../../clinical-records/entities/hospital_evolution.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Profile } from '../../profile/entities/profile.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100 })
  description: string;

  @Column({ type: 'uuid' })
  profile_id: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  recovery_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  recovery_code_expires_at: Date | null;

  @OneToMany(() => Admission, (admission) => admission.user)
  admissions: Admission[];

  @OneToMany(() => Discharges, (discharge) => discharge.user)
  discharges: Discharges[];

  @OneToMany(() => HospitalEvolution, (evolution) => evolution.user)
  evolutions: HospitalEvolution[];

  @OneToMany(() => Patient, (patient) => patient.user)
  patients: Patient[];

  @ManyToOne(() => Profile, (profile) => profile.users)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
