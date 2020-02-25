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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = __importStar(require("mongodb"));
const PostDAO_1 = __importDefault(require("./PostDAO"));
class TeamDAO {
    constructor(conn) {
        this.teams = conn.db("game").collection("teams");
        this.posts = conn.db("game").collection("posts");
        this.postDAO = new PostDAO_1.default(conn);
    }
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
    getNextUnfoundPost(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const nextPost = yield this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } });
            const posts = nextPost.posts.filter((post) => {
                return post.reached === false && post.solved === false;
            });
            const post = posts.length > 0 ? posts[0] : null;
            if (post === null) {
                return null;
            }
            try {
                const retval = yield this.posts.findOne({ _id: post.postId });
                return {
                    postId: retval._id,
                    longitude: retval.position.coordinates[0],
                    lattitude: retval.position.coordinates[1]
                };
            }
            catch (e) {
                console.log(e);
                return null;
            }
        });
    }
    getNextPostGivenSolutionV2(teamId, solution) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.teams
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
        });
    }
    /* We assume the post for the solution has been reached, since this provides the solution */
    getNextPostGivenSolution(teamId, solution) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } });
            if (!res) {
                throw new Error("No Team found with this _id");
            }
            const foundPosts = res.posts.filter((r) => r.reached === true && r.solved === false);
            if (foundPosts.length > 1) {
                throw new Error("Only one post with reached===true and solved===false should exist");
            }
            if (foundPosts.length === 0) {
                throw new Error("No post found which was reached by the team, with an unsolved problem");
            }
            const foundPost = foundPosts[0];
            const wasProblemSolved = yield this.posts.findOne({
                _id: foundPost.postId,
                taskSolution: solution
            });
            if (!wasProblemSolved) {
                throw new Error(`Wrong solution provided for ${foundPosts.postId}`);
            }
            const teamUpdated = yield this.teams.findOneAndUpdate({ _id: teamId, "posts.postId": foundPost.postId }, { $set: { "posts.$.solved": true } }, { returnOriginal: false });
            const posts = teamUpdated.value.posts;
            const status = posts.reduce((acc, cur, idx, arr) => {
                acc.reached = cur.reached ? acc.reached + 1 : acc.reached;
                acc.solved = cur.solved ? acc.solved + 1 : acc.solved;
                if (cur.reached === false &&
                    cur.solved === false &&
                    acc.nextPostId === null) {
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
            }, { reached: 0, solved: 0, totalPosts: 0, nextPostId: null, status: "" });
            const nextPost = yield this.posts.findOne({ _id: status.nextPostId }, { projection: { position: 1 } });
            return {
                postId: nextPost._id,
                longitude: nextPost.position.coordinates[0],
                lattitude: nextPost.position.coordinates[1],
                status
            };
            return status;
        });
    }
    updatePosition(teamId, postId, lon, lat) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield this.postDAO.getPostIfReached(postId, lon, lat);
            let result = { task: null };
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
            const res = yield this.teams.findOneAndUpdate(query, update
            // ,{ projection: { "value.posts": 1 } }
            );
            result.posts = res.value.posts;
            return result;
        });
    }
}
const URI = "mongodb+srv://test:test@clustergamev1-js9jx.mongodb.net/test?retryWrites=true&w=majority";
const client = new mongo.MongoClient(URI, { useNewUrlParser: true });
(function test() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            const teamDAO = new TeamDAO(client);
            //const res = await teamDAO.addTeam("Team-1", ["Post-1", "Post-2"]);
            //const res = await teamDAO.updatePosition("Team-1", "Post-1", 20, 20);
            // const res = await teamDAO.updatePosition(
            //   "Team-1",
            //   "Post-1",
            //   12.518266439437866,
            //   55.772780384609256
            // );
            const res = yield teamDAO.getNextPostGivenSolution("Team-1", "dlkfsjf");
            //const res = await teamDAO.getPost("Team-1");
            console.log("---X-->", res);
        }
        catch (err) {
            console.error("UPPS", err);
        }
        finally {
            client.close();
        }
    });
})();
//# sourceMappingURL=TeamDAO.js.map