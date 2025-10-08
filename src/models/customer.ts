export interface Customer {
  id: number;
  name: string;
  phone: string;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
