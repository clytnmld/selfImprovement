import express from 'express';
import { stylists } from '../data/stylist';
import { services } from '../data/services';
import { Stylist } from '../models/stylist';

const router = express.Router();

function hasOverlappingShifts(shifts: string[]): boolean {
  const parseShift = (shift: string) => {
    const [start, end] = shift.split('-');
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

router.get('/', (req, res) => {
  const result = stylists.map((stylist) => ({
    ...stylist,
    services: stylist.serviceIds.map((id) => services.find((s) => s.id === id)),
  }));
  res.json(result);
});

router.post('/', (req, res) => {
  const { name, description, serviceIds, shifts } = req.body as Stylist;
  const shiftRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

  if (!name || !serviceIds || !shifts) {
    return res
      .status(400)
      .json({ message: 'Name, serviceIds, and shifts are required.' });
  }

  const invalidShift = shifts.find((shift) => !shiftRegex.test(shift));
  if (invalidShift) {
    return res.status(400).json({
      message: `Invalid shift format "${invalidShift}". Use HH:MM-HH:MM (e.g. 09:00-17:00).`,
    });
  }

  if (hasOverlappingShifts(shifts)) {
    return res.status(400).json({
      message: 'Shifts cannot overlap. Please provide non-overlapping shifts.',
    });
  }

  const invalidIds = serviceIds.filter(
    (id) => !services.some((s) => s.id === id)
  );
  if (invalidIds.length > 0) {
    return res
      .status(404)
      .json({ message: `Invalid service IDs: ${invalidIds.join(', ')}` });
  }

  const newStylist: Stylist = {
    id: stylists.length + 1,
    name,
    description,
    serviceIds,
    shifts,
  };

  stylists.push(newStylist);
  res.status(201).json(newStylist);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, serviceIds, shifts } = req.body as Stylist;
  const stylist = stylists.find((s) => s.id === Number(id));
  if (!stylist) {
    return res.status(404).json({ message: 'Stylist not found.' });
  }
  const shiftRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
  if (shifts) {
    const invalidShift = shifts.find((shift) => !shiftRegex.test(shift));
    if (invalidShift) {
      return res.status(400).json({
        message: `Invalid shift format "${invalidShift}". Use HH:MM-HH:MM (e.g. 09:00-17:00).`,
      });
    }
    if (hasOverlappingShifts(shifts)) {
      return res.status(400).json({
        message:
          'Shifts cannot overlap. Please provide non-overlapping shifts.',
      });
    }
    stylist.shifts = shifts;
  }
  if (serviceIds) {
    const invalidIds = serviceIds.filter(
      (id) => !services.some((s) => s.id === id)
    );
    if (invalidIds.length > 0) {
      return res
        .status(404)
        .json({ message: `Invalid service IDs: ${invalidIds.join(', ')}` });
    }
    stylist.serviceIds = serviceIds;
  }
  if (name !== undefined && name.trim() === '') {
    return res.status(400).json({ message: 'Name cannot be empty.' });
  }
  if (name) stylist.name = name;
  if (description) stylist.description = description;
  res.json({ message: 'Stylist updated successfully.', stylist });
});

export default router;
