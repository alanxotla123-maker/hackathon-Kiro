import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all DeepLint saves
router.get('/', async (req: Request, res: Response) => {
  try {
    const saves = await prisma.deepLintSave.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(saves);
  } catch (error) {
    console.error('Error fetching DeepLint saves:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a DeepLint save
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, repoUrl, fileName, leftCode, rightCode } = req.body;
    
    if (!name || !repoUrl || !fileName) {
      return res.status(400).json({ error: 'Name, repoUrl, and fileName are required' });
    }

    const newSave = await prisma.deepLintSave.create({
      data: {
        name,
        repoUrl,
        fileName,
        leftCode: leftCode || '',
        rightCode: rightCode || ''
      },
    });

    res.status(201).json(newSave);
  } catch (error) {
    console.error('Error creating DeepLint save:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a DeepLint save
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.deepLintSave.delete({
      where: { id: parseInt(id, 10) },
    });
    res.status(200).json({ message: 'DeepLint save deleted successfully' });
  } catch (error) {
    console.error('Error deleting DeepLint save:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
