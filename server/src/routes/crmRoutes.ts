import { Router } from 'express';
import { 
  getCRMLeads, 
  getLeadDetail, 
  updateLeadStage,
  addLeadNote,
  getLeadNotes,
  deleteLeadNote,
  createReminder,
  updateReminder,
  getPendingReminders,
  checkDuplicateLeads,
  mergeDuplicateLead,
  assignLead,
  getCRMBIMetrics
} from '../controllers/crmController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Lead pipeline & details
router.get('/leads', authenticateToken, getCRMLeads);
router.get('/leads/:id', authenticateToken, getLeadDetail);
router.patch('/leads/:id', authenticateToken, updateLeadStage);
router.patch('/leads/:id/stage', authenticateToken, updateLeadStage);
router.post('/leads/:id/assign', authenticateToken, assignLead);

// Duplicate detection & resolution
router.get('/leads/:id/duplicates', authenticateToken, checkDuplicateLeads);
router.post('/leads/:id/merge', authenticateToken, mergeDuplicateLead);

// Team Notes
router.get('/leads/:id/notes', authenticateToken, getLeadNotes);
router.post('/leads/:id/notes', authenticateToken, addLeadNote);
router.delete('/notes/:noteId', authenticateToken, deleteLeadNote);

// Follow-Up Reminders
router.get('/reminders/pending', authenticateToken, getPendingReminders);
router.get('/leads/:id/reminders', authenticateToken, getLeadNotes);
router.post('/leads/:id/reminders', authenticateToken, createReminder);
router.patch('/reminders/:reminderId', authenticateToken, updateReminder);

// Business Intelligence & Operations Metrics
router.get('/bi/metrics', authenticateToken, getCRMBIMetrics);

export default router;
