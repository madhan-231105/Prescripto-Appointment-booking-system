import express from 'express'
import { addDoctor, adminDashboard, allDoctors, AppointmentCancel, appointmentsAdmin, LoginAdmin } from '../controllers/admincontroller.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailablity } from "../controllers/doctorController.js";

const adminRouter = express.Router()

adminRouter.post('/add-doctor', authAdmin,upload.single('image'), addDoctor)
adminRouter.post('/login', LoginAdmin)
adminRouter.get('/all-doctors',allDoctors)
adminRouter.post('/change-availability', authAdmin,changeAvailablity)
adminRouter.get('/appointments',authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment',authAdmin,AppointmentCancel)
adminRouter.get('/dashboard',authAdmin,adminDashboard)
export default adminRouter 
