"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const client_1 = __importDefault(require("../prisma/client"));
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
function generateAccessToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}
function generateRefreshToken() {
    return (0, uuid_1.v4)();
}
async function register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email and password are required' });
        return;
    }
    const existing = await client_1.default.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: 'Email already in use' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await client_1.default.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
    });
    res.status(201).json({ user });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    const user = await client_1.default.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const accessToken = generateAccessToken(user.id);
    const refreshTokenValue = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
    await client_1.default.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshTokenValue,
            expiresAt,
        },
    });
    res.cookie('refreshToken', refreshTokenValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
    });
    res.json({
        accessToken,
        user: { id: user.id, name: user.name, email: user.email },
    });
}
async function refresh(req, res) {
    const tokenValue = req.cookies?.refreshToken;
    if (!tokenValue) {
        res.status(401).json({ error: 'No refresh token' });
        return;
    }
    const stored = await client_1.default.refreshToken.findUnique({
        where: { token: tokenValue },
        include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
        return;
    }
    // Rotate refresh token
    await client_1.default.refreshToken.delete({ where: { id: stored.id } });
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
    await client_1.default.refreshToken.create({
        data: {
            userId: stored.userId,
            token: newRefreshToken,
            expiresAt,
        },
    });
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
    });
    const accessToken = generateAccessToken(stored.userId);
    res.json({
        accessToken,
        user: {
            id: stored.user.id,
            name: stored.user.name,
            email: stored.user.email,
        },
    });
}
async function logout(req, res) {
    const tokenValue = req.cookies?.refreshToken;
    if (tokenValue) {
        await client_1.default.refreshToken.deleteMany({ where: { token: tokenValue } });
    }
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out' });
}
