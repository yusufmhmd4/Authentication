const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const databasePath = path.join(__dirname, "userData.db");
let database = null;
const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server Running On http://localhost:3002/");
    });
  } catch (e) {
    console.log(`Db error ${e.message}`);
    process.exit(1);
  }
};
initializeDatabaseAndServer();
//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(getUser);
  //console.log(dbUser);
  if (dbUser === undefined) {
    const passwordLength = password.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `INSERT INTO 
      user ( username,name,password,gender,location )
            VALUES
            (
                 '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
      const creatingUser = await database.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const compare = await bcrypt.compare(password, dbUser.password);
    if (compare === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(getUser);
  const compare = await bcrypt.compare(oldPassword, dbUser.password);
  if (compare !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    const lengthPassword = newPassword.length;
    if (lengthPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      // const newPass = await bcrypt.hash(newPassword);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

      const user = await database.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
