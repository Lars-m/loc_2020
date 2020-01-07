import * as mongo from "mongodb";
import DBFacade, { DISTANCE_TO_CENTER } from "../src/dbFacade";
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

/*
According to this calculator one Degree of latitude (at lattitude:55.772780384609256 ) 
corresponds to 111337.6487 meters, so one meter corresponds to 1/111337.6487 degrees
http://www.csgnetwork.com/degreelenllavcalc.html
*/
const latInside = 55.772780384609256 + ((DISTANCE_TO_CENTER - 1) / 111337.6487)
const latOutside = 55.772780384609256 + ((DISTANCE_TO_CENTER + 1) / 111337.6487)


describe("Testing the Geo-Features", function () {
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

  it("Should find this post, which is one meter inside the posts declared radius", async () => {
    const post = await facade.getPostIfReached("P1", 12.518266439437866, latInside);
    expect(post).not.to.equal(null);
    expect(post._id).to.be.equal("P1")
  })
  it("Should Not find this post, which is one meter OUTSIDE the posts declared radius", async () => {
    const post = await facade.getPostIfReached("P1", 12.518266439437866, latOutside);
    expect(post).to.equal(null);

  })

  describe("Verify behaviour of getNextUnsolvedPost", () => {
    it("Should find P2 as the next post to go to. Status should be false (not found)", async () => {
      await teams.insertOne({
        _id: "Team-1",
        posts: [{ postId: "P2", reached: false, solved: false }, { postId: "P1", reached: false, solved: false }],
        position: { type: "Point", coordinates: [0, 0] }
      })
      const post = await facade.getNextUnsolvedPost("Team-1");
      expect(post.postId).to.equal("P2");
      expect(post.status).to.equal(false);
    })

    it("Should find P2 as the next post to go to. Status should be true (found)", async () => {
      await teams.insertOne({
        _id: "Team-1",
        posts: [{ postId: "P2", reached: true, solved: false }, { postId: "P1", reached: false, solved: false }],
        position: { type: "Point", coordinates: [0, 0] }
      })
      const post = await facade.getNextUnsolvedPost("Team-1");
      expect(post).to.eql({ postId: "P2", status: true, longitude: 0, latitude: 0 });
    })

    it("Should find P1 as the next post to go to. Status should be false (not found)", async () => {
      await teams.insertOne({
        _id: "Team-1",
        posts: [{ postId: "P2", reached: true, solved: true }, { postId: "P1", reached: false, solved: false }],
        position: { type: "Point", coordinates: [0, 0] }
      })
      const post = await facade.getNextUnsolvedPost("Team-1");
      expect(post.postId).to.equal("P1");
      expect(post.status).to.equal(false);
    })

    it("Should NOT find any post, since all post-problems are solved", async () => {
      await teams.insertOne({
        _id: "Team-1",
        posts: [{ postId: "P2", reached: true, solved: true }, { postId: "P1", reached: true, solved: true }],
        position: { type: "Point", coordinates: [0, 0] }
      })
      try {
        const post = await facade.getNextUnsolvedPost("Team-1");
      } catch (err) {
        expect(err).to.be.equal("No, unsolved posts found");
      }
    })
  });

  describe("Testing Add data features", function () {
    it("Add a new Post to the posts collection", async () => {
      const post = await facade.addPost("Px", "aa", false, "xx", 0, 0);
      expect(post.insertedCount).to.equal(1);
      expect(post.insertedId).to.equal("Px");
    })

    it("Add a new Team to the teams collection", async () => {

      const team = await facade.addTeam("Team-1", ["P1", "P2"]);
      expect(team.insertedCount).to.equal(1);
      expect(team.insertedId).to.equal("Team-1");

      const t = await teams.findOne({ _id: "Team-1" });
      //https://github.com/chaijs/deep-eql
      expect(t.posts[0]).to.eql({ postId: 'P1', reached: false, solved: false })
      expect(t.posts[1]).to.eql({ postId: 'P2', reached: false, solved: false })

      expect(t.position.type).to.be.equal("Point")
      expect(t.position.coordinates).to.eql([0, 0]);
    })
  })




})
