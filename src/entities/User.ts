import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar" })
    firstname: string

    @Column({ type: "varchar" })
    lastname: string

    @Column({ type: "varchar", unique: true })
    email: string

    @Column({ type: "varchar" })
    password: string

    @Column({ type: "varchar" })
    role: string
}
