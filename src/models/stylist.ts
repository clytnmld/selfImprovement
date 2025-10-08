export interface Stylist {
  id: number;
  name: string;
  description?: string; // optional
  serviceIds: number[];
  shifts: string[];
  status: string; // 'active' or 'inactive'
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
