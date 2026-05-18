import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const blogController = {
  /**
   * Get all published blog posts
   */
  async getPosts(req: Request, res: Response) {
    try {
      const posts = await (prisma as any).blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  },

  /**
   * Get a single blog post by slug
   */
  async getPostBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const post = await (prisma as any).blogPost.findUnique({
        where: { slug }
      });
      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  },

  /**
   * Get active seasonal campaigns
   */
  async getCampaigns(req: Request, res: Response) {
    try {
      const campaigns = await (prisma as any).seasonalCampaign.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }
};
