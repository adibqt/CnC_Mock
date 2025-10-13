import { useState, useEffect, useCallback } from 'react';
import { liveKitAPI } from '../services/api';

export const useCallNotification = (userType, appointments) => {
  const [notification, setNotification] = useState(null);
  const [checkedRooms, setCheckedRooms] = useState(new Set());

  const checkForActiveCalls = useCallback(async () => {
    if (!appointments || appointments.length === 0) return;

    // Only check confirmed appointments
    const confirmedAppointments = appointments.filter(
      apt => apt.status?.toLowerCase() === 'confirmed'
    );

    for (const appointment of confirmedAppointments) {
      const roomId = `room_${appointment.id}`;
      
      // Skip if we already notified about this room
      if (checkedRooms.has(roomId)) continue;

      try {
        // Check if room is active (someone is in it)
        const response = await liveKitAPI.checkRoomStatus(appointment.id);
        
        if (response.success && response.data.is_active && response.data.participant_count > 0) {
          // Someone is in the room! Show notification
          const callerName = userType === 'patient' 
            ? appointment.doctor?.name || 'Doctor'
            : appointment.patient?.name || 'Patient';
          
          const callerType = userType === 'patient' ? 'doctor' : 'patient';

          setNotification({
            callerName,
            callerType,
            appointmentId: appointment.id,
            appointment
          });

          // Mark this room as checked
          setCheckedRooms(prev => new Set([...prev, roomId]));
          break; // Only show one notification at a time
        }
      } catch (error) {
        console.error('Error checking room status:', error);
      }
    }
  }, [appointments, userType, checkedRooms]);

  useEffect(() => {
    // Check immediately
    checkForActiveCalls();

    // Then check every 5 seconds
    const interval = setInterval(checkForActiveCalls, 5000);

    return () => clearInterval(interval);
  }, [checkForActiveCalls]);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const resetCheckedRooms = useCallback(() => {
    setCheckedRooms(new Set());
  }, []);

  return {
    notification,
    dismissNotification,
    resetCheckedRooms
  };
};
