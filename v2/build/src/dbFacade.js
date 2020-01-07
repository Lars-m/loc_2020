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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISTANCE_TO_CENTER = 15;
function getStatusForAllPosts(posts) {
    return posts.reduce(function (acc, cur, idx, arr) {
        acc.reached = cur.reached ? acc.reached + 1 : acc.reached;
        acc.solved = cur.solved ? acc.solved + 1 : acc.solved;
        if (cur.reached === false &&
            cur.solved === false &&
            acc.nextPostId === null) {
            acc.nextPostId = cur.postId;
        }
        if (idx === arr.length - 2) {
            var length_1 = arr.length;
            acc.totalPosts = length_1;
            acc.status =
                acc.reached === length_1 &&
                    acc.solved === length_1 &&
                    acc.nextPostId === null
                    ? "Game Over"
                    : "Game Continues";
        }
        return acc;
    }, { reached: 0, solved: 0, totalPosts: 0, nextPostId: null, status: "" });
}
exports.getStatusForAllPosts = getStatusForAllPosts;
var DBFacade = /** @class */ (function () {
    function DBFacade(conn, dbName) {
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
    DBFacade.prototype.getPostIfReached = function (postId, lon, lat) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.posts.findOne({
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
                        }, { projection: { task: 1 } })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find next post with an unsolved problem.
     * Rejects with "No, unsolved posts found" if all posts have been solved
     * @param teamId Team-id for the team for which a post must be found
     */
    DBFacade.prototype.getNextUnsolvedPost = function (teamId) {
        return __awaiter(this, void 0, void 0, function () {
            var nextPost, post, status, foundPost, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } })];
                    case 1:
                        nextPost = _a.sent();
                        post = nextPost.posts.find(function (post) {
                            return post.solved === false;
                        });
                        if (post === undefined) {
                            return [2 /*return*/, Promise.reject("No, unsolved posts found")];
                        }
                        status = post.reached !== false;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.posts.findOne({ _id: post.postId })];
                    case 3:
                        foundPost = _a.sent();
                        return [2 /*return*/, {
                                postId: foundPost._id,
                                status: status,
                                longitude: foundPost.position.coordinates[0],
                                latitude: foundPost.position.coordinates[1]
                            }];
                    case 4:
                        e_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, Promise.reject("No, unsolved posts found")];
                }
            });
        });
    };
    DBFacade.prototype.getNextPostGivenSolution = function (teamId, solution) {
        return __awaiter(this, void 0, void 0, function () {
            var res, foundPosts, foundPost, wasProblemSolved, teamUpdated, posts, status, nextPost;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.teams.findOne({ _id: teamId }, { projection: { posts: 1 } })];
                    case 1:
                        res = _a.sent();
                        if (!res) {
                            return [2 /*return*/, Promise.reject("No Team found with provided _id")];
                        }
                        foundPosts = res.posts.filter(function (r) { return r.reached === true && r.solved === false; });
                        if (foundPosts.length > 1) {
                            return [2 /*return*/, Promise.reject("Only one post with reached===true and solved===false should exist")];
                        }
                        if (foundPosts.length === 0) {
                            return [2 /*return*/, Promise.reject("No post found which was reached by this team, with an unsolved problem")];
                        }
                        foundPost = foundPosts[0];
                        return [4 /*yield*/, this.posts.findOne({
                                _id: foundPost.postId,
                                taskSolution: solution
                            })];
                    case 2:
                        wasProblemSolved = _a.sent();
                        if (!wasProblemSolved) {
                            Promise.reject("Wrong solution provided for task at " + foundPosts.postId);
                        }
                        return [4 /*yield*/, this.teams.findOneAndUpdate({ _id: teamId, "posts.postId": foundPost.postId }, { $set: { "posts.$.solved": true } }, { returnOriginal: false })];
                    case 3:
                        teamUpdated = _a.sent();
                        posts = teamUpdated.value.posts;
                        status = getStatusForAllPosts(posts);
                        return [4 /*yield*/, this.posts.findOne({ _id: status.nextPostId }, { projection: { position: 1 } })];
                    case 4:
                        nextPost = _a.sent();
                        return [2 /*return*/, {
                                postId: nextPost._id,
                                longitude: nextPost.position.coordinates[0],
                                lattitude: nextPost.position.coordinates[1],
                                status: status
                            }];
                }
            });
        });
    };
    /**
     * Add a new team to the database
     * @param name Name of the team (will become the _id)
     * @param taskTxt the task for this post, either in plain text or as a URL
     * @param isURL if(true) taskText is plain text, otherwise it's a URL
     * @param taskSolution Solution to the task
     * @param lon Longitude (center) for this Post
     * @param lat Lattitude (center) for this Post
     */
    DBFacade.prototype.addPost = function (name, taskTxt, isURL, taskSolution, lon, lat) {
        var position = { type: "Point", coordinates: [lon, lat] };
        return this.posts.insertOne({
            _id: name,
            task: { text: taskTxt, isURL: isURL },
            taskSolution: taskSolution,
            position: position
        });
    };
    /**
     * Create a new Team
     * Important, all POST's must be created before calling this method
     * @param name Name of the team (will become the _id)
     * @param postsInOrder Array with all Post-Id's for this game. The order in which post's are given,
     *                     will be the order for the team to aproach the Posts
     */
    DBFacade.prototype.addTeam = function (name, postsInOrder) {
        var position = { type: "Point", coordinates: [0, 0] };
        var posts = postsInOrder.map(function (p) { return ({
            postId: p,
            reached: false,
            solved: false
        }); });
        return this.teams.insertOne({
            _id: name,
            posts: posts,
            position: position
        });
    };
    return DBFacade;
}());
exports.default = DBFacade;
//# sourceMappingURL=dbFacade.js.map