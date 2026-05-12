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
    diagnosis:  { type: String, default: "" },
    notes:      { type: String, default: "" },
    createdAt:  { type: Date, default: Date.now }
})

const appointmentSchema = new mongoose.Schema({
    userId:      { type: String,  required: true },
    docId:       { type: String,  required: true },
    slotDate:    { type: String,  required: true },
    slotTime:    { type: String,  required: true },
    userData:    { type: Object,  required: true },
    docData:     { type: Object,  required: true },
    amount:      { type: Number,  required: true },
    date:        { type: Number,  required: true },
    cancelled:   { type: Boolean, default: false },
    payment:     { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },

    // ✅ Appointment type: 'online' (video) or 'offline' (OPD visit)
    appointmentType: { type: String, enum: ['online', 'offline'], default: 'online' },

    // Video Call fields
    videoRoomId:        { type: String, default: null },
    videoCallStatus:    { type: String, default: "idle" },
    videoCallStartedAt: { type: Date,   default: null },
    videoCallEndedAt:   { type: Date,   default: null },

    // Prescription
    prescription: { type: prescriptionSchema, default: null },

    // ── Rating & Review (submitted by patient after completion) ───────────────
    rating:     { type: Number, min: 1, max: 5, default: null },
    review:     { type: String, default: null },
    isReviewed: { type: Boolean, default: false }
})

// ── Indexes ───────────────────────────────────────────────────────────────────
// Speeds up the cron job query that fetches all active (non-cancelled,
// non-completed) appointments every minute.
appointmentSchema.index({ cancelled: 1, isCompleted: 1 })

// Speeds up per-user and per-doctor appointment lookups used across
// the patient, doctor, and admin dashboards.
appointmentSchema.index({ userId: 1 })
appointmentSchema.index({ docId: 1 })

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema)

export default appointmentModel