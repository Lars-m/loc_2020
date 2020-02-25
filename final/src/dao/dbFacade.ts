import * as mongo from "mongodb";
type Collection = mongo.Collection;

export const DISTANCE_TO_CENTER = 15;

export interface IPostsStatus { reached: number, solved: number, totalPosts: number, nextPostId: string, status: string }

export enum PostStatus {
  "FOUND",
  "NOT_YET_FOUND"
}


export function getStatusForAllPosts(posts: Array<{ postId: string, reached: boolean, solved: boolean }>): IPostsStatus {
  return posts.reduce((acc: any, cur: any, idx: any, arr: any) => {
    acc.reached = cur.reached ? acc.reached + 1 : acc.reached;
    acc.solved = cur.solved ? acc.solved + 1 : acc.solved;
    if (cur.reached === false && cur.solved === false && acc.nextPostId === null) {
      acc.nextPostId = cur.postId;
    }
    if (idx === arr.length - 1) {
      const length = arr.length;
      acc.totalPosts = length;
      if (acc.reached === length && acc.solved === length && acc.nextPostId === null) {
        acc.status = "GAME_OVER"
      }
    }
    return acc;
  }, { reached: 0, solved: 0, totalPosts: 0, nextPostId: null, status: "RUNNING" });
}

export default class DBFacade {
  posts: Collection;
  teams: Collection;

  constructor(conn: mongo.MongoClient, dbName: string) {
    process.env.DB_DEV
    this.posts = conn.db(dbName).collection("posts");
    this.teams = conn.db(dbName).collection("teams");
  }

  /**
   * Method to calculate bearing
   * https://www.npmjs.com/package/geolib
   */

  /**
   * Returns a post if it exists, and caller is within DISTANCE_TO_CENTER of the post's location
   * 
   * @param postId ID for the requested post
   * @param lon Longitude of caller
   * @param lat Lattidude of caller
   */
  async getTaskForPostIfReached(postId: string, teamId: string, lon: number, lat: number) {
    const post = await this.posts.findOne(
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

    await this.teams.updateOne(
      { _id: teamId, "posts.postId": postId },
      { $set: { "posts.$.reached": true } }
    );
    return post;
  }

  /**
   * Find first post, if any, with an unsolved problem.
   * Rejects with "No, unsolved posts found" if all posts have been solved
   * @param teamId Team-id for the team for which a post must be found
   */
  async getFirstUnsolvedPost(teamId: string): Promise<{ postId: string, status: boolean, longitude: number, latitude: number }> {
    /*
     TBD: STATUS bør fjernes, giver ikke mening her
    */

    const nextPost = await this.teams.findOne(
      { _id: teamId },
      { projection: { posts: 1 } }
    );
    const post = nextPost.posts.find((post: any) => {
      return post.solved === false;
    });
    if (post === undefined) {
      //throw new Error("No, unsolved posts found")
      return Promise.reject("No, unsolved posts found")
    }
    const status = post.reached !== false;  //false: post not yet found, true: post is found
    try {
      const foundPost = await this.posts.findOne({ _id: post.postId });
      return {
        postId: foundPost._id,
        status,
        longitude: foundPost.position.coordinates[0],
        latitude: foundPost.position.coordinates[1]
      };
    } catch (e) { }

    return Promise.reject("No, unsolved posts found");
  }

  /**
   * Find first post, if any, with an unsolved problem.
   * Rejects with "No, unsolved posts found" if all posts have been solved
   * @param teamId Team-id for the team for which a post must be found
   */
  async getIDForFirstUnsolvedPost(teamId: string): Promise<{ postId: string, status: PostStatus }> {
    /*
    TBD: This method is not yet tested
    */
    const nextPost = await this.teams.findOne(
      { _id: teamId },
      { projection: { posts: 1 } }
    );
    const post = nextPost.posts.find((post: any) => {
      return post.solved === false;
    });
    if (post === undefined) {
      //throw new Error("No, unsolved posts found")
      return Promise.reject("No, unsolved posts found")
    }
    const status = post.reached === false ? PostStatus.NOT_YET_FOUND : PostStatus.FOUND;
    return {
      postId: post.postId,
      status
    };
  }

  async getNextPostGivenSolution(teamId: string, solution: string) {
    const res = await this.teams.findOne(
      { _id: teamId },
      { projection: { posts: 1 } }
    );
    if (!res) {
      return Promise.reject("No Team found with provided _id");
    }

    const foundPosts = res.posts.filter(
      (r: any) => r.reached === true && r.solved === false
    );

    if (foundPosts.length > 1) {
      return Promise.reject("Only one post with reached===true and solved===false should exist");
    }
    if (foundPosts.length === 0) {
      return Promise.reject("No post found which was reached by this team, with an unsolved problem");
    }
    const postFound = foundPosts[0];

    const postIfSolutionWasOK = await this.posts.findOne({
      _id: postFound.postId,
      taskSolution: solution
    });
    if (!postIfSolutionWasOK) {
      //return Promise.reject(`Wrong solution provided for task at ${postFound.postId}`);
      return Promise.reject(`Wrong solution provided for task at ${postFound.postId}`);
    }
    const teamUpdated = await this.teams.findOneAndUpdate(
      { _id: teamId, "posts.postId": postFound.postId },
      { $set: { "posts.$.solved": true } },
      { returnOriginal: false }
    );

    const posts = teamUpdated.value.posts;
    const statusAllPosts = getStatusForAllPosts(posts);

    let returnObject = {
      postId: null,
      longitude: 0,
      lattitude: 0,
      status: statusAllPosts.status
    }
    if (statusAllPosts.status === "GAME_OVER") {
      return returnObject;
    }

    const nextPost = await this.posts.findOne(
      { _id: statusAllPosts.nextPostId },
      { projection: { position: 1 } }
    );
    returnObject.postId = nextPost._id;
    returnObject.longitude = nextPost.position.coordinates[0]
    returnObject.lattitude = nextPost.position.coordinates[1]
    return returnObject;
  }



  /**
   * Add a new Post to the database
   * @param name Name of the team (will become the _id)
   * @param taskTxt the task for this post, either in plain text or as a URL
   * @param isURL if(true) taskText is plain text, otherwise it's a URL
   * @param taskSolution Solution to the task
   * @param lon Longitude (center) for this Post
   * @param lat Lattitude (center) for this Post
   */
  addPost(
    name: string,
    taskTxt: string,
    isURL: boolean,
    taskSolution: string,
    lon: number,
    lat: number
  ): Promise<any> {
    const position = { type: "Point", coordinates: [lon, lat] };
    return this.posts.insertOne({
      _id: name,
      task: { text: taskTxt, isURL },
      taskSolution,
      position
    });
  }

  /**
   * Create a new Team
   * Important, all POST's must be created before calling this method
   * @param name Name of the team (will become the _id)
   * @param postsInOrder Array with all Post-Id's for this game. The order in which post's are given,
   *                     will be the order for the team to aproach the Posts
   */
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

}