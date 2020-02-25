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
  return {
    _id: id,
    posts,
    position: { type: "Point", coordinates: [0, 0] }
  }
}

/*
According to this calculator one Degree of latitude (at lattitude:55.772780384609256 ) 
corresponds to 111337.6487 meters, so one meter corresponds to 1/111337.6487 degrees
http://www.csgnetwork.com/degreelenllavcalc.html
*/
const latInside = 55.772780384609256 + ((DISTANCE_TO_CENTER - 1) / 111337.6487)
const latOutside = 55.772780384609256 + ((DISTANCE_TO_CENTER + 1) / 111337.6487)

function getLatitudeInside(latitude: number, radius: number) {
  return latitude + ((radius - 1) / 111337.6487)
}
function getLatitudeOutside(latitude: number, radius: number) {
  return latitude + ((radius + 1) / 111337.6487)
}
const positionPost1 = [12.518266439437866, 55.772780384609256]
const positionPost2 = [12.522579431533813, 55.771383322972746]
const positionPost3 = [12.53264307975769, 55.77050824806384]

describe("Play a full game, with two posts and two remote teams", function () {
  //https://stackoverflow.com/questions/45194598/using-process-env-in-typescript/53981706
  before(async function () {
    await client.connect();
    posts = client.db(process.env.DB_TEST).collection("posts");
    teams = client.db(process.env.DB_TEST).collection("teams");
    await posts.createIndex({ position: "2dsphere" })
    facade = new DBFacade(client, process.env.DB_TEST || "")
  })

  before(async function () {
    await posts.deleteMany({});
    await teams.deleteMany({});
    await posts.insertMany([
      makePostHelper("P1", "task p1", false, "ax23", positionPost1[0], positionPost1[1]),
      makePostHelper("P2", "task p2", false, "af63", positionPost2[0], positionPost2[1]),
      // makePostHelper("P3", "task p3", false, "qy34", positionPost3[0], positionPost3[1]),
    ])
    const status = await teams.insertMany([
      makeTeamHelper("T1", [{ postId: "P1", reached: false, solved: false }, { postId: "P2", reached: false, solved: false }]),
      makeTeamHelper("T2", [{ postId: "P2", reached: false, solved: false }, { postId: "P1", reached: false, solved: false }])
    ])
  })

  after(function () {
    client.close();
  })

  it("Team 1 should get position for P1 as their first post", async () => {
    const post = await facade.getFirstUnsolvedPost("T1");
    expect(post.postId).to.equal("P1");
    expect(post.status).to.equal(false);
  })
  it("Team 2 should get position for P2 as their first post", async () => {
    const post = await facade.getFirstUnsolvedPost("T2");
    expect(post.postId).to.equal("P2");
    expect(post.status).to.equal(false);
  })

  it("Team 1 Should not get task for Post-1 (P1) since the Post has not yet been reached", async () => {
    const post = await facade.getTaskForPostIfReached("P1", "T1", positionPost1[0], getLatitudeOutside(positionPost1[1], DISTANCE_TO_CENTER));
    expect(post).to.be.null
  })
  it("Team 2 Should not get task for Post-2 (P2) since the Post has not yet been reached", async () => {
    const post = await facade.getTaskForPostIfReached("P2", "T2", positionPost3[0], getLatitudeOutside(positionPost3[1], DISTANCE_TO_CENTER));
    expect(post).to.be.null
  })

  it("Team 1 has reached Post1 (P1) and should get the task for the post", async () => {
    const post = await facade.getTaskForPostIfReached("P1", "T1", positionPost1[0], getLatitudeInside(positionPost1[1], DISTANCE_TO_CENTER));
    expect(post.task).to.eql({ text: 'task p1', isURL: false })

    //Check if reached was set
    const t1 = await teams.findOne({ _id: "T1" }, { projection: { _id: 0, posts: 1 } })
    expect(t1.posts[0].reached).to.be.true;
  })

  it("Team 2 has reached Post2 (P2) and should get the taks for the Post", async () => {
    const post = await facade.getTaskForPostIfReached("P2", "T2", positionPost2[0], positionPost2[1]);
    expect(post.task).to.eql({ text: 'task p2', isURL: false })

    //Check if reached was set
    const t1 = await teams.findOne({ _id: "T2" }, { projection: { _id: 0, posts: 1 } })
    expect(t1.posts[0].reached).to.be.true;
  })

  it("Team 1 should not get the next post since a wrong solution to P1's problem was provided", async () => {
    let error = "";
    try {
      await facade.getNextPostGivenSolution("T1", "Wroooong")
    } catch (err) {
      error = err;
    }
    expect(error).to.be.equal("Wrong solution provided for task at P1");
  })

  it("Team 2 should not get the next post since a wrong solution to P2's problem was provided", async () => {
    let error = "";
    try {
      await facade.getNextPostGivenSolution("T2", "Wroooong")
    } catch (err) {
      error = err;
    }
    expect(error).to.include("Wrong solution provided");
  })

  it("Team 1 should get position for the next post (P2), since the right solution to P1's task was given", async () => {
    const pos = await facade.getNextPostGivenSolution("T1", "ax23")
    expect(pos.status).to.be.equal("RUNNING")
    expect(pos.longitude).to.be.equal(positionPost2[0]);
    expect(pos.lattitude).to.be.equal(positionPost2[1]);
  })

  it("Team 2 should get position for the next post (P1), since the right solution to P2's task was given", async () => {
    const pos = await facade.getNextPostGivenSolution("T2", "af63")
    expect(pos.status).to.be.equal("RUNNING");
    expect(pos.longitude).to.be.equal(positionPost1[0]);
    expect(pos.lattitude).to.be.equal(positionPost1[1]);
  })

  it("Team 1 has reached Post2 (P2) and should get the task for the post", async () => {
    const post = await facade.getTaskForPostIfReached("P2", "T1", positionPost2[0], getLatitudeInside(positionPost2[1], DISTANCE_TO_CENTER));
    expect(post.task).to.eql({ text: 'task p2', isURL: false })

    //Check if reached was set
    const t1 = await teams.findOne({ _id: "T1" }, { projection: { _id: 0, posts: 1 } })
    expect(t1.posts[0].reached).to.be.true;
  })

  it("Team 2 has reached Post1 (P1) and should get the task for the post", async () => {
    const post = await facade.getTaskForPostIfReached("P1", "T2", positionPost1[0], getLatitudeInside(positionPost1[1], DISTANCE_TO_CENTER));
    expect(post.task).to.eql({ text: 'task p1', isURL: false })
    //Check if reached was set
    const t1 = await teams.findOne({ _id: "T2" }, { projection: { _id: 0, posts: 1 } })
    expect(t1.posts[0].reached).to.be.true;
  })

  it("Team 1 should get status 'GAME_OVER' since the right answer to the last task was given", async () => {
    const pos = await facade.getNextPostGivenSolution("T1", "af63")
    expect(pos.status).to.be.equal("GAME_OVER")
  })

  it("Team 2 should get status 'GAME_OVER' since the right answer to the last task was given", async () => {
    const pos = await facade.getNextPostGivenSolution("T2", "ax23")
    expect(pos.status).to.be.equal("GAME_OVER")
  })
})
