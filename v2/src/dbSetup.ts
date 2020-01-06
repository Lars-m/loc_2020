import * as mongo from "mongodb";
require('dotenv').config();




async function setupPosts(client: mongo.MongoClient) {

  const posts = client.db(process.env.DB_DEV).collection("posts");
  try {
    const result = await
      posts.insertMany([
        {
          _id: "Post_1", task: { text: "count to five", isURL: false }, taskSolution: "xg654r",
          location: {
            type: "Point",
            coordinates: [12.518266439437866, 55.773730840686234]
          }
        },
        {
          _id: "Post_2", task: { text: "count to six", isURL: false }, taskSolution: "io87",
          location: {
            type: "Point",
            coordinates: [12.518266439437866, 55.773730840686234]
          }
        },
        {
          _id: "Post_3", task: { text: "count to seven", isURL: false }, taskSolution: "ty78",
          location: {
            type: "Point",
            coordinates: [12.518266439437866, 55.773730840686234]
          }
        }
      ])
    console.log(`Inserted ${result.insertedCount} Posts`);
  } catch (err) {
    console.error("UPPS", err)
  }
}
const position = { type: "Point", coordinates: [0, 0] };

function makeTeamForInsert(teamName: string, postsInOrder: Array<string>): any {
  const position = { type: "Point", coordinates: [0, 0] };
  const posts = postsInOrder.map(p => ({
    postId: p,
    reached: false,
    solved: false
  }));
  return {
    _id: teamName,
    posts,
    position
  }

}

async function setupTeams(client: mongo.MongoClient) {

  const teams = client.db(process.env.DB_DEV).collection("teams");
  try {
    const result = await
      teams.insertMany([
        makeTeamForInsert("Team-1", ["Post-1", "Post-2", "Post-3"]),
        makeTeamForInsert("Team-2", ["Post-3", "Post-1", "Post-2"]),
        makeTeamForInsert("Team-3", ["Post-2", "Post-3", "Post-1"]),
      ])
    console.log(`Inserted ${result.insertedCount} teams`);
  } catch (err) {
    console.error("UPPS", err)
  }
}

(async function setupAll() {
  console.log("--->", process.env.DB_URI)
  let client = new mongo.MongoClient(process.env.DB_URI || "", { useNewUrlParser: true })
  await client.connect();
  await setupPosts(client);
  await setupTeams(client);
  client.close();
})()


