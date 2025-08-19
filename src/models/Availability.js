/**
 * Availability Model
 * Represents employee availability for each day of the week
 */
export class Availability {
  constructor(data = {}) {
    this.monday = this.createDayAvailability(data.monday);
    this.tuesday = this.createDayAvailability(data.tuesday);
    this.wednesday = this.createDayAvailability(data.wednesday);
    this.thursday = this.createDayAvailability(data.thursday);
    this.friday = this.createDayAvailability(data.friday);
    this.saturday = this.createDayAvailability(data.saturday);
    this.sunday = this.createDayAvailability(data.sunday);
  }

  createDayAvailability(dayData = {}) {
    return {
      available: dayData.available !== undefined ? dayData.available : true,
      startTime: dayData.startTime || '09:00',
      endTime: dayData.endTime || '17:00',
      notes: dayData.notes || ''
    };
  }

  // Get availability for specific day
  getDayAvailability(dayOfWeek) {
    const day = dayOfWeek.toLowerCase();
    return this[day] || this.createDayAvailability();
  }

  // Set availability for specific day
  setDayAvailability(dayOfWeek, availability) {
    const day = dayOfWeek.toLowerCase();
    this[day] = this.createDayAvailability(availability);
  }

  // Check if available on specific day and time
  canWorkOn(dayOfWeek, startTime, endTime) {
    const day = this.getDayAvailability(dayOfWeek);
    if (!day.available) return false;

    // Convert times to minutes for comparison
    const dayStart = this.timeToMinutes(day.startTime);
    const dayEnd = this.timeToMinutes(day.endTime);
    const shiftStart = this.timeToMinutes(startTime);
    const shiftEnd = this.timeToMinutes(endTime);

    return shiftStart >= dayStart && shiftEnd <= dayEnd;
  }

  // Convert time string to minutes (e.g., "09:30" -> 570)
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Convert minutes to time string (e.g., 570 -> "09:30")
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Get weekly availability hours
  getWeeklyHours() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalHours = 0;

    days.forEach(day => {
      const dayAvail = this[day];
      if (dayAvail.available) {
        const startMinutes = this.timeToMinutes(dayAvail.startTime);
        const endMinutes = this.timeToMinutes(dayAvail.endTime);
        const dayHours = (endMinutes - startMinutes) / 60;
        totalHours += dayHours;
      }
    });

    return totalHours;
  }

  // Get available days
  getAvailableDays() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.filter(day => this[day].available);
  }

  // Check if available on weekends
  isWeekendAvailable() {
    return this.saturday.available || this.sunday.available;
  }

  // Check if available on weekdays
  isWeekdayAvailable() {
    return this.monday.available || this.tuesday.available || 
           this.wednesday.available || this.thursday.available || 
           this.friday.available;
  }

  // Get default availability (weekdays 9-5)
  static getDefaultAvailability() {
    return {
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' }
    };
  }

  // Convert to plain object for API calls
  toJSON() {
    return {
      monday: this.monday,
      tuesday: this.tuesday,
      wednesday: this.wednesday,
      thursday: this.thursday,
      friday: this.friday,
      saturday: this.saturday,
      sunday: this.sunday
    };
  }

  // Create from plain object
  static fromJSON(data) {
    return new Availability(data);
  }
}
