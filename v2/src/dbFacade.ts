import * as mongo from "mongodb";
type Collection = mongo.Collection;

export const DISTANCE_TO_CENTER = 15;

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

  addPost(
    name: string,
    task: { text: string; isURL: boolean },
    taskSolution: string,
    lon: number,
    lat: number
  ): Promise<any> {
    const position = { type: "Point", coordinates: [lon, lat] };
    return this.posts.insertOne({
      _id: name,
      task,
      taskSolution,
      position
    });
  }

}