// Import Express
import express from "express";
// Import body-parser (to handle parameters more easily)
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import { Client } from "@elastic/elasticsearch";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

// This variable instantiate the Express.js library
const app = express();

var client_config = {};
var cloud_id = {};
var cloud_auth = {};

// Port define
const PORT = 3000;

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Books API Documentation",
      version: "1.0.0",
      description: "Documentation for the Books API",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJSDoc(options);

// setup client_config for creating Client()
cloud_id.id = process.env.elastic_cloud_id;
cloud_auth.apiKey = process.env.elastic_api_token;
client_config.cloud = cloud_id;
client_config.auth = cloud_auth;

// instantiate Elastic Client
var client = new Client(client_config);

client = new Client({
  cloud: {
    id: cloud_id.id,
  },
  auth: {
    username: process.env.elastic_userid,
    password: process.env.elastic_password,
  },
});

// Indicate to Express.js that you're using an additional plugin to treat parameters
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: API endpoints for searching books.
 *
 * @swagger
 * tags:
 *   name: Delete
 *   description: API endpoints for deleting books.
 */

/**
 * @swagger
 * /search:
 *   post:
 *     summary: Search for books
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               query:
 *                 type: string
 *             example:
 *               field: title
 *               query: The Great Gatsby
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   FIELD1:
 *                     type: string
 *                   title:
 *                     type: string
 *                   author:
 *                     type: string
 *                   description:
 *                     type: string
 *                   published_date:
 *                     type: string
 *             example:
 *               - FIELD1: 12345
 *                 title: The Great Gatsby
 *                 author: F. Scott Fitzgerald
 *                 description: A classic novel about the Jazz Age
 *                 published_date: 1925-04-10
 */

/**
 * @swagger
 * /delete:
 *   delete:
 *     summary: Delete a book
 *     tags: [Delete]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               FIELD1:
 *                 type: string
 *             example:
 *               FIELD1: 12345
 *     responses:
 *       202:
 *         description: Book deleted successfully
 */

app.post("/search", async (req, res) => {
  const { field, query } = req.body;

  try {
    const response = await client.search({
      index: "search-google-books",
      body: {
        query: {
          match: { [field]: query },
        },
        _source: ["FIELD1", "title", "author", "description", "published_date"], //we Specify the fields to retrieve
      },
    });

    res.setHeader("Content-Type", "application/json");

    const hits = response.body.hits.hits;
    console.log(hits);
    const results = hits.map((hit) => {
      const { FIELD1, title, author, description, published_date } =
        hit._source;
      return { FIELD1, title, author, description, published_date };
    });
    res.send(results);
  } catch (error) {
    console.error("Error occurred during the search:", error);
    res.status(500).send("An error occurred during the search");
  }
});

app.delete("/delete", async (req, res) => {
  const { FIELD1 } = req.body;

  try {
    await client.delete({
      index: "search-google-books",
      id: FIELD1,
    });
    res.sendStatus(202);
    console.log(`${FIELD1} has been deleted`);
  } catch (error) {
    console.error("Error occurred during the delete:", error);
    res.status(500).send("An error occurred during the delete");
  }
});

app.listen(PORT, () =>
  console.log(`The Books API is running on: http://localhost:${PORT}.`)
);

// // Replace the route name
// app.get("/books", (request, response) => {
//   // The function will return your bookList in a JSON
//   // Sample: { allBooks: ["Make Time: How to Focus on what Matters Every Day", "The Power Of Habit"]}
//   response.send(200);
//   return response.json({ allBooks: bookList });
// });

// app.post("/books", (request, response) => {
//   // We get the parameter 'name' from the body
//   const bookToAdd = request.body.name;

//   // We check if the book list includes the new book
//   // If it is, we return 'false'
//   if (bookList.includes(bookToAdd)) return response.json({ success: false });

//   // Otherwise, we add the new book in the list and return 'true'
//   bookList.push(bookToAdd);
//   return response.json({ success: true });
// });

// app.delete("/books", (request, response) => {
//   // We get the parameter 'name' from the body
//   const bookToDelete = request.body.name;

//   // We create a new array with all elements different from the book to delete
//   bookList = bookList.filter((book) => book !== bookToDelete);

//   // We return the new list
//   return response.json({ allBooks: bookList });
// });

// app.put("/books", (request, response) => {
//   // We get the parameters 'nameToUpdate' and 'updatedName' from the body
//   const bookToUpdate = request.body.nameToUpdate;
//   const updatedBook = request.body.updatedName;

//   // We search if the book to update is in the list
//   const indexOfBookToUpdate = bookList.findIndex(
//     (book) => book === bookToUpdate
//   );

//   // If it is not a book from the list, we return 'false'
//   if (indexOfBookToUpdate === -1) return response.json({ success: false });

//   // Otherwise, we replace the name and return 'true'
//   bookList[indexOfBookToUpdate] = updatedBook;
//   return response.json({ success: true });
// });
