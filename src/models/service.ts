export interface Service {
  id: number;
  name: string; // e.g. "Haircut"
  duration: number; // in minutes
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
