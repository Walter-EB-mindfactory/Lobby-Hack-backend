import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VisitStatus } from '../../common/enums/visit-status.enum';
import { User } from '../users/user.entity';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  visitorName: string;

  @Column()
  dni: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  purpose: string;

  @Column({ default: false })
  programada: boolean;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.PENDING,
  })
  status: VisitStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkoutTime: Date;

  @ManyToOne(() => User, (user) => user.authorizedVisits, { nullable: true })
  @JoinColumn({ name: 'authorizedById' })
  authorizer: User;

  @Column({ nullable: true })
  authorizedById: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  googleCalendarEventId: string;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
