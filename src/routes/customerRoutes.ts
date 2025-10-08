import express from "express";
import prisma from "../prisma"; // ✅ connect to the DB
import { Customer } from "../models/customer";

const router = express.Router();

router.get("/", async (req, res) => {
  // res.json(customers);
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch customers." });
  }
});

router.post("/", async (req, res) => {
  const { name, phone } = req.body as Customer;

  if (!name || !phone) {
    return res
      .status(400)
      .json({ message: "name and phone number are required" });
  } else if (isNaN(Number(phone))) {
    return res.status(403).json({ message: "phone number must be a number" });
  }

  // const newCustomer: Customer = {
  //   id: customers.length + 1,
  //   name,
  //   phone,
  // };

  // customers.push(newCustomer);
  // res.status(201).json(newCustomer);
  try {
    const newCustomer = await prisma.customer.create({
      data: { name, phone },
    });

    res.status(201).json(newCustomer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create customer." });
  }
});

// UPDATE customer
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body as Customer;

  // const customer = customers.find((c) => c.id === Number(id));
  // if (!customer) {
  //   return res.status(404).json({ message: 'Customer not found.' });
  // }

  // if (name !== undefined && name.trim() === '') {
  //   return res.status(400).json({ message: 'Name cannot be empty.' });
  // }

  // if (phone !== undefined) {
  //   if (phone.trim() === '') {
  //     return res.status(400).json({ message: 'Phone number cannot be empty.' });
  //   } else if (isNaN(Number(phone))) {
  //     return res
  //       .status(403)
  //       .json({ message: 'Phone number must be a number.' });
  //   }
  // }

  // if (name) customer.name = name;
  // if (phone) customer.phone = phone;

  // res.json({ message: 'Customer updated successfully.', customer });
  try {
    const existing = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "Customer not found." });
    }

    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    if (phone !== undefined) {
      if (phone.trim() === "") {
        return res.status(400).json({ message: "Phone cannot be empty." });
      } else if (isNaN(Number(phone))) {
        return res.status(403).json({ message: "Phone must be numeric." });
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: { name, phone },
    });

    res.json({
      message: "Customer updated successfully.",
      customer: updatedCustomer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update customer." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  // const customerIndex = customers.findIndex((c) => c.id === Number(id));

  // if (customerIndex === -1) {
  //   return res.status(404).json({ message: 'Customer not found.' });
  // }

  // const hasBookings = bookings.some(
  //   (b) => b.customerId === Number(id) && b.status !== 'canceled'
  // );
  // if (hasBookings) {
  //   return res.status(400).json({
  //     message: 'Cannot delete customer with active or past bookings.',
  //   });
  // }

  // // Remove customer from the array
  // const deletedCustomer = customers.splice(customerIndex, 1)[0];

  // res.json({
  //   message: 'Customer deleted successfully.',
  //   customer: deletedCustomer,
  // });
  try {
    // Check active bookings before deleting
    const hasBookings = await prisma.booking.findFirst({
      where: {
        customerId: Number(id),
        status: { not: "canceled" },
      },
    });

    if (hasBookings) {
      return res.status(400).json({
        message: "Cannot delete customer with active bookings.",
      });
    }

    const deletedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: { isDeleted: true },
    });

    res.json({
      message: "Customer deleted successfully.",
      customer: deletedCustomer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete customer." });
  }
});

export default router;
