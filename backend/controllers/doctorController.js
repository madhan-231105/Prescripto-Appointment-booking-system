import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await doctorModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId;
    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    // Get docId from the auth middleware, NOT the body.
    // Check your authDoctor middleware to see where it stores the ID (e.g., req.docId or req.doctor.id)
    const docId = req.docId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    // Use .toString() to safely compare MongoDB ObjectIDs
    if (appointmentData && appointmentData.docId.toString() === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      return res.json({ success: true, message: "Appointment Cancelled" });
    }

    res.json({
      success: false,
      message: "Failed to cancel appointment. Authorization error.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to complete appointment
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    // Get docId from the auth middleware, NOT the body.
    const docId = req.docId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      return res.json({ success: true, message: "Appointment Completed" });
    }

    // Corrected error message
    res.json({
      success: false,
      message: "Failed to complete appointment. Authorization error.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
  try {
    const docId = req.body;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availablity Changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    // STEP 1: Log to confirm the function is running.
    console.log("--- Executing doctorProfile Controller ---");

    // STEP 2: Get the docId from the auth middleware and log it.
    // This is the most likely point of failure. Is it undefined?
    const docId = req.docId;
    console.log("Attempting to find profile for docId:", docId);

    if (!docId) {
      return res.json({
        success: false,
        message: "Doctor ID not found in token.",
      });
    }

    // STEP 3: Find the doctor in the database and LOG THE RESULT.
    const doctorData = await doctorModel.findById(docId);
    console.log("Result from doctorModel.findById():", doctorData);

    // This is why you get `null`. If `doctorData` is null, the query found nothing.
    if (!doctorData) {
      return res.json({
        success: true,
        profileData: null,
        message: "Doctor not found in database.",
      });
    }

    // If it works, send the data back.
    res.json({ success: true, profileData: doctorData });
  } catch (error) {
    console.error("CRITICAL ERROR in doctorProfile:", error);
    res.json({ success: false, message: "Server error." });
  }
};

// CORRECTED AND SECURE CONTROLLER

// API to update doctor profile data from Doctor Panel
// API to update doctor profile data from Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.docId; // From auth middleware
    const { fees, address, available, about } = req.body;

    await doctorModel.findByIdAndUpdate(docId, {
      fees,
      address,
      available,
      about,
    });

    console.log(`Profile updated for docId: ${docId}`);
    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.json({ success: false, message: "Error updating profile." });
  }
};

// API to get dashboard data for doctor panel
// API for doctor dashboard
const doctorDashboard = async (req, res) => {
  try {
    // STEP 1: Log to confirm the function is being called.
    console.log("--- Executing doctorDashboard Controller ---");

    // STEP 2: Get the docId from the auth middleware and log it.
    // Make sure you're getting the correct ID!
    const docId = req.docId;
    console.log("Fetching dashboard data for docId:", docId);

    if (!docId) {
      return res.json({
        success: false,
        message: "Authentication error: docId not found.",
      });
    }

    // STEP 3: Execute and log the result of EACH database query.
    const appointments = await appointmentModel.find({ docId: docId });
    console.log(`Found ${appointments.length} total appointments.`);

    const patients = await appointmentModel.distinct("userId", {
      docId: docId,
    });
    console.log(`Found ${patients.length} distinct patients.`);

    const completedAppointments = appointments.filter((a) => a.isCompleted);
    const earnings = completedAppointments.reduce(
      (sum, app) => sum + app.amount,
      0
    );
    console.log(
      `Calculated earnings: ${earnings} from ${completedAppointments.length} completed appointments.`
    );

    const latestAppointments = await appointmentModel
      .find({ docId: docId })
      .sort({ createdAt: -1 })
      .populate("userData");
    console.log(
      `Found ${latestAppointments.length} latest appointments to return.`
    );

    // STEP 4: Construct and log the final object you are sending to the frontend.
    // Verify these keys match your frontend JSX EXACTLY.
    const dashData = {
      earnings: earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: latestAppointments,
    };

    console.log("Final dashData being sent:", dashData);

    res.json({ success: true, dashData: dashData });
  } catch (error) {
    console.error("CRITICAL ERROR in doctorDashboard:", error);
    res.json({ success: false, message: "An error occurred on the server." });
  }
};

export {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};
