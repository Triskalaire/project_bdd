// src/entities/Offre.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn
} from 'typeorm';
import { Mutuelle } from './Mutuelle';

@Entity('offres')
export class Offre {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    nom!: string;

    @Column()
    description!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    montant!: number;

    @Column()
    conditions!: string;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;

    @ManyToOne(() => Mutuelle, mutuelle => mutuelle.offres, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'mutuelleId' })
    mutuelle!: Mutuelle;
}
