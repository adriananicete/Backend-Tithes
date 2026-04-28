import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  approveRequestForm,
  createRequestForm,
  deleteRequestForm,
  disburseRequestForm,
  getAllRequestForms,
  receivedRequestForm,
  rejectRequestForm,
  submitRequestForm,
  updateRequestForm,
  validateRequestForm,
} from "../controllers/requestFormController.js";

const router = express.Router();

router.get("/", verifyToken, getAllRequestForms);
router.post("/", verifyToken, createRequestForm);
router.patch("/:id", verifyToken, updateRequestForm);
router.delete("/:id", verifyToken, deleteRequestForm);
router.patch("/:id/submit", verifyToken, submitRequestForm);
router.patch("/:id/validate", verifyToken, validateRequestForm);
router.patch("/:id/approve", verifyToken, approveRequestForm);
router.patch("/:id/reject", verifyToken, rejectRequestForm);
router.patch("/:id/disburse", verifyToken, disburseRequestForm);
router.patch("/:id/received", verifyToken, receivedRequestForm);

export default router;
