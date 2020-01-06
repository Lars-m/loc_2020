import * as mongo from "mongodb";
import DBFacade, { DISTANCE_TO_CENTER } from "../src/dbFacade";
require('dotenv').config();
import { expect } from "chai";

const MongoClient = mongo.MongoClient;

let facade: DBFacade;

type Collection = mongo.Collection;

let client = new MongoClient(process.env.DB_URI || "", { useNewUrlParser: true });

let posts: Collection;

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
    await posts.createIndex({ position: "2dsphere" })
    facade = new DBFacade(client, process.env.DB_TEST || "")
  })

  beforeEach(async function () {
    await posts.deleteMany({});
    await posts.insertMany([
      makePostHelper("Post-1", "A task", false, "ax23", 12.518266439437866, 55.772780384609256),
      makePostHelper("Post-2", "A new task", false, "af63", 0, 0),
      makePostHelper("Post-3", "Third task", false, "ae53", 0, 0),
    ])
  })

  after(function () {
    client.close();
  })

  it("Should find this post, which is one meter inside the posts declared radius", async () => {
    const post = await facade.getPostIfReached("Post-1", 12.518266439437866, latInside);
    expect(post).not.to.equal(null);
    expect(post._id).to.be.equal("Post-1")
  })
  it("Should Not find this post, which is one meter OUTSIDE the posts declared radius", async () => {
    const post = await facade.getPostIfReached("Post-1", 12.518266439437866, latOutside);
    expect(post).to.equal(null);

  })

  describe("Testing Add Data Features", function () {
    it("Add a new Post to the posts collection", async () => {
      const post = await facade.addPost("Px", { text: "aa", isURL: false }, "xx", 0, 0);
      expect(post.insertedCount).to.equal(1);
      expect(post.insertedId).to.equal("Px");
    })

  })


})
