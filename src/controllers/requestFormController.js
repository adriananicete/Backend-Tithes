import mongoose from "mongoose";
import { RequestForm } from "../models/RequestForm";

const getAllRequestForms = async (req, res) => {
  try {
    const requestForms  = await RequestForm.find().populate('requestedBy', 'name role').populate('category', 'name type').populate('approvedBy', 'name role').populate('validatedBy', 'name role');
    if(requestForms .length === 0) return res.status(400).json({message: 'Request Form empty'});

    res.status(200).json({
      status: 'Success',
      count: requestForms .length,
      data: requestForms 

    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const createRequestForm = async (req, res) => {
  try {
    const { entryDate, category, estimatedAmount, attachments } =
      req.body;
    
      if(!entryDate) {
        return res.status(400).json({error: 'Entry Date required!'});
      } else if(!category) {
        return res.status(400).json({error: 'Category required!'});
      } else if(!estimatedAmount) {
        return res.status(400).json({error: 'Estimated Amount required!'});
      }

      // RF formatter
      const lastRF = await RequestForm.findOne().sort({rfNo: -1});
      const lastNumber = lastRF ? parseInt(lastRF.rfNo.split('-')[1]) : 0;
      const newRfNo = `RF-${String(lastNumber + 1).padStart(4, '0')}`;

      const newRequestForm = new RequestForm({
        rfNo: newRfNo,
        entryDate,
        category,
        estimatedAmount,
        attachments,
        requestedBy: req.user.id
      });

      await newRequestForm.save()

      res.status(200).json({
        status: 'Success',
        message: 'Request Form Sent',
        data: {
            newRequestForm
        }
      })

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const submitRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const findRfId = await RequestForm.findById(id);
    if(!findRfId) return res.status(404).json({error: 'Request form ID not found'});

    if(findRfId.requestedBy.toString() !== req.user.id) return res.status(400).json({error: 'You cannot submit this request'});

    if(findRfId.status !== 'draft') return res.status(400).json({error: 'Already Submitted'});

    const submittedRequestForm = await RequestForm.findByIdAndUpdate(id, {$set: {status: 'submitted'}},{new: true})

    res.status(200).json({
        status: 'Success',
        message: 'Request Form Submitted'
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const updateRequestForm = async (req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({error: 'Invalid ID'});
    const { body } = req;

    const findRequestFormById = await RequestForm.findByIdAndUpdate(id, body, {new: true});
    if(!findRequestFormById) return res.status(404).json({error: 'Request Form not found!'});

    res.status(200).json({
      status: 'Success',
      message: 'Updated Successfully',
      data: findRequestFormById
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const deleteRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const validateRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const approveRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const rejectRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const receivedRequestForm = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getAllRequestForms,
  createRequestForm,
  submitRequestForm,
  updateRequestForm,
  deleteRequestForm,
  validateRequestForm,
  approveRequestForm,
  rejectRequestForm,
  receivedRequestForm,
};
