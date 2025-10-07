export interface Stylist {
  id: number;
  name: string;
  description?: string; // optional
  serviceIds: number[]; // e.g. ["haircut", "coloring"]
  shifts: string[]; // e.g. ["09:00-12:00", "13:00-17:00"]
}
