"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose = __importStar(require("mongoose"));
var teams = [
    {
        teamId: 1,
        teamName: "Team 1",
        currentPos: { x: 1, y: 1 },
        allPossitions: [{}]
    }
];
var posts = [
    { teamId: 1, positions: [{ x: 1, y: 1, found: false, taskId: "xxx" }] }
];
var t;
(function (t) {
    t["Point"] = "Point";
})(t || (t = {}));
var PointSchema = new mongoose.Schema({
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number] }
});
var Point = mongoose.model("Point", PointSchema);
var P = mongoose.model("Point", PointSchema);
var point = new Point({ type: "sjfldsj", coordinates: true });
console.log(point);
point.sa;
var p2 = new P({ type: "sjfldsj", coordinates: true });
console.log(p2);
//API's
// Get all teams (id, name, currentPos)
// Get all posts all
// Get allPostForTeam
// Get statusForTeam {totalPosts: int, foundPost: 3}
// Post newPosForTeam/:teamId   --> Store positon and return  status
