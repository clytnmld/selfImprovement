import express from 'express';
import { bookings } from '../data/booking';
import { customers } from '../data/customer';
import { stylists } from '../data/stylist';
import { services } from '../data/services';
import { Booking } from '../models/booking';

const router = express.Router();

function isWithinShift(
  shiftRanges: string[],
  startTime: string,
  endTime: string
): boolean {
  return shiftRanges.some((shift) => {
    const [shiftStart, shiftEnd] = shift.split('-');
    return startTime >= shiftStart && endTime <= shiftEnd;
  });
}

router.get('/', (req, res) => {
  const result = bookings.map((booking) => {
    const customer = customers.find((c) => c.id === booking.customerId);
    const stylist = stylists.find((s) => s.id === booking.stylistId);
    const service = services.find((s) => s.id === booking.serviceId);

    return {
      ...booking,
      customer,
      stylist: stylist
        ? {
            ...stylist,
            services: stylist.serviceIds.map((id) =>
              services.find((s) => s.id === id)
            ),
          }
        : null,
      service,
    };
  });

  res.json(result);
});

router.post('/', (req, res) => {
  const { customerId, stylistId, serviceId, startTime, status } =
    req.body as Booking;

  if (!customerId || !stylistId || !serviceId || !startTime) {
    return res.status(400).json({
      message: 'Customer, stylist, service, and start time are required.',
    });
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime)) {
    return res.status(400).json({
      message: 'Start time must be in HH:MM 24-hour format (e.g. 09:00).',
    });
  }

  const customer = customers.find((c) => c.id === customerId);
  const stylist = stylists.find((s) => s.id === stylistId);
  const service = services.find((sv) => sv.id === serviceId);

  if (!customer)
    return res.status(404).json({ message: 'Customer not found.' });
  if (!stylist) return res.status(404).json({ message: 'Stylist not found.' });
  if (!service) return res.status(404).json({ message: 'Service not found.' });

  if (!stylist.serviceIds.includes(serviceId)) {
    return res.status(400).json({
      message: `Stylist "${stylist.name}" does not offer the selected service.`,
    });
  }

  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(start.getTime() + service.duration * 60000);
  const endTime = end.toTimeString().slice(0, 5);

  if (!isWithinShift(stylist.shifts, startTime, endTime)) {
    return res.status(400).json({
      message: `Booking time (${startTime}–${endTime}) is outside ${stylist.name}'s working shifts.`,
    });
  }

  const conflict = bookings.find(
    (b) =>
      b.stylistId === stylistId &&
      b.status === 'active' && // ignore canceled bookings
      ((startTime >= b.startTime && startTime < b.endTime) ||
        (endTime > b.startTime && endTime <= b.endTime))
  );

  if (conflict) {
    return res.status(409).json({
      message: 'Stylist already has a booking during this time range.',
    });
  }

  const newBooking: Booking = {
    id: bookings.length + 1,
    customerId,
    stylistId,
    serviceId,
    startTime,
    endTime,
    status: status || 'active',
  };

  bookings.push(newBooking);
  const expandedBooking = {
    ...newBooking,
    customer: customers.find((c) => c.id === customerId),
    stylist: (() => {
      const stylistObj = stylists.find((s) => s.id === stylistId);
      if (!stylistObj) return null;
      return {
        ...stylistObj,
        services: stylistObj.serviceIds.map((id) =>
          services.find((s) => s.id === id)
        ),
      };
    })(),
    service: services.find((s) => s.id === serviceId),
  };

  res.status(201).json(expandedBooking);
});

router.put('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const booking = bookings.find((b) => b.id === Number(id));

  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (booking.status === 'canceled')
    return res.status(400).json({ message: 'Booking already canceled.' });

  booking.status = 'canceled';
  res.json({ message: 'Booking canceled successfully.', booking });
});

export default router;
