// ReachFlow - Wallet Service
// File: backend/src/services/walletService.js
 
import { prisma } from '../index.js'
 
/**
 * Credit (add money) to a user's wallet
 */
export async function creditWallet(userId, amount, method, description = '') {
  return await prisma.$transaction(async (tx) => {
    // Upsert wallet (create if not exists)
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId, balance: amount, totalEarned: amount },
      update: {
        balance: { increment: amount },
        totalEarned: { increment: amount }
      }
    })
 
    // Create transaction record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        status: 'COMPLETED',
        method,
        description,
      }
    })
 
    return wallet
  })
}
 
/**
 * Deduct (spend) from a user's wallet
 * Used when advertiser pays for a campaign
 */
export async function deductWallet(userId, amount, method, description = '', type = 'CAMPAIGN_PAYMENT') {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } })
 
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient balance')
    }
 
    const updated = await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amount } }
    })
 
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        status: 'COMPLETED',
        method,
        description,
      }
    })
 
    return updated
  })
}
 
/**
 * Credit commission earned by a promoter
 */
export async function creditCommission(userId, amount, description = '') {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { userId },
      create: { userId, balance: amount, totalEarned: amount },
      update: {
        balance: { increment: amount },
        totalEarned: { increment: amount }
      }
    })
 
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'COMMISSION_EARNED',
        amount,
        status: 'COMPLETED',
        method: 'WALLET',
        description,
      }
    })
 
    // Update promoter totalEarned
    await tx.promoter.update({
      where: { userId },
      data: { totalEarned: { increment: amount } }
    })
 
    return wallet
  })
}
 
/**
 * Move money from pending → balance after withdrawal processed
 */
export async function settlePendingWithdrawal(userId, amount) {
  return await prisma.wallet.update({
    where: { userId },
    data: {
      pending: { decrement: amount }
    }
  })
}
 
/**
 * Get wallet with recent transactions
 */
export async function getWallet(userId) {
  return await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 30
      }
    }
  })
}

