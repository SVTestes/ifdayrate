"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const ratings_1 = __importDefault(require("./routes/ratings"));
const groups_1 = __importDefault(require("./routes/groups"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite localhost em dev e qualquer subdomínio vercel.app em prod
        const allowed = [
            /^http:\/\/localhost(:\d+)?$/,
            /^https?:\/\/.*\.vercel\.app$/,
        ];
        if (!origin || allowed.some(re => re.test(origin)) || process.env.FRONTEND_URL === origin) {
            callback(null, true);
        }
        else {
            callback(null, false);
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_1.default);
app.use('/api/ratings', ratings_1.default);
app.use('/api/groups', groups_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
