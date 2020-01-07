import * as mongo from "mongodb";
import DBFacade, { DISTANCE_TO_CENTER, getStatusForAllPosts } from "../src/dbFacade";
require('dotenv').config();
import { expect } from "chai";

const MongoClient = mongo.MongoClient;

let facade: DBFacade;

type Collection = mongo.Collection;

let client = new MongoClient(process.env.DB_URI || "", { useNewUrlParser: true, useUnifiedTopology: true });

let posts: Collection;
let teams: Collection;

function makePostHelper(postName: string, taskText: string, isURL: boolean, taskSolution: string, lon: number, lat: number): any {
  const task = { text: taskText, isURL }
  const position = { "type": "Point", coordinates: [lon, lat] }
  return {
    _id: postName,
    task,
    taskSolution,
    position
  }
}
function makeTeamHelper(id: string, posts: Array<{ postId: string, reached: boolean, solved: boolean }>) {
  return teams.insertOne({
    _id: id,
    posts,
    position: { type: "Point", coordinates: [0, 0] }
  })
}

/*
According to this calculator one Degree of latitude (at lattitude:55.772780384609256 ) 
corresponds to 111337.6487 meters, so one meter corresponds to 1/111337.6487 degrees
http://www.csgnetwork.com/degreelenllavcalc.html
*/
const latInside = 55.772780384609256 + ((DISTANCE_TO_CENTER - 1) / 111337.6487)
const latOutside = 55.772780384609256 + ((DISTANCE_TO_CENTER + 1) / 111337.6487)


describe("Verify behaviour of getNextPostGivenSolution", function () {
  //https://stackoverflow.com/questions/45194598/using-process-env-in-typescript/53981706
  before(async function () {
    await client.connect();
    posts = client.db(process.env.DB_TEST).collection("posts");
    teams = client.db(process.env.DB_TEST).collection("teams");
    await posts.createIndex({ position: "2dsphere" })
    facade = new DBFacade(client, process.env.DB_TEST || "")
  })

  beforeEach(async function () {
    await posts.deleteMany({});
    await teams.deleteMany({});
    await posts.insertMany([
      makePostHelper("P1", "A task", false, "ax23", 12.518266439437866, 55.772780384609256),
      makePostHelper("P2", "A new task", false, "af63", 0, 0),
    ])
  })

  after(function () {
    client.close();
  })

  it("Should NOT find a new Post, since no posts is marked as reached with an unsolved problem", async () => {
    await makeTeamHelper("Team-1", [{ postId: "P2", reached: false, solved: false }, { postId: "P1", reached: false, solved: false }])
    let error = null;
    try {
      await facade.getNextPostGivenSolution("Team-1", "af63");
    } catch (err) {
      error = err;
    }
    expect(error).to.equal("No post found which was reached by this team, with an unsolved problem")
  })

  it("Should report an error that two ore more posts are marked as reached and NOT-solved", async () => {
    await makeTeamHelper("Team-1", [{ postId: "P2", reached: true, solved: false }, { postId: "P1", reached: true, solved: false }])
    let error = null;
    try {
      await facade.getNextPostGivenSolution("Team-1", "af63");
    } catch (err) {
      error = err;
    }
    expect(error).to.equal("Only one post with reached===true and solved===false should exist")
  })

  it("Should find a new Post P2, given this solution to the problem for P1 (P1 should be marked as solved)", async () => {
    const postsInfo = [{ postId: "P1", reached: true, solved: false }, { postId: "P2", reached: false, solved: false }]
    await makeTeamHelper("Team-1", postsInfo)
    const post = await facade.getNextPostGivenSolution("Team-1", "ax23");
    const allPosts = [...postsInfo];
    allPosts[0].solved = true;
    const status = getStatusForAllPosts(allPosts);
    expect(post).to.eql({ postId: "P2", longitude: 0, lattitude: 0, status });
  })

  it("Should NOT find a new Post P2, since the given solution is wrong", async () => {
    const postsInfo = [{ postId: "P1", reached: true, solved: false }, { postId: "P2", reached: false, solved: false }]
    await makeTeamHelper("Team-1", postsInfo)
    let error = null;
    try {
      const post = await facade.getNextPostGivenSolution("Team-1", "wrong");
    } catch (err) {
      error = err;
    }
    expect(error).to.equal("Wrong solution provided for task at P1")
  })


})
