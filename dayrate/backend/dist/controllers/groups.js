"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroup = createGroup;
exports.joinGroup = joinGroup;
exports.listGroups = listGroups;
exports.getGroupDetail = getGroupDetail;
const library_1 = require("@prisma/client/runtime/library");
const client_1 = __importDefault(require("../prisma/client"));
async function createGroup(req, res) {
    const { name } = req.body;
    const userId = req.userId;
    if (!name) {
        res.status(400).json({ error: 'Group name is required' });
        return;
    }
    const group = await client_1.default.group.create({
        data: {
            name,
            ownerId: userId,
            members: {
                create: { userId },
            },
        },
        include: { members: { include: { user: { select: { id: true, name: true } } } } },
    });
    res.status(201).json({
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        ownerId: group.ownerId,
        createdAt: group.createdAt,
        members: group.members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            joinedAt: m.joinedAt,
        })),
    });
}
async function joinGroup(req, res) {
    const { inviteCode } = req.body;
    const userId = req.userId;
    if (!inviteCode) {
        res.status(400).json({ error: 'inviteCode is required' });
        return;
    }
    const group = await client_1.default.group.findUnique({ where: { inviteCode } });
    if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
    }
    const already = await client_1.default.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (already) {
        res.status(409).json({ error: 'Already a member' });
        return;
    }
    await client_1.default.groupMember.create({ data: { groupId: group.id, userId } });
    res.json({ message: 'Joined', groupId: group.id, groupName: group.name });
}
async function listGroups(req, res) {
    const userId = req.userId;
    const memberships = await client_1.default.groupMember.findMany({
        where: { userId },
        include: {
            group: {
                include: {
                    _count: { select: { members: true } },
                },
            },
        },
        orderBy: { joinedAt: 'desc' },
    });
    res.json(memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        inviteCode: m.group.inviteCode,
        ownerId: m.group.ownerId,
        memberCount: m.group._count.members,
        joinedAt: m.joinedAt,
    })));
}
async function getGroupDetail(req, res) {
    const { id } = req.params;
    const userId = req.userId;
    // Verify membership
    const membership = await client_1.default.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId } },
    });
    if (!membership) {
        res.status(403).json({ error: 'Not a member of this group' });
        return;
    }
    const group = await client_1.default.group.findUnique({
        where: { id },
        include: {
            members: {
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });
    if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
    }
    const memberIds = group.members.map((m) => m.userId);
    // Today's ratings for all members
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const todayRatings = await client_1.default.dailyRating.findMany({
        where: { userId: { in: memberIds }, date: todayUTC },
    });
    // Overall avg per member
    const overallAggs = await client_1.default.dailyRating.groupBy({
        by: ['userId'],
        where: { userId: { in: memberIds } },
        _avg: { rating: true },
    });
    const overallMap = new Map(overallAggs.map((a) => [a.userId, a._avg.rating]));
    function fmt(val) {
        if (val === null || val === undefined)
            return null;
        return Math.round(parseFloat(val.toString()) * 10) / 10;
    }
    const todayMap = new Map(todayRatings.map((r) => [r.userId, parseFloat(r.rating.toString())]));
    // Group averages
    const todayGroupAvg = todayRatings.length > 0
        ? Math.round((todayRatings.reduce((sum, r) => sum + parseFloat(r.rating.toString()), 0) /
            todayRatings.length) *
            10) / 10
        : null;
    const allOverall = overallAggs.map((a) => parseFloat((a._avg.rating ?? new library_1.Decimal(0)).toString()));
    const overallGroupAvg = allOverall.length > 0
        ? Math.round((allOverall.reduce((s, v) => s + v, 0) / allOverall.length) * 10) / 10
        : null;
    res.json({
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        ownerId: group.ownerId,
        todayGroupAvg,
        overallGroupAvg,
        members: group.members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            joinedAt: m.joinedAt,
            todayRating: todayMap.get(m.userId) ?? null,
            overallAvg: fmt(overallMap.get(m.userId)),
        })),
    });
}
