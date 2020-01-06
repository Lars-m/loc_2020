const MongoClient = require('mongodb').MongoClient;


const uri = "mongodb+srv://test:test@clustergamev1-js9jx.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(async (err) => {
  const posts = client.db("game").collection("post");
  try {
    // const result = await
    //   posts.insertOne({
    //     _id: "Post_2",
    //     task: "Count to five",
    //     taskSolution: "xg654r",
    //     reachedByTeams: [],
    //     location: {
    //       type: "Point",
    //       coordinates: [12.518266439437866,55.773730840686234]
    //     }
    //   })
    // console.log(result.insertedCount);

    const result = await client.db("game").collection("post")
      .findOne({
        _id: "Post_2",
        location: {
          $near: {
            $geometry: {
              type: "Polygon",
              //coordinates: [12.51787483692169, 55.772780384609256]  //Outside
              coordinates: [12.518255710601807, 55.7737549789515]

            },
            $maxDistance: 100
          }
        }
      })
    console.log(result)


  } catch (err) {
    console.log(err)
  }

  client.close();
});