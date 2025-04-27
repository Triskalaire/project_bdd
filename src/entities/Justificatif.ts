// src/entities/Justificatif.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn
} from 'typeorm';
import { Dossier } from './Dossier';

@Entity('justificatifs')
export class Justificatif {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    nomFichier!: string;

    @Column()
    typeDocument!: string;

    @Column('bytea')
    contenu!: Buffer;

    @Column('int')
    taille!: number;

    @Column()
    mimeType!: string;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;

    @ManyToOne(() => Dossier, dossier => dossier.justificatifs, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'dossierId' })
    dossier!: Dossier;
}
