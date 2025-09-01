import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay
} from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/get-profile', authUser, getProfile);
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.post('/cancel-appointment', authUser, (req, res, next) => {
  console.log("✅ Cancel appointment route hit");
  next();
}, cancelAppointment);
userRouter.post('/payment-razorpay', authUser, paymentRazorpay);
userRouter.post('/verify-razorpay', authUser,verifyRazorpay);




// Debug route listing
console.log("Loaded user routes:");
userRouter.stack.forEach(r => {
  if (r.route) {
    console.log(Object.keys(r.route.methods)[0].toUpperCase(), r.route.path);
  }
});




export default userRouter;
