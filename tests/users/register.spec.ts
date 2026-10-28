import request from "supertest"
import app from "../../src/app.js"

describe("POST /auth/register", () => {
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
    })
})

describe("Fields are missing", () => {})
