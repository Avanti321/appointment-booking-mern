import express from 'express'
import {
    createPrescription,
    getPrescriptionDoctor,
    getPrescriptionUser
} from '../controllers/prescriptionController.js'
import authDoctor from '../middlewares/authDoctor.js'
import authUser   from '../middlewares/authUser.js'
 
const prescriptionRouter = express.Router()
 
// Doctor creates prescription
prescriptionRouter.post('/create',                     authDoctor, createPrescription)
 
// Doctor views prescription for an appointment
prescriptionRouter.get('/doctor/:appointmentId',       authDoctor, getPrescriptionDoctor)
 
// Patient views their prescription
prescriptionRouter.get('/patient/:appointmentId',      authUser,   getPrescriptionUser)
 
export default prescriptionRouter