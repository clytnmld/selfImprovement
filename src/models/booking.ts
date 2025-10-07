export interface Booking {
  id: number;
  customerId: number;
  stylistId: number;
  serviceId: number;
  startTime: string;
  endTime: string;
  status: 'active' | 'canceled'; // only 2 allowed values
}
