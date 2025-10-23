import { useState, useEffect, useCallback } from 'react';
import { liveKitAPI } from '../services/api';

export const useCallNotification = (userType, appointments) => {
  const [notification, setNotification] = useState(null);
  const [checkedRooms, setCheckedRooms] = useState(new Set());

  const checkForActiveCalls = useCallback(async () => {
    if (!appointments || appointments.length === 0) {
      console.log('[CallNotification] No appointments to check');
      return;
    }

    // Only check confirmed appointments
    const confirmedAppointments = appointments.filter(
      apt => apt.status?.toLowerCase() === 'confirmed'
    );

    console.log(`[CallNotification] Checking ${confirmedAppointments.length} confirmed appointments as ${userType}`);

    for (const appointment of confirmedAppointments) {
      const roomId = `room_${appointment.id}`;
      
      // Skip if we already notified about this room
      if (checkedRooms.has(roomId)) {
        console.log(`[CallNotification] Skipping appointment ${appointment.id} - already checked`);
        continue;
      }

      try {
        console.log(`[CallNotification] Checking room status for appointment ${appointment.id}`);
        // Check if room is active (someone is in it)
        const response = await liveKitAPI.checkRoomStatus(appointment.id);
        
        console.log(`[CallNotification] Response for appointment ${appointment.id}:`, response);
        
        // Show notification only if there are actual participants in the room
        if (response.success && response.data.is_active && response.data.participant_count > 0) {
          // Someone is in the room! Show notification
          const callerName = userType === 'patient' 
            ? appointment.doctor?.name || appointment.doctor?.full_name || 'Doctor'
            : appointment.patient?.name || 'Patient';
          
          const callerType = userType === 'patient' ? 'doctor' : 'patient';

          console.log(`[CallNotification] 🔔 Active call detected! ${callerName} is in the room (${response.data.participant_count} participants)`);

          setNotification({
            callerName,
            callerType,
            appointmentId: appointment.id,
            appointment
          });

          // Mark this room as checked
          setCheckedRooms(prev => new Set([...prev, roomId]));
          break; // Only show one notification at a time
        } else {
          console.log(`[CallNotification] No active call for appointment ${appointment.id}:`, {
            success: response.success,
            is_active: response.data?.is_active,
            participant_count: response.data?.participant_count
          });
        }
      } catch (error) {
        console.error('[CallNotification] Error checking room status:', error);
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
