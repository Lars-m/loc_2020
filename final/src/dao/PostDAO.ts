import * as mongo from "mongodb";
type Collection = mongo.Collection;

const DISTANCE_TO_CENTER = 15;

export default class PostDAO {
  posts: Collection;

  constructor(conn: mongo.MongoClient) {
    this.posts = conn.db("game").collection("posts");
  }

  async getPostIfReached(postId: string, lon: number, lat: number) {
    return await this.posts.findOne(
      {
        _id: postId,
        position: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat]
            },
            $maxDistance: DISTANCE_TO_CENTER
          }
        }
      },
      { projection: { task: 1 } }
    );
  }

  // disConnect() {
  //   client.close();
  // }
  addPost(
    name: string,
    task: { text: string; isURL: boolean },
    taskSolution: string,
    lon: number,
    lat: number
  ): Promise<any> {
    const position = { type: "Point", coordinates: [lon, lat] };
    // const reachedByTeams: Array<string> = [];
    // const solvedByTeams: Array<string> = [];
    return this.posts.insertOne({
      _id: name,
      task,
      taskSolution,
      // reachedByTeams,
      // solvedByTeams,
      position
    });
  }
}

const URI =
  "mongodb+srv://test:test@clustergamev1-js9jx.mongodb.net/test?retryWrites=true&w=majority";
const client = new mongo.MongoClient(URI, { useNewUrlParser: true });

async function test() {
  try {
    await client.connect();
    const postDAO = new PostDAO(client);

    const res = await postDAO.addPost(
      "Post-20",
      { text: "hello", isURL: false },
      "dlkfsjf",
      12.518266439437866,
      55.772780384609256
    );
    console.log(res.ops)
  } catch (err) {
    console.error("UPPS", err.errmsg);
  } finally {
    client.close();
  }
}

(async function testIt() {
  test();
})();
