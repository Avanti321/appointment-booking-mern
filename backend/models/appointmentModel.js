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

    // Video Call fields
    videoRoomId:        { type: String, default: null },
    videoCallStatus:    { type: String, default: "idle" },
    videoCallStartedAt: { type: Date,   default: null },
    videoCallEndedAt:   { type: Date,   default: null },

    // Prescription
    prescription: { type: prescriptionSchema, default: null }
})

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema)

export default appointmentModel