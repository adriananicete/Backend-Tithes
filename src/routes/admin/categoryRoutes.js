import express from 'express';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../../controllers/admin/categoryController.js';

const router = express.Router();

// @desc   Get all categories
// @routes /api/admin/categories
router.get('/', getAllCategories);

// @desc   Create new category
// @routes /api/admin/categories
router.post('/', createCategory);

// @desc   Update category
// @routes /api/admin/categories/:id
router.patch('/:id', updateCategory);

// @desc   Delete category
// @routes /api/admin/categories/:id
router.patch('/:id', deleteCategory);

export default router;