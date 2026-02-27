import { Response } from 'express'
import { Decimal } from '@prisma/client/runtime/library'
import prisma from '../prisma/client'
import { AuthRequest } from '../middleware/auth'

export async function saveRating(req: AuthRequest, res: Response): Promise<void> {
  const { date, rating } = req.body
  const userId = req.userId!

  if (!date || rating === undefined || rating === null) {
    res.status(400).json({ error: 'date and rating are required' })
    return
  }

  // Validate rating range and precision
  const ratingNum = parseFloat(rating)
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
    res.status(400).json({ error: 'rating must be between 0 and 10' })
    return
  }
  // Ensure at most 1 decimal place
  if (Math.round(ratingNum * 10) / 10 !== ratingNum) {
    res.status(400).json({ error: 'rating must have at most 1 decimal place' })
    return
  }

  // Parse date and validate not future
  const dateObj = new Date(date + 'T00:00:00.000Z')
  if (isNaN(dateObj.getTime())) {
    res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    return
  }

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  if (dateObj > todayUTC) {
    res.status(400).json({ error: 'Cannot rate a future date' })
    return
  }

  // Check for duplicate
  const existing = await prisma.dailyRating.findUnique({
    where: { userId_date: { userId, date: dateObj } },
  })
  if (existing) {
    res.status(409).json({ error: 'You already rated this day' })
    return
  }

  const saved = await prisma.dailyRating.create({
    data: {
      userId,
      date: dateObj,
      rating: new Decimal(ratingNum),
    },
  })

  res.status(201).json({
    id: saved.id,
    date: saved.date.toISOString().split('T')[0],
    rating: parseFloat(saved.rating.toString()),
  })
}

export async function listRatings(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!

  const ratings = await prisma.dailyRating.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  res.json(
    ratings.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      rating: parseFloat(r.rating.toString()),
    }))
  )
}

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!

  const now = new Date()

  // Weekly: last 7 days
  const weekAgo = new Date(now)
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6)
  weekAgo.setUTCHours(0, 0, 0, 0)

  // Monthly: current calendar month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  // Yearly: current calendar year
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))

  const [weekly, monthly, yearly, overall] = await Promise.all([
    prisma.dailyRating.aggregate({
      where: { userId, date: { gte: weekAgo } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.dailyRating.aggregate({
      where: { userId, date: { gte: monthStart } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.dailyRating.aggregate({
      where: { userId, date: { gte: yearStart } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.dailyRating.aggregate({
      where: { userId },
      _avg: { rating: true },
      _count: true,
    }),
  ])

  function fmt(val: Decimal | null): number | null {
    if (val === null) return null
    return Math.round(parseFloat(val.toString()) * 10) / 10
  }

  res.json({
    weekly: { avg: fmt(weekly._avg.rating), count: weekly._count },
    monthly: { avg: fmt(monthly._avg.rating), count: monthly._count },
    yearly: { avg: fmt(yearly._avg.rating), count: yearly._count },
    overall: { avg: fmt(overall._avg.rating), count: overall._count },
  })
}
