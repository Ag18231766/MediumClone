"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const StatusCodes_1 = __importDefault(require("./StatusCodes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authMiddleware = (req, res, next) => {
    const { authheader } = req.headers;
    // console.log(authheader);
    if (!authheader || Array.isArray(authheader)) {
        res.json({
            message: 'authorization key not found'
        });
        return;
    }
    // console.log('hello');
    const token = authheader.split(' ')[1];
    // console.log(token);
    try {
        console.log(process.env.JWT_PASSWORD);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_PASSWORD);
        // console.log(decoded + "josd");
        if (decoded) {
            req.id = decoded.id;
            req.token = token;
            next();
        }
        else {
            res.json({
                message: "you don't have an account"
            });
        }
    }
    catch (err) {
        return res.status(StatusCodes_1.default.FORBIDDEN).json({});
    }
};
exports.authMiddleware = authMiddleware;
