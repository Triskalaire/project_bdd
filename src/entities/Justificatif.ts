import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Dossier } from "./Dossier";

@Entity("justificatifs")
export class Justificatif {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    nomFichier!: string;

    @Column()
    typeDocument!: string;

    @Column({ type: "bytea" })
    contenu!: Buffer;

    @Column()
    taille!: number;

    @Column()
    mimeType!: string;

    @ManyToOne(() => Dossier, dossier => dossier.justificatifs)
    dossier!: Dossier;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
} 