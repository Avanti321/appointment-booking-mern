Online Appointment Booking System using(MERN)

Booking an Appointment
1.Patient browses doctors, selects a date and time slot
2.Chooses appointment type: Online (Video) or Offline (OPD)
3.Pays via Razorpay (or pay cash at clinic)
Appointment appears in My Appointments

Video Consultation
1.Doctor clicks Start Call on an online appointment
2.A Socket.IO room is created and stored against the appointment
3.Patient sees Join Video Call button appear (page auto-refreshes every 60s)
4.Both join the WebRTC call via the same room ID

Auto-Complete
A cron job runs every minute on the server. Any appointment whose slot time + 30 minutes has passed is automatically marked as isCompleted: true. The patient's My Appointments page polls every 60 seconds to reflect this.

Rating & Review
1.After an appointment is marked completed, the patient sees a ⭐ Rate Doctor button
2.Patient selects 1–5 stars and optionally writes a review
3.The doctor's averageRating and totalRatings are recalculated immediately
4.Doctor sees the rating in their appointments list, dashboard card, and profile page

Digital Prescription
1.Doctor clicks Add Rx on any appointment
2.Fills in diagnosis, medicines (name, dosage, frequency, duration, instructions), and notes
3.Patient can view and print the prescription from My Appointments