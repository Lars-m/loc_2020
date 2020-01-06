const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://test:test@clustergamev1-js9jx.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
//console.log(client)
(async function connect() {
  const con = await client.connect();
  console.log(con)
})()
//  client.connect(async (err) => {
//    const posts = client.db("game").collection("teams");