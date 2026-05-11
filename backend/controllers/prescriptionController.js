// backend/controllers/prescriptionController.js
// NEW FILE – doctor creates / views prescriptions; patient views their own

import appointmentModel from "../models/appointmentModel.js";

// ─── Doctor: Create or update prescription for an appointment ────────────────
export const createPrescription = async (req, res) => {
    try {
        const { docId } = req.body; // injected by authDoctor middleware
        const { appointmentId, medicines, diagnosis, notes } = req.body;

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Only the assigned doctor can create a prescription
        if (appointment.docId !== docId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        // Validate medicines array
        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.json({ success: false, message: "At least one medicine is required" });
        }

        appointment.prescription = {
            medicines,
            diagnosis: diagnosis || "",
            notes: notes || "",
            createdAt: new Date()
        };

        // Auto-mark appointment as completed when prescription is issued
        appointment.isCompleted = true;

        await appointment.save();

        res.json({
            success: true,
            message: "Prescription saved successfully",
            prescription: appointment.prescription
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Doctor: Get prescription for an appointment ─────────────────────────────
export const getPrescriptionDoctor = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        res.json({
            success: true,
            prescription: appointment.prescription || null
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Patient: View their prescription ────────────────────────────────────────
export const getPrescriptionUser = async (req, res) => {
    try {
        const { userId } = req.body; // from authUser middleware
        const { appointmentId } = req.params;

        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Patient can only see their own prescription
        if (appointment.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        res.json({
            success: true,
            prescription: appointment.prescription || null,
            docData: appointment.docData,
            userData: appointment.userData,
            slotDate: appointment.slotDate,
            slotTime: appointment.slotTime
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};