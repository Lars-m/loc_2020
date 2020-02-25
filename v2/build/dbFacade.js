"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISTANCE_TO_CENTER = 15;
var PostStatus;
(function (PostStatus) {
    PostStatus[PostStatus["FOUND"] = 0] = "FOUND";
    PostStatus[PostStatus["NOT_YET_FOUND"] = 1] = "NOT_YET_FOUND";
})(PostStatus = exports.PostStatus || (exports.PostStatus = {}));
function getStatusForAllPosts(posts) {
    return posts.reduce((acc, cur, idx, arr) => {
        acc.reached = cur.reached ? acc.reached + 1 : acc.reached;
        acc.solved = cur.solved ? acc.solved + 1 : acc.solved;
        if (cur.reached === false && cur.solved === false && acc.nextPostId === null) {
            acc.nextPostId = cur.postId;
        }
        if (idx === arr.length - 1) {
            const length = arr.length;
            acc.totalPosts = length;
            if (acc.reached === length && acc.solved === length && acc.nextPostId === null) {
                acc.status = "GAME_OVER";
            }
        }
        return acc;
    }, { reached: 0, solved: 0, totalPosts: 0, nextPostId: null, status: "RUNNING" });
}
exports.getStatusForAllPosts = getStatusForAllPosts;
class DBFacade {
    constructor(conn, dbName) {
        process.env.DB_DEV;
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
    getTaskForPostIfReached(postId, teamId, lon, lat) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield this.posts.findOne({
                _id: postId,
                position: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lon, lat]
                        },
                        $maxDistance: exports.DISTANCE_TO_CENTER
                    }
                }
            }, { projection: { task: 1 } });
            yield this.teams.updateOne({ _id: teamId, "posts.postId": postId }, { $set: { "posts.$.reached": true } });
            return post;
        });
    }
    /**
     * Find first post, if any, with an unsolved problem.
     * Rejects with "No, unsolved posts found" if all posts have been solved
     * @param teamId Team-id for the team for which a post must be found
     */
    getFirstUnsolvedPost(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
             TBD: STATUS bør fjernes, giver ikke mening her
            */
            const nextPost = yield this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } });
            const post = nextPost.posts.find((post) => {
                return post.solved === false;
            });
            if (post === undefined) {
                //throw new Error("No, unsolved posts found")
                return Promise.reject("No, unsolved posts found");
            }
            const status = post.reached !== false; //false: post not yet found, true: post is found
            try {
                const foundPost = yield this.posts.findOne({ _id: post.postId });
                return {
                    postId: foundPost._id,
                    status,
                    longitude: foundPost.position.coordinates[0],
                    latitude: foundPost.position.coordinates[1]
                };
            }
            catch (e) { }
            return Promise.reject("No, unsolved posts found");
        });
    }
    /**
     * Find first post, if any, with an unsolved problem.
     * Rejects with "No, unsolved posts found" if all posts have been solved
     * @param teamId Team-id for the team for which a post must be found
     */
    getIDForFirstUnsolvedPost(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            TBD: This method is not yet tested
            */
            const nextPost = yield this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } });
            const post = nextPost.posts.find((post) => {
                return post.solved === false;
            });
            if (post === undefined) {
                //throw new Error("No, unsolved posts found")
                return Promise.reject("No, unsolved posts found");
            }
            const status = post.reached === false ? PostStatus.NOT_YET_FOUND : PostStatus.FOUND;
            return {
                postId: post.postId,
                status
            };
        });
    }
    getNextPostGivenSolution(teamId, solution) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } });
            if (!res) {
                return Promise.reject("No Team found with provided _id");
            }
            const foundPosts = res.posts.filter((r) => r.reached === true && r.solved === false);
            if (foundPosts.length > 1) {
                return Promise.reject("Only one post with reached===true and solved===false should exist");
            }
            if (foundPosts.length === 0) {
                return Promise.reject("No post found which was reached by this team, with an unsolved problem");
            }
            const postFound = foundPosts[0];
            const postIfSolutionWasOK = yield this.posts.findOne({
                _id: postFound.postId,
                taskSolution: solution
            });
            if (!postIfSolutionWasOK) {
                //return Promise.reject(`Wrong solution provided for task at ${postFound.postId}`);
                return Promise.reject(`Wrong solution provided for task at ${postFound.postId}`);
            }
            const teamUpdated = yield this.teams.findOneAndUpdate({ _id: teamId, "posts.postId": postFound.postId }, { $set: { "posts.$.solved": true } }, { returnOriginal: false });
            const posts = teamUpdated.value.posts;
            const statusAllPosts = getStatusForAllPosts(posts);
            let returnObject = {
                postId: null,
                longitude: 0,
                lattitude: 0,
                status: statusAllPosts.status
            };
            if (statusAllPosts.status === "GAME_OVER") {
                return returnObject;
            }
            const nextPost = yield this.posts.findOne({ _id: statusAllPosts.nextPostId }, { projection: { position: 1 } });
            returnObject.postId = nextPost._id;
            returnObject.longitude = nextPost.position.coordinates[0];
            returnObject.lattitude = nextPost.position.coordinates[1];
            return returnObject;
        });
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
    addPost(name, taskTxt, isURL, taskSolution, lon, lat) {
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
    addTeam(name, postsInOrder) {
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
exports.default = DBFacade;
//# sourceMappingURL=dbFacade.js.map