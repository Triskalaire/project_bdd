import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Assure } from "./Assure";
import { Offre } from "./Offre";
import { Dossier } from "./Dossier";
import { Message } from "./Message";

@Entity("mutuelles")
export class Mutuelle {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    nom!: string;

    @Column()
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

    @Column({ select: false })
    motDePasse!: string;

    @Column({ default: true })
    estActif!: boolean;

    @OneToMany(() => Assure, assure => assure.mutuelle)
    assures!: Assure[];

    @OneToMany(() => Offre, offre => offre.mutuelle)
    offres!: Offre[];

    @OneToMany(() => Dossier, dossier => dossier.mutuelle)
    dossiers!: Dossier[];

    @OneToMany(() => Message, message => message.mutuelle)
    messages!: Message[];

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
} 