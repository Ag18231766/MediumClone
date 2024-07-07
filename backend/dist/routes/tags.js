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
const client_1 = require("@prisma/client");
const middleware_1 = require("../middleware");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const StatusCodes_1 = __importDefault(require("../StatusCodes"));
const config_1 = __importDefault(require("../config"));
const TagRouter = express_1.default.Router();
TagRouter.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
const AdminZod = zod_1.z.object({
    name: zod_1.z.string(),
    password: zod_1.z.string().min(8)
});
TagRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { success } = AdminZod.safeParse(req.body);
    if (!success) {
        return res.status(StatusCodes_1.default.NOT_FOUND).json({
            message: "admin credential invalid"
        });
    }
    const { name, password } = req.body;
    try {
        const AdminExist = yield prisma.admin.findFirst({
            where: {
                name: name,
                password: password
            },
            select: {
                id: true
            }
        });
        if (!AdminExist) {
            return res.status(StatusCodes_1.default.CONFLICT).json({
                message: "admin doesn't exist"
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: AdminExist.id }, config_1.default);
        res.status(StatusCodes_1.default.OK).json({
            token: token
        });
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes_1.default.BAD_GATEWAY).json({
            message: "can't connect to database"
        });
    }
}));
TagRouter.post("/", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const Id = req.id;
    try {
        const AdminExist = yield prisma.admin.findFirst({
            where: {
                id: Number(Id)
            }
        });
        if (!AdminExist) {
            return res.status(StatusCodes_1.default.CONFLICT).json({
                message: "admin doesn't exist"
            });
        }
        const tagArr = req.body;
        yield prisma.admin.update({
            where: {
                id: Number(Id),
            },
            data: {
                tag: {
                    // Connect the existing tags
                    connect: [],
                    // Connect the new tags
                    connectOrCreate: tagArr.arr.map(tag => ({
                        where: { tag },
                        create: { tag },
                    })),
                },
            },
        });
        res.status(StatusCodes_1.default.OK).json({
            message: "tags added"
        });
    }
    catch (error) {
        console.log(error);
        res.status(StatusCodes_1.default.BAD_GATEWAY).json({
            message: "can't connect to database"
        });
    }
}));
exports.default = TagRouter;