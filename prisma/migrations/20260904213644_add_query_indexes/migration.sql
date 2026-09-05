-- CreateIndex
CREATE INDEX "Appointment_startAt_status_idx" ON "Appointment"("startAt", "status");

-- CreateIndex
CREATE INDEX "Appointment_patientId_startAt_idx" ON "Appointment"("patientId", "startAt");

-- CreateIndex
CREATE INDEX "Appointment_providerId_startAt_idx" ON "Appointment"("providerId", "startAt");

-- CreateIndex
CREATE INDEX "Assessment_patientId_takenAt_idx" ON "Assessment"("patientId", "takenAt");

-- CreateIndex
CREATE INDEX "CancelRequest_status_createdAt_idx" ON "CancelRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Message_recipientId_createdAt_idx" ON "Message"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_patientId_createdAt_idx" ON "Note"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Patient_status_idx" ON "Patient"("status");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");
