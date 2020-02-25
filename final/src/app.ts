import express from "express";
const app = express();
const PORT = process.env.PORT || 3333;
const swaggerUi = require("swagger-ui-express");
const openAPI_Documentation = require("./openApiDoc/spec.js");

app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(openAPI_Documentation));


app.listen(PORT, () => console.log(`Server started, listening on port: ${PORT}`))
