import * as mongo from "mongodb";
import PostDAO from "./PostDAO";
import { truncate } from "fs";

interface IUpdateResult {
  nextPostFound: string;
  lastPostFound: boolean;
  postsFound: Array<string>;
  distanceToNextPost: number;
  nextPost: { longitude: number; lattitude: number };
}

interface IPostStatusForTeam {
  postId: string;
  reached: boolean;
  solved: boolean;
}

class TeamDAO {
  teams: mongo.Collection;
  posts: mongo.Collection;
  postDAO: PostDAO;

  constructor(conn: mongo.MongoClient) {
    this.teams = conn.db("game").collection("teams");
    this.posts = conn.db("game").collection("posts");
    this.postDAO = new PostDAO(conn);
  }

  addTeam(name: string, postsInOrder: Array<string>): Promise<any> {
    const position = { type: "Point", coordinates: [0, 0] };
    const posts = postsInOrder.map(p => ({
      postId: p,
      reached: false,
      solved: false
    }));
    return this.teams.insertOne({
      _id: name,
      posts,
      position
    });
  }

  async getNextUnfoundPost(teamId: string) {
    const nextPost = await this.teams.findOne(
      { _id: teamId },
      { projection: { posts: 1 } }
    );
    const posts = nextPost.posts.filter((post: any) => {
      return post.reached === false && post.solved === false;
    });
    const post = posts.length > 0 ? posts[0] : null;
    if (post === null) {
      return null;
    }
    try {
      const retval = await this.posts.findOne({ _id: post.postId });
      return {
        postId: retval._id,
        longitude: retval.position.coordinates[0],
        lattitude: retval.position.coordinates[1]
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async getNextPostGivenSolutionV2(
    teamId: string,
    solution: string
  ): Promise<any> {
    const res = await this.teams
      .aggregate([
        {
          $match: {
            _id: teamId
          }
        },
        {
          $unwind: { path: "$posts" }
        },
        {
          $match: {
            "posts.reached": true,
            "posts.solved": false
          }
        },
        {
          $replaceRoot: {
            newRoot: "$posts"
          }
        }
      ])
      .toArray();
    return res;
  }

  /* We assume the post for the solution has been reached, since this provides the solution */
  async getNextPostGivenSolution(teamId: string, solution: string) {
    const res = await this.teams.findOne(
      { _id: teamId },
      { projection: { posts: 1 } }
    );
    if (!res) {
      throw new Error("No Team found with this _id");
    }
    const foundPosts = res.posts.filter(
      (r: any) => r.reached === true && r.solved === false
    );
    if (foundPosts.length > 1) {
      throw new Error(
        "Only one post with reached===true and solved===false should exist"
      );
    }
    if (foundPosts.length === 0) {
      throw new Error(
        "No post found which was reached by the team, with an unsolved problem"
      );
    }
    const foundPost = foundPosts[0];
    const wasProblemSolved = await this.posts.findOne({
      _id: foundPost.postId,
      taskSolution: solution
    });
    if (!wasProblemSolved) {
      throw new Error(`Wrong solution provided for ${foundPosts.postId}`);
    }
    const teamUpdated = await this.teams.findOneAndUpdate(
      { _id: teamId, "posts.postId": foundPost.postId },
      { $set: { "posts.$.solved": true } },
      { returnOriginal: false }
    );

    const posts = teamUpdated.value.posts;

    const status = posts.reduce(
      (acc: any, cur: any, idx: any, arr: any) => {
        acc.reached = cur.reached ? acc.reached + 1 : acc.reached;
        acc.solved = cur.solved ? acc.solved + 1 : acc.solved;
        if (
          cur.reached === false &&
          cur.solved === false &&
          acc.nextPostId === null
        ) {
          acc.nextPostId = cur.postId;
        }
        if (idx === arr.length - 2) {
          const length = arr.length;
          acc.totalPosts = length;
          acc.status =
            acc.reached === length &&
            acc.solved === length &&
            acc.nextPostId === null
              ? "Game Over"
              : "Game Continues";
        }
        return acc;
      },
      { reached: 0, solved: 0, totalPosts: 0, nextPostId: null, status: "" }
    );

    const nextPost = await this.posts.findOne(
      { _id: status.nextPostId },
      { projection: { position: 1 } }
    );
    return {
      postId: nextPost._id,
      longitude: nextPost.position.coordinates[0],
      lattitude: nextPost.position.coordinates[1],
      status
    };
    return status;
  }

  async updatePosition(
    teamId: string,
    postId: string,
    lon: number,
    lat: number
  ) {
    const post = await this.postDAO.getPostIfReached(postId, lon, lat);
    let result: any = { task: null };
    if (post) {
      result.task = post.task;
    }
    //https://docs.mongodb.com/manual/reference/operator/update/positional/
    const query = post
      ? { _id: teamId, "posts.postId": postId }
      : { _id: teamId };
    const update = post
      ? {
          $set: {
            "position.coordinates": [lon, lat],
            "posts.$.reached": true
          }
        }
      : {
          $set: { "position.coordinates": [lon, lat] }
        };
    const res = await this.teams.findOneAndUpdate(
      query,
      update
      // ,{ projection: { "value.posts": 1 } }
    );
    result.posts = res.value.posts;
    return result;
  }
}

const URI =
  "mongodb+srv://test:test@clustergamev1-js9jx.mongodb.net/test?retryWrites=true&w=majority";
const client = new mongo.MongoClient(URI, { useNewUrlParser: true });
(async function test() {
  try {
    await client.connect();
    const teamDAO = new TeamDAO(client);
    //const res = await teamDAO.addTeam("Team-1", ["Post-1", "Post-2"]);
    //const res = await teamDAO.updatePosition("Team-1", "Post-1", 20, 20);
    // const res = await teamDAO.updatePosition(
    //   "Team-1",
    //   "Post-1",
    //   12.518266439437866,
    //   55.772780384609256
    // );
    const res = await teamDAO.getNextPostGivenSolution("Team-1", "dlkfsjf");
    //const res = await teamDAO.getPost("Team-1");
    console.log("---X-->", res);
  } catch (err) {
    console.error("UPPS", err);
  } finally {
    client.close();
  }
})();
