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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongo = __importStar(require("mongodb"));
var dbFacade_1 = __importStar(require("../src/dbFacade"));
require('dotenv').config();
var chai_1 = require("chai");
var MongoClient = mongo.MongoClient;
var facade;
var client = new MongoClient(process.env.DB_URI || "", { useNewUrlParser: true, useUnifiedTopology: true });
var posts;
var teams;
function makePostHelper(postName, taskText, isURL, taskSolution, lon, lat) {
    var task = { text: taskText, isURL: isURL };
    var position = { "type": "Point", coordinates: [lon, lat] };
    return {
        _id: postName,
        task: task,
        taskSolution: taskSolution,
        position: position
    };
}
/*
According to this calculator one Degree of latitude (at lattitude:55.772780384609256 )
corresponds to 111337.6487 meters, so one meter corresponds to 1/111337.6487 degrees
http://www.csgnetwork.com/degreelenllavcalc.html
*/
var latInside = 55.772780384609256 + ((dbFacade_1.DISTANCE_TO_CENTER - 1) / 111337.6487);
var latOutside = 55.772780384609256 + ((dbFacade_1.DISTANCE_TO_CENTER + 1) / 111337.6487);
describe("Testing the Geo-Features", function () {
    var _this = this;
    //https://stackoverflow.com/questions/45194598/using-process-env-in-typescript/53981706
    before(function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client.connect()];
                    case 1:
                        _a.sent();
                        posts = client.db(process.env.DB_TEST).collection("posts");
                        teams = client.db(process.env.DB_TEST).collection("teams");
                        return [4 /*yield*/, posts.createIndex({ position: "2dsphere" })];
                    case 2:
                        _a.sent();
                        facade = new dbFacade_1.default(client, process.env.DB_TEST || "");
                        return [2 /*return*/];
                }
            });
        });
    });
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, posts.deleteMany({})];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, teams.deleteMany({})];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, posts.insertMany([
                                makePostHelper("P1", "A task", false, "ax23", 12.518266439437866, 55.772780384609256),
                                makePostHelper("P2", "A new task", false, "af63", 0, 0),
                            ])];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    after(function () {
        client.close();
    });
    it("Should find this post, which is one meter inside the posts declared radius", function () { return __awaiter(_this, void 0, void 0, function () {
        var post;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, facade.getPostIfReached("P1", 12.518266439437866, latInside)];
                case 1:
                    post = _a.sent();
                    chai_1.expect(post).not.to.equal(null);
                    chai_1.expect(post._id).to.be.equal("P1");
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should Not find this post, which is one meter OUTSIDE the posts declared radius", function () { return __awaiter(_this, void 0, void 0, function () {
        var post;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, facade.getPostIfReached("P1", 12.518266439437866, latOutside)];
                case 1:
                    post = _a.sent();
                    chai_1.expect(post).to.equal(null);
                    return [2 /*return*/];
            }
        });
    }); });
    describe("Verify behaviour of getNextUnsolvedPost", function () {
        it("Should find P2 as the next post to go to. Status should be false (not found)", function () { return __awaiter(_this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, teams.insertOne({
                            _id: "Team-1",
                            posts: [{ postId: "P2", reached: false, solved: false }, { postId: "P1", reached: false, solved: false }],
                            position: { type: "Point", coordinates: [0, 0] }
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, facade.getNextUnsolvedPost("Team-1")];
                    case 2:
                        post = _a.sent();
                        chai_1.expect(post.postId).to.equal("P2");
                        chai_1.expect(post.status).to.equal(false);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Should find P2 as the next post to go to. Status should be true (found)", function () { return __awaiter(_this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, teams.insertOne({
                            _id: "Team-1",
                            posts: [{ postId: "P2", reached: true, solved: false }, { postId: "P1", reached: false, solved: false }],
                            position: { type: "Point", coordinates: [0, 0] }
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, facade.getNextUnsolvedPost("Team-1")];
                    case 2:
                        post = _a.sent();
                        chai_1.expect(post).to.eql({ postId: "P2", status: true, longitude: 0, latitude: 0 });
                        return [2 /*return*/];
                }
            });
        }); });
        it("Should find P1 as the next post to go to. Status should be false (not found)", function () { return __awaiter(_this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, teams.insertOne({
                            _id: "Team-1",
                            posts: [{ postId: "P2", reached: true, solved: true }, { postId: "P1", reached: false, solved: false }],
                            position: { type: "Point", coordinates: [0, 0] }
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, facade.getNextUnsolvedPost("Team-1")];
                    case 2:
                        post = _a.sent();
                        chai_1.expect(post.postId).to.equal("P1");
                        chai_1.expect(post.status).to.equal(false);
                        return [2 /*return*/];
                }
            });
        }); });
        it("Should NOT find any post, since all post-problems are solved", function () { return __awaiter(_this, void 0, void 0, function () {
            var post, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, teams.insertOne({
                            _id: "Team-1",
                            posts: [{ postId: "P2", reached: true, solved: true }, { postId: "P1", reached: true, solved: true }],
                            position: { type: "Point", coordinates: [0, 0] }
                        })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, facade.getNextUnsolvedPost("Team-1")];
                    case 3:
                        post = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        chai_1.expect(err_1).to.be.equal("No, unsolved posts found");
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    });
    describe("Testing Add data features", function () {
        var _this = this;
        it("Add a new Post to the posts collection", function () { return __awaiter(_this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, facade.addPost("Px", "aa", false, "xx", 0, 0)];
                    case 1:
                        post = _a.sent();
                        chai_1.expect(post.insertedCount).to.equal(1);
                        chai_1.expect(post.insertedId).to.equal("Px");
                        return [2 /*return*/];
                }
            });
        }); });
        it("Add a new Team to the teams collection", function () { return __awaiter(_this, void 0, void 0, function () {
            var team, t;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, facade.addTeam("Team-1", ["P1", "P2"])];
                    case 1:
                        team = _a.sent();
                        chai_1.expect(team.insertedCount).to.equal(1);
                        chai_1.expect(team.insertedId).to.equal("Team-1");
                        return [4 /*yield*/, teams.findOne({ _id: "Team-1" })];
                    case 2:
                        t = _a.sent();
                        //https://github.com/chaijs/deep-eql
                        chai_1.expect(t.posts[0]).to.eql({ postId: 'P1', reached: false, solved: false });
                        chai_1.expect(t.posts[1]).to.eql({ postId: 'P2', reached: false, solved: false });
                        chai_1.expect(t.position.type).to.be.equal("Point");
                        chai_1.expect(t.position.coordinates).to.eql([0, 0]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=testGeoFeatures.js.map