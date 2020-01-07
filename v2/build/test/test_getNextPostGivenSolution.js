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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
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
function makeTeamHelper(id, posts) {
    return teams.insertOne({
        _id: id,
        posts: posts,
        position: { type: "Point", coordinates: [0, 0] }
    });
}
/*
According to this calculator one Degree of latitude (at lattitude:55.772780384609256 )
corresponds to 111337.6487 meters, so one meter corresponds to 1/111337.6487 degrees
http://www.csgnetwork.com/degreelenllavcalc.html
*/
var latInside = 55.772780384609256 + ((dbFacade_1.DISTANCE_TO_CENTER - 1) / 111337.6487);
var latOutside = 55.772780384609256 + ((dbFacade_1.DISTANCE_TO_CENTER + 1) / 111337.6487);
describe("Verify behaviour of getNextPostGivenSolution", function () {
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
    it("Should NOT find a new Post, since no posts is marked as reached with an unsolved problem", function () { return __awaiter(_this, void 0, void 0, function () {
        var error, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, makeTeamHelper("Team-1", [{ postId: "P2", reached: false, solved: false }, { postId: "P1", reached: false, solved: false }])];
                case 1:
                    _a.sent();
                    error = null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, facade.getNextPostGivenSolution("Team-1", "af63")];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    error = err_1;
                    return [3 /*break*/, 5];
                case 5:
                    chai_1.expect(error).to.equal("No post found which was reached by this team, with an unsolved problem");
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should report an error that two ore more posts are marked as reached and NOT-solved", function () { return __awaiter(_this, void 0, void 0, function () {
        var error, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, makeTeamHelper("Team-1", [{ postId: "P2", reached: true, solved: false }, { postId: "P1", reached: true, solved: false }])];
                case 1:
                    _a.sent();
                    error = null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, facade.getNextPostGivenSolution("Team-1", "af63")];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    error = err_2;
                    return [3 /*break*/, 5];
                case 5:
                    chai_1.expect(error).to.equal("Only one post with reached===true and solved===false should exist");
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should find a new Post P2, given this solution to the problem for P1 (P1 should be marked as solved)", function () { return __awaiter(_this, void 0, void 0, function () {
        var postsInfo, post, allPosts, status;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postsInfo = [{ postId: "P1", reached: true, solved: false }, { postId: "P2", reached: false, solved: false }];
                    return [4 /*yield*/, makeTeamHelper("Team-1", postsInfo)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, facade.getNextPostGivenSolution("Team-1", "af63")];
                case 2:
                    post = _a.sent();
                    allPosts = __spreadArrays(postsInfo);
                    allPosts[0].solved = true;
                    status = dbFacade_1.getStatusForAllPosts(allPosts);
                    chai_1.expect(post).to.eql({ postId: "P2", longitude: 0, lattitude: 0, status: status });
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should NOT find a new Post P2, since the given solution is wrong", function () { return __awaiter(_this, void 0, void 0, function () {
        var postsInfo, error, post, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postsInfo = [{ postId: "P1", reached: true, solved: false }, { postId: "P2", reached: false, solved: false }];
                    return [4 /*yield*/, makeTeamHelper("Team-1", postsInfo)];
                case 1:
                    _a.sent();
                    error = null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, facade.getNextPostGivenSolution("Team-1", "wrong")];
                case 3:
                    post = _a.sent();
                    console.log("---> ", post);
                    return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    error = err_3;
                    return [3 /*break*/, 5];
                case 5:
                    chai_1.expect(error).to.equal("Wrong solution provided for task at P1");
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=test_getNextPostGivenSolution.js.map