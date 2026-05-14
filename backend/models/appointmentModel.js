// backend/models/appointmentModel.js

import mongoose from "mongoose"

const prescriptionSchema = new mongoose.Schema({
    medicines: [
        {
            name:         { type: String, required: true },
            dosage:       { type: String, required: true },
            frequency:    { type: String, required: true },
            duration:     { type: String, required: true },
            instructions: { type: String, default: "" }
        }
    ],
    diagnosis: { type: String, default: "" },
    notes:     { type: String, default: "" },
    createdAt: { type: Date,   default: Date.now }
})

const appointmentSchema = new mongoose.Schema({
    userId:   { type: String, required: true },
    docId:    { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData:  { type: Object, required: true },
    amount:   { type: Number, required: true },
    date:     { type: Number, required: true },

    cancelled:   { type: Boolean, default: false },
    payment:     { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },

    // Payment mode
    paymentMode: {
        type:    String,
        enum:    ['online', 'cash'],
        default: 'online'
    },

    // Appointment type: 'online' (video) or 'offline' (OPD visit)
    appointmentType: {
        type:    String,
        enum:    ['online', 'offline'],
        default: 'online'
    },

    // Video Call fields
    videoRoomId:       { type: String, default: null },
    videoCallStatus:   { type: String, default: "idle" },
    videoCallStartedAt:{ type: Date,   default: null },
    videoCallEndedAt:  { type: Date,   default: null },

    // Prescription (embedded)
    prescription: { type: prescriptionSchema, default: null },

    // Rating & Review
    rating:     { type: Number, min: 1, max: 5, default: null },
    review:     { type: String, default: null },
    isReviewed: { type: Boolean, default: false },

    // ── NEW: Reminder email tracking ─────────────────────────────────────────
    // Set to true once the 1-hour reminder email has been sent.
    // Prevents the cron job from sending duplicate reminders.
    reminderSent: { type: Boolean, default: false }
})

// ── Indexes ───────────────────────────────────────────────────────────────────
appointmentSchema.index({ cancelled: 1, isCompleted: 1 })
appointmentSchema.index({ userId: 1 })
appointmentSchema.index({ docId:   1 })

const appointmentModel =
    mongoose.models.appointment ||
    mongoose.model('appointment', appointmentSchema)

export default appointmentModel