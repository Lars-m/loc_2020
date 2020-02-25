const express = require("express")
const app = express()
const swaggerUi = require("swagger-ui-express");
const openAPI_Documentation = require("./spec");
//const openAPI_Documentation = {}; require("./a");
//console.log(openAPI_Documentation)

var options = {
  swaggerOptions: {
    url: 'http://petstore.swagger.io/v2/swagger.json'
  }
}



app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openAPI_Documentation));
app.get("/api/postForFirstUnsolvedPost/:teamId", (req, res) => {
  const param = req.params.teamId;
  res.json({
    "info": "This is a DUMMY response",
    "postID": param,
    "status": false,
    "longitude": 12.000,
    "latitude": 56.000
  });
})

const PORT = process.env.port || 3333;
app.listen(PORT, () => console.log(`Server started, listening on port: ${PORT}`))


