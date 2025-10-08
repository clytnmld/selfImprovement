import express from "express";
import prisma from "../prisma";
import { Service } from "../models/service";
import { Booking } from "../models/booking";
import { assert } from "console";

const router = express.Router();

function isWithinShift(
  shiftRanges: string[],
  startTime: string,
  endTime: string
): boolean {
  return shiftRanges.some((shift) => {
    const [shiftStart, shiftEnd] = shift.split("-");
    return startTime >= shiftStart && endTime <= shiftEnd;
  });
}

router.get("/", async (req, res) => {
  // const result = bookings.map((booking) => {
  //   const customer = customers.find((c) => c.id === booking.customerId);
  //   const stylist = stylists.find((s) => s.id === booking.stylistId);
  //   const service = services.find((s) => s.id === booking.serviceId);

  //   return {
  //     ...booking,
  //     customer,
  //     stylist: stylist,
  //     service,
  //   };
  // });

  // res.json(result);
  try {
    const result = await prisma.booking.findMany({
      include: {
        customer: true,
        stylist: true,
        service: true,
      },
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

router.post("/", async (req, res) => {
  const { customerId, stylistId, serviceId, date, startTime, status } =
    req.body as Booking;

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

  function isValidDate(dateStr: string) {
    if (!dateRegex.test(dateStr)) return false;
    const [day, month, year] = dateStr.split("/").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  }

  if (!date || !customerId || !stylistId || !serviceId || !startTime) {
    return res.status(400).json({
      message: "Customer, stylist, service, date, and start time are required.",
    });
  }

  if (!isValidDate(date)) {
    return res
      .status(400)
      .json({ message: "Date must be valid and in DD/MM/YYYY format." });
  }

  if (!timeRegex.test(startTime)) {
    return res.status(400).json({
      message: "Start time must be in HH:MM 24-hour format (e.g. 09:00).",
    });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    const stylist = await prisma.stylist.findUnique({
      where: { id: stylistId },
      include: { services: true, shifts: true },
    });
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    // Check existence + soft delete
    if (!customer || customer.isDeleted)
      return res
        .status(400)
        .json({ message: "Cannot book a deleted or non-existent customer." });
    if (!stylist || stylist.isDeleted)
      return res
        .status(400)
        .json({ message: "Cannot book a deleted or non-existent stylist." });
    if (!service || service.isDeleted)
      return res
        .status(400)
        .json({ message: "Cannot book a deleted or non-existent service." });

    // Check if stylist offers the service
    const stylistServiceIds = stylist.services.map((s) => s.serviceId);
    if (!stylistServiceIds.includes(serviceId)) {
      return res.status(400).json({
        message: `Stylist "${stylist.name}" does not offer the selected service.`,
      });
    }

    // Calculate endTime
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + service.duration * 60000);
    const endTime = end.toTimeString().slice(0, 5);

    // Check shifts
    if (
      !isWithinShift(
        stylist.shifts.map((s) => `${s.startTime}-${s.endTime}`),
        startTime,
        endTime
      )
    ) {
      return res.status(400).json({
        message: `Booking time (${startTime}–${endTime}) is outside ${stylist.name}'s working shifts.`,
      });
    }

    // Check booking conflict
    const conflict = await prisma.booking.findFirst({
      where: {
        stylistId,
        status: "active",
        date,
        OR: [{ startTime: { lte: endTime }, endTime: { gte: startTime } }],
      },
    });

    if (conflict) {
      return res.status(409).json({
        message: "Stylist already has a booking during this time range.",
      });
    }

    // Create booking
    const newBooking = await prisma.booking.create({
      data: {
        customerId,
        stylistId,
        serviceId,
        date,
        startTime,
        endTime,
        status: status || "active",
      },
      include: {
        customer: true,
        stylist: { include: { services: true } },
        service: true,
      },
    });

    res.status(201).json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking." });
  }
});

router.put("/:id/cancel", async (req, res) => {
  const { id } = req.params;
  // const booking = bookings.find((b) => b.id === Number(id));
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
    });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "canceled")
      return res.status(400).json({ message: "Booking already canceled." });

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: "canceled" },
    });
    res.json({
      message: "Booking canceled successfully.",
      booking: updatedBooking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel booking." });
  }
});

export default router;
