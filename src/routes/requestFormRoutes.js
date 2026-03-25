import express from 'express';
import { approveRequestForm, createRequestForm, deleteRequestForm, getAllRequestForms, receivedRequestForm, rejectRequestForm, updateRequestForm, validateRequestForm } from '../controllers/requestFormController.js';

const router = express.Router;

router.get('/', getAllRequestForms);
router.post('/', createRequestForm);
router.patch('/:id', updateRequestForm);
router.delete('/:id', deleteRequestForm);
router.patch('/:id/submit', submitRequestForm);
router.patch('/:id/validate', validateRequestForm);
router.patch('/:id/approve', approveRequestForm);
router.patch('/:id/reject', rejectRequestForm);
router.patch('/:id/received', receivedRequestForm);

export default router;