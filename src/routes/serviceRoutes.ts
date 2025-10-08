import express from "express";
import prisma from "../prisma";
import { services } from "../data/services";
import { Service } from "../models/service";
import { bookings } from "../data/booking";

const router = express.Router();

router.get("/", async (req, res) => {
  // res.json(services);
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch services." });
  }
});

router.post("/", async (req, res) => {
  const { name, duration } = req.body as Service;
  const parsedDuration = Number(duration);
  if (!name || !duration) {
    return res.status(400).json({ message: "Name and duration are required." });
  }
  if (isNaN(parsedDuration)) {
    return res.status(403).json({ message: "Duration must be a number" });
  }
  // const newService: Service = {
  //   id: services.length + 1,
  //   name,
  //   duration: parsedDuration,
  // };

  // services.push(newService);
  // res.status(201).json(newService);

  try {
    const newService = await prisma.service.create({
      data: { name, duration: parsedDuration },
    });
    res.status(201).json(newService);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create service." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, duration } = req.body as Service;
  // const service = services.find((s) => s.id === Number(id));
  // if (!service) {
  //   return res.status(404).json({ message: 'Service not found.' });
  // }
  // if (name !== undefined && name.trim() === '') {
  //   return res.status(400).json({ message: 'Name cannot be empty.' });
  // }
  // if (duration !== undefined) {
  //   const parsedDuration = Number(duration);
  //   if (isNaN(parsedDuration)) {
  //     return res.status(403).json({ message: 'Duration must be a number.' });
  //   } else if (parsedDuration <= 0) {
  //     return res
  //       .status(400)
  //       .json({ message: 'Duration must be a positive number.' });
  //   }
  //   service.duration = parsedDuration;
  // }
  try {
    const existing = await prisma.service.findUnique({
      where: { id: Number(id) },
    });
    let parsedDuration;
    if (!existing) {
      return res.status(404).json({ message: "Service not found." });
    }
    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Name cannot be empty." });
    }
    if (duration !== undefined) {
      parsedDuration = Number(duration);
      if (isNaN(parsedDuration)) {
        return res.status(403).json({ message: "Duration must be a number." });
      } else if (parsedDuration <= 0) {
        return res
          .status(400)
          .json({ message: "Duration must be a positive number." });
      }
    }
    const updateService = await prisma.service.update({
      where: { id: Number(id) },
      data: { name: name, duration: parsedDuration },
    });
    res.json({
      message: "Service updated successfully.",
      service: updateService,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update service." });
  }

  // res.json({ message: 'Service updated successfully.', service });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  // const index = services.findIndex((s) => s.id === Number(id));
  // if (index === -1) {
  //   return res.status(404).json({ message: 'Service not found.' });
  // }
  // const hasBookings = bookings.some(
  //   (b) => b.serviceId === Number(id) && b.status !== 'canceled'
  // );
  // if (hasBookings) {
  //   return res
  //     .status(400)
  //     .json({ message: 'Cannot delete service with active bookings.' });
  // }
  // services.splice(index, 1);
  // res.json({ message: 'Service deleted successfully.' });
  try {
    const existing = await prisma.service.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "Service not found." });
    }
    const hasBookings = await prisma.booking.findFirst({
      where: { serviceId: Number(id), status: { not: "canceled" } },
    });
    if (hasBookings) {
      return res
        .status(400)
        .json({ message: "Cannot delete service with active bookings." });
    }
    const deletedService = await prisma.service.update({
      where: { id: Number(id) },
      data: { isDeleted: true },
    });

    res.json({
      message: "Service deleted successfully (soft delete).",
      service: deletedService,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete service." });
  }
});

export default router;
