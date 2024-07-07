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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = __importDefault(require("zod"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const StatusCodes_1 = __importDefault(require("../StatusCodes"));
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../config"));
const middleware_1 = require("../middleware");
const UserRouter = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// middlewares
UserRouter.use(express_1.default.json());
// zod definitions
const SignUpUserSchema = zod_1.default.object({
    id: zod_1.default.number(),
    email: zod_1.default.string().email(),
    username: zod_1.default.string(),
    password: zod_1.default.string().min(8)
});
const SignInUserSchema = SignUpUserSchema.pick({ 'email': true, 'password': true });
// routehandlers
UserRouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success } = SignUpUserSchema.partial({ id: true }).safeParse(req.body);
    if (!success) {
        return res.status(StatusCodes_1.default.BADREQUEST).json({
            message: "either email doesn't exist or password isn't of 8 characters"
        });
    }
    const { username, email, password } = req.body;
    try {
        const UserExist = yield prisma.user.findFirst({
            where: {
                email: email
            }
        });
        if (UserExist) {
            return res.status(StatusCodes_1.default.CONFLICT).json({
                message: "User with these credentials already exits"
            });
        }
        const newUser = yield prisma.user.create({
            data: {
                username,
                email,
                password
            },
            select: {
                id: true
            }
        });
        const payload = { id: newUser.id.toString() };
        const token = jsonwebtoken_1.default.sign(payload, config_1.default);
        return res.json({
            token: token
        });
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes_1.default.BAD_GATEWAY).json({
            mesage: "database is not up"
        });
    }
}));
UserRouter.post('/signin', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const Id = req.id;
    if (!Id) {
        return res.json({
            message: 'id not defined'
        });
    }
    try {
        const UserExist = yield prisma.user.findFirst({
            where: {
                id: Number(Id)
            },
            select: {
                id: true
            }
        });
        if (!UserExist) {
            return res.status(StatusCodes_1.default.NOT_FOUND).json({
                message: "user doesn't exist"
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: Id }, config_1.default);
        return res.json({
            token: token
        });
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes_1.default.BAD_GATEWAY).json({
            mesage: "database is not up"
        });
    }
}));
UserRouter.post('/signinPassword', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const UserExist = yield prisma.user.findFirst({
            where: {
                email: email,
                password: password
            },
            select: {
                id: true
            }
        });
        if (!UserExist) {
            return res.json({
                message: "user doesn't exist"
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: UserExist.id }, config_1.default);
        return res.json({
            token: token
        });
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes_1.default.BAD_GATEWAY).json({
            mesage: "database is not up"
        });
    }
}));
exports.default = UserRouter;