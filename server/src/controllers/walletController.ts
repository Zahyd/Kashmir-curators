import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getMyWallet = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: 'INR'
        },
        include: {
          history: true
        }
      });
    }

    res.json(wallet);
  } catch (error: any) {
    console.error('getMyWallet error:', error.message);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
};

export const applyWalletCredits = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { amount, bookingId, description } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient wallet credit balance');
      }

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } }
      });

      const txRecord = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          source: 'BOOKING_PAYMENT',
          referenceId: bookingId || null,
          description: description || `Redeemed credits for booking #${bookingId ? bookingId.slice(-6) : 'trip'}`
        }
      });

      return { wallet: updated, transaction: txRecord };
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('applyWalletCredits error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to apply credits' });
  }
};
