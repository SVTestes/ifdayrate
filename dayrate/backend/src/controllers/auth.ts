import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../prisma/client'

const ACCESS_TOKEN_EXPIRES = '15m'
const REFRESH_TOKEN_EXPIRES_DAYS = 30

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES })
}

function generateRefreshToken(): string {
  return uuidv4()
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  res.status(201).json({ user })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const accessToken = generateAccessToken(user.id)
  const refreshTokenValue = generateRefreshToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt,
    },
  })

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })

  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email },
  })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const tokenValue = req.cookies?.refreshToken

  if (!tokenValue) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: tokenValue },
    include: { user: true },
  })

  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
    return
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: stored.id } })

  const newRefreshToken = generateRefreshToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

  await prisma.refreshToken.create({
    data: {
      userId: stored.userId,
      token: newRefreshToken,
      expiresAt,
    },
  })

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })

  const accessToken = generateAccessToken(stored.userId)
  res.json({
    accessToken,
    user: {
      id: stored.user.id,
      name: stored.user.name,
      email: stored.user.email,
    },
  })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const tokenValue = req.cookies?.refreshToken

  if (tokenValue) {
    await prisma.refreshToken.deleteMany({ where: { token: tokenValue } })
  }

  res.clearCookie('refreshToken', { path: '/' })
  res.json({ message: 'Logged out' })
}
