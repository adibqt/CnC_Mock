-- Check current appointments and their statuses
SELECT 
    a.id,
    a.appointment_date,
    a.time_slot,
    a.status,
    a.symptoms,
    p.name as patient_name,
    d.name as doctor_name
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.appointment_date DESC;

-- If you need to manually set some appointments to 'completed' for testing:
-- UPDATE appointments SET status = 'completed' WHERE id IN (1, 2, 3);
-- (Replace 1,2,3 with actual appointment IDs you want to mark as completed)
