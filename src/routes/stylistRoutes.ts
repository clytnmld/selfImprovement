import express from "express";
import { stylists } from "../data/stylist";
import { services } from "../data/services";
import { Stylist } from "../models/stylist";
import { bookings } from "../data/booking";
import prisma from "../prisma";

const router = express.Router();

function hasOverlappingShifts(shifts: string[]): boolean {
  const parseShift = (shift: string) => {
    const [start, end] = shift.split("-");
    return { start, end };
  };

  for (let i = 0; i < shifts.length; i++) {
    const { start: startA, end: endA } = parseShift(shifts[i]);
    for (let j = i + 1; j < shifts.length; j++) {
      const { start: startB, end: endB } = parseShift(shifts[j]);
      if (startA < endB && startB < endA) {
        return true;
      }
    }
  }
  return false;
}

router.get("/", async (req, res) => {
  // const result = stylists.map((stylist) => ({
  //   ...stylist,
  //   services: stylist.serviceIds.map((id) => services.find((s) => s.id === id)),
  // }));
  // res.json(result);
  try {
    const result = await prisma.stylist.findMany({
      include: { services: { include: { service: true } }, shifts: true },
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stylists." });
  }
});

router.post("/", async (req, res) => {
  const { name, description, serviceIds, shifts } = req.body as Stylist;
  const shiftRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

  if (!name || !serviceIds || !shifts) {
    return res
      .status(400)
      .json({ message: "Name, serviceIds, and shifts are required." });
  }

  // Validate shift format
  const invalidShift = shifts.find((shift) => !shiftRegex.test(shift));
  if (invalidShift) {
    return res.status(400).json({
      message: `Invalid shift format "${invalidShift}". Use HH:MM-HH:MM (e.g. 09:00-17:00).`,
    });
  }

  // Validate overlapping shifts
  if (hasOverlappingShifts(shifts)) {
    return res.status(400).json({
      message: "Shifts cannot overlap. Please provide non-overlapping shifts.",
    });
  }

  try {
    // Fetch all services that match the provided IDs
    const existingServices = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, isDeleted: true },
    });

    const existingIds = existingServices.map((s) => s.id);
    const deletedIds = existingServices
      .filter((s) => s.isDeleted)
      .map((s) => s.id);

    // Check for non-existent service IDs
    const invalidIds = serviceIds.filter((id) => !existingIds.includes(id));
    if (invalidIds.length > 0) {
      return res
        .status(404)
        .json({ message: `Invalid service IDs: ${invalidIds.join(", ")}` });
    }

    // Check for deleted service IDs
    if (deletedIds.length > 0) {
      return res.status(400).json({
        message: `Cannot assign deleted services: ${deletedIds.join(", ")}`,
      });
    }

    // Create the stylist
    const newStylist = await prisma.stylist.create({
      data: {
        name,
        description,
        services: {
          create: serviceIds.map((serviceId) => ({
            service: { connect: { id: serviceId } },
          })),
        },
        shifts: {
          create: shifts.map((shiftStr) => {
            const [startTime, endTime] = shiftStr.split("-");
            return { startTime, endTime };
          }),
        },
      },
      include: {
        services: { include: { service: true } },
        shifts: true,
      },
    });

    res.status(201).json(newStylist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create stylist." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, serviceIds, shifts } = req.body as Stylist;
  // const stylist = stylists.find((s) => s.id === Number(id));
  const shiftRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
  try {
    const stylist = await prisma.stylist.findUnique({
      where: { id: Number(id) },
      include: { services: true, shifts: true },
    });
    if (!stylist) {
      return res.status(404).json({ message: "Stylist not found." });
    }
    if (shifts) {
      const invalidShift = shifts.find((shift) => !shiftRegex.test(shift));
      if (invalidShift) {
        return res.status(400).json({
          message: `Invalid shift format "${invalidShift}". Use HH:MM-HH:MM.`,
        });
      }
      if (hasOverlappingShifts(shifts)) {
        return res.status(400).json({
          message:
            "Shifts cannot overlap. Please provide non-overlapping shifts.",
        });
      }
    }
    if (serviceIds) {
      const existingIds = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true },
      });
      if (existingIds.length !== serviceIds.length) {
        const validIds = existingIds.map((s) => s.id);
        const invalidIds = serviceIds.filter((id) => !validIds.includes(id));
        return res
          .status(404)
          .json({ message: `Invalid service IDs: ${invalidIds.join(", ")}` });
      }
    }
    // if (name !== undefined && name.trim() === '') {
    //   return res.status(400).json({ message: 'Name cannot be empty.' });
    // }
    // if (name) stylist.name = name;
    // if (description) stylist.description = description;
    // res.json({ message: 'Stylist updated successfully.', stylist });
    const updatedStylist = await prisma.stylist.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        // update services: remove old connections, connect new
        services: serviceIds
          ? {
              deleteMany: {}, // remove all existing relations
              create: serviceIds.map((serviceId) => ({
                service: { connect: { id: serviceId } },
              })),
            }
          : undefined,
        // update shifts: delete old shifts, create new ones
        shifts: shifts
          ? {
              deleteMany: {},
              create: shifts.map((shiftStr) => {
                const [startTime, endTime] = shiftStr.split("-");
                return { startTime, endTime };
              }),
            }
          : undefined,
      },
      include: {
        services: { include: { service: true } },
        shifts: true,
      },
    });

    res.json({
      message: "Stylist updated successfully.",
      stylist: updatedStylist,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update stylist." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if stylist exists
    const stylist = await prisma.stylist.findUnique({
      where: { id: Number(id) },
    });

    if (!stylist) {
      return res.status(404).json({ message: "Stylist not found." });
    }

    // Check if stylist has active bookings
    const hasBookings = await prisma.booking.findFirst({
      where: { stylistId: Number(id), status: { not: "canceled" } },
    });

    if (hasBookings) {
      return res.status(400).json({
        message:
          "Cannot delete stylist with active bookings. Please cancel associated bookings first.",
      });
    }

    // Soft delete: update isDeleted to true
    const deletedStylist = await prisma.stylist.update({
      where: { id: Number(id) },
      data: { isDeleted: true },
    });

    res.json({
      message: "Stylist deleted successfully (soft delete).",
      stylist: deletedStylist,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete stylist." });
  }
});

export default router;
