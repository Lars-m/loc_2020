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
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = __importStar(require("mongodb"));
const DISTANCE_TO_CENTER = 15;
class PostDAO {
    constructor(conn) {
        this.posts = conn.db("game").collection("posts");
    }
    getPostIfReached(postId, lon, lat) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.posts.findOne({
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
            }, { projection: { task: 1 } });
        });
    }
    // disConnect() {
    //   client.close();
    // }
    addPost(name, task, taskSolution, lon, lat) {
        const position = { type: "Point", coordinates: [lon, lat] };
        // const reachedByTeams: Array<string> = [];
        // const solvedByTeams: Array<string> = [];
        return this.posts.insertOne({
            _id: name,
            task,
            taskSolution,
            // reachedByTeams,
            // solvedByTeams,
            position
        });
    }
}
exports.default = PostDAO;
const URI = "mongodb+srv://test:test@clustergamev1-js9jx.mongodb.net/test?retryWrites=true&w=majority";
const client = new mongo.MongoClient(URI, { useNewUrlParser: true });
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            const postDAO = new PostDAO(client);
            const res = yield postDAO.addPost("Post-20", { text: "hello", isURL: false }, "dlkfsjf", 12.518266439437866, 55.772780384609256);
            console.log(res.ops);
        }
        catch (err) {
            console.error("UPPS", err.errmsg);
        }
        finally {
            client.close();
        }
    });
}
(function testIt() {
    return __awaiter(this, void 0, void 0, function* () {
        test();
    });
})();
//# sourceMappingURL=PostDAO.js.map