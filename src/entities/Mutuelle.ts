// src/entities/Mutuelle.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';
import { Offre } from './Offre';

/**
 * Cette entité vit en schema public (authentification).
 * Pas de OneToMany ici : la relation tenant ↔ données
 * se fait uniquement via l'isolation par schema.
 */
@Entity('mutuelles')
export class Mutuelle {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    nom!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    telephone!: string;

    @Column()
    adresse!: string;

    @Column()
    ville!: string;

    @Column()
    codePostal!: string;

    @Column()
    pays!: string;

    @Column()
    siret!: string;

    @Column()
    motDePasse!: string;

    @Column({ default: true })
    estActif!: boolean;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;

    @OneToMany(() => Offre, offre => offre.mutuelle, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    offres!: Offre[];

}
