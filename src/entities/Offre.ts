import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Mutuelle } from "./Mutuelle";

@Entity("offres")
export class Offre {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    nom!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    montant!: number;

    @Column({ type: "text" })
    conditions!: string;

    @ManyToOne(() => Mutuelle, mutuelle => mutuelle.offres)
    mutuelle!: Mutuelle;

    @CreateDateColumn()
    dateCreation!: Date;

    @UpdateDateColumn()
    dateMiseAJour!: Date;
} 