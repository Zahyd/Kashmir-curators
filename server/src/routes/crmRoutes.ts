import { Router } from 'express';
import { 
  getCRMLeads,
  createCRMLead, 
  getLeadDetail, 
  updateLeadStage,
  addLeadNote,
  getLeadNotes,
  deleteLeadNote,
  getLeadReminders,
  createReminder,
  updateReminder,
  getPendingReminders,
  checkDuplicateLeads,
  mergeDuplicateLead,
  assignLead,
  getCRMBIMetrics
} from '../controllers/crmController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Restrict CRM operations strictly to authenticated staff/agent roles
router.use(authenticateToken, authorizeRoles('admin', 'operations', 'sales', 'marketing', 'finance', 'agent'));

// Lead pipeline & details
router.get('/leads', getCRMLeads);
router.post('/leads', createCRMLead);
router.get('/leads/:id', getLeadDetail);
router.patch('/leads/:id', updateLeadStage);
router.patch('/leads/:id/stage', updateLeadStage);
router.post('/leads/:id/assign', assignLead);

// Duplicate detection & resolution
router.get('/leads/:id/duplicates', checkDuplicateLeads);
router.post('/leads/:id/merge', mergeDuplicateLead);

// Team Notes
router.get('/leads/:id/notes', getLeadNotes);
router.post('/leads/:id/notes', addLeadNote);
router.delete('/notes/:noteId', deleteLeadNote);

// Follow-Up Reminders
router.get('/reminders/pending', getPendingReminders);
router.get('/leads/:id/reminders', getLeadReminders);
router.post('/leads/:id/reminders', createReminder);
router.patch('/reminders/:reminderId', updateReminder);

// Business Intelligence & Operations Metrics
router.get('/bi/metrics', getCRMBIMetrics);

export default router;
