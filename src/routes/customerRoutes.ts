import express from 'express';
import { Customer } from '../models/customer';
import { customers } from '../data/customer';
import { bookings } from '../data/booking';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(customers);
});

router.post('/', (req, res) => {
  const { name, phone } = req.body as Customer;

  if (!name || !phone) {
    return res
      .status(400)
      .json({ message: 'name and phone number are required' });
  } else if (isNaN(Number(phone))) {
    return res.status(403).json({ message: 'phone number must be a number' });
  }

  const newCustomer: Customer = {
    id: customers.length + 1,
    name,
    phone,
  };

  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// UPDATE customer
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body as Customer;

  const customer = customers.find((c) => c.id === Number(id));
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found.' });
  }

  if (name !== undefined && name.trim() === '') {
    return res.status(400).json({ message: 'Name cannot be empty.' });
  }

  if (phone !== undefined) {
    if (phone.trim() === '') {
      return res.status(400).json({ message: 'Phone number cannot be empty.' });
    } else if (isNaN(Number(phone))) {
      return res
        .status(403)
        .json({ message: 'Phone number must be a number.' });
    }
  }

  if (name) customer.name = name;
  if (phone) customer.phone = phone;

  res.json({ message: 'Customer updated successfully.', customer });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const customerIndex = customers.findIndex((c) => c.id === Number(id));

  if (customerIndex === -1) {
    return res.status(404).json({ message: 'Customer not found.' });
  }

  const hasBookings = bookings.some(
    (b) => b.customerId === Number(id) && b.status !== 'canceled'
  );
  if (hasBookings) {
    return res.status(400).json({
      message: 'Cannot delete customer with active or past bookings.',
    });
  }

  // Remove customer from the array
  const deletedCustomer = customers.splice(customerIndex, 1)[0];

  res.json({
    message: 'Customer deleted successfully.',
    customer: deletedCustomer,
  });
});

export default router;
