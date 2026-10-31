import request from "supertest"
import app from "../../src/app.js"
import type { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source.js"
import { truncateTables } from "../utils/index.js"
import { User } from "../../src/entities/User.js"

describe("POST /auth/register", () => {
    describe("Given all fields", () => {
        let connection: DataSource

        beforeAll(async () => {
            connection = await AppDataSource.initialize()
        })

        beforeEach(async () => {
            // DB truncate
            await truncateTables(connection)
        })

        afterAll(async () => {
            await connection.destroy()
        })

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
    })
})

describe("Fields are missing", () => {})
