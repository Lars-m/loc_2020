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
require('dotenv').config();
function setupPosts(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = client.db(process.env.DB_DEV).collection("posts");
        try {
            const result = yield posts.insertMany([
                {
                    _id: "Post_1", task: { text: "count to five", isURL: false }, taskSolution: "xg654r",
                    location: {
                        type: "Point",
                        coordinates: [12.518266439437866, 55.773730840686234]
                    }
                },
                {
                    _id: "Post_2", task: { text: "count to six", isURL: false }, taskSolution: "io87",
                    location: {
                        type: "Point",
                        coordinates: [12.518266439437866, 55.773730840686234]
                    }
                },
                {
                    _id: "Post_3", task: { text: "count to seven", isURL: false }, taskSolution: "ty78",
                    location: {
                        type: "Point",
                        coordinates: [12.518266439437866, 55.773730840686234]
                    }
                }
            ]);
            console.log(`Inserted ${result.insertedCount} Posts`);
        }
        catch (err) {
            console.error("UPPS", err);
        }
    });
}
const position = { type: "Point", coordinates: [0, 0] };
function makeTeamForInsert(teamName, postsInOrder) {
    const position = { type: "Point", coordinates: [0, 0] };
    const posts = postsInOrder.map(p => ({
        postId: p,
        reached: false,
        solved: false
    }));
    return {
        _id: teamName,
        posts,
        position
    };
}
function setupTeams(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const teams = client.db(process.env.DB_DEV).collection("teams");
        try {
            const result = yield teams.insertMany([
                makeTeamForInsert("Team-1", ["Post-1", "Post-2", "Post-3"]),
                makeTeamForInsert("Team-2", ["Post-3", "Post-1", "Post-2"]),
                makeTeamForInsert("Team-3", ["Post-2", "Post-3", "Post-1"]),
            ]);
            console.log(`Inserted ${result.insertedCount} teams`);
        }
        catch (err) {
            console.error("UPPS", err);
        }
    });
}
(function setupAll() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--->", process.env.DB_URI);
        let client = new mongo.MongoClient(process.env.DB_URI || "", { useNewUrlParser: true });
        yield client.connect();
        yield setupPosts(client);
        yield setupTeams(client);
        client.close();
    });
})();
//# sourceMappingURL=dbSetup.js.map