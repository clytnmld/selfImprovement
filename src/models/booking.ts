export interface Booking {
  id: number;
  customerId: number;
  stylistId: number;
  serviceId: number;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: 'active' | 'canceled'; // only 2 allowed values
  createdAt: Date;
  updatedAt: Date;
}
