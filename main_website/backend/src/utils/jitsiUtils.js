import crypto from 'crypto';

/**
 * Generate a unique Jitsi meeting ID for a slot
 * Format: slot-{8-char-hash}-{date}
 * @param {Object} slotData - Slot data containing doctor, date, startTime
 * @returns {string} - Unique Jitsi meeting ID
 */
export const generateJitsiMeetingId = (slotData) => {
  const { doctor, date, startTime } = slotData;
  
  // Create a hash from doctor ID, date, and time for uniqueness
  const hashInput = `${doctor}-${date}-${startTime}`;
  const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8);
  
  // Format: slot-{hash}-{date}
  const dateStr = new Date(date).toISOString().split('T')[0].replace(/-/g, '');
  return `slot-${hash}-${dateStr}`;
};

/**
 * Generate Jitsi meeting URL from meeting ID
 * @param {string} meetingId - The meeting ID
 * @returns {string} - Full Jitsi Meet URL
 */
export const generateJitsiUrl = (meetingId) => {
  return `https://meet.jit.si/${meetingId}`;
};

/**
 * Validate Jitsi meeting ID format
 * @param {string} meetingId - The meeting ID to validate
 * @returns {boolean} - True if valid format
 */
export const isValidJitsiMeetingId = (meetingId) => {
  const pattern = /^slot-[a-f0-9]{8}-\d{8}$/;
  return pattern.test(meetingId);
};







