import request from "supertest"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source.js"
import { User } from "../../src/entities/User.js"
import { Roles } from "../../src/constants/index.js"

describe("POST /auth/register", () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // DB truncate
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe("Given all fields", () => {
        it("should return 201 status code", async () => {
            ///AAA

            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            //Assert
            expect(response.statusCode).toBe(201)
        })

        it("should return valid json response", async () => {
            ///AAA

            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            //Assert application/json
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"))
        })

        it("should persist the user in the database", async () => {
            ///AAA

            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            //Act
            await request(app).post("/auth/register").send(userData)

            //Assert application/json
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(1)
            expect(users[0]?.firstname).toBe(userData.firstname)
            expect(users[0]?.lastname).toBe(userData.lastname)
            expect(users[0]?.email).toBe(userData.email)
        })

        it("Should return an ID of the created user", async () => {
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            //Assert
            expect((response.body as Record<string, string>).id).toBeDefined()
        })

        it("Should assign a customer role", async () => {
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            //Assert
            expect((response.body as Record<string, string>).id).toBeDefined()

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty("role")
            expect(users[0]?.role).toBe(Roles.CUSTOMER)
        })

        it("Should store the hashed password in the database", async () => {
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            //Act
            await request(app).post("/auth/register").send(userData)

            //Assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]?.password).not.toBe(userData.password)
            expect(users[0]?.password).toHaveLength(60) // bcrypt hash length
            expect(users[0]?.password).toMatch(/^\$2[ayb]\$.{56}$/) // bcrypt hash format
        })

        it("Should return 409 status code if email already exists", async () => {
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "darshan@gmail.com",
                password: "secret",
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
                password: "hashedPassword",
            })

            //Act
            await request(app).post("/auth/register").send(userData)

            //Assert
            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            const users = await userRepository.find()
            expect(response.status).toBe(409)
            expect(users).toHaveLength(1)
        })
    })
    describe("Fields are missing", () => {
        it("should return 400 status code if email fields is missing", async () => {
            //Arrange
            const userData = {
                firstname: "Darshan",
                lastname: "Dubey",
                email: "",
                password: "secret",
            }

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send({ ...userData, email: undefined })

            expect(response.status).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            //Assert
            expect(response.status).toBe(400)
            expect(users).toHaveLength(0)
        })
    })
})
