import express from 'express';
import { services } from '../data/services';
import { Service } from '../models/service';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(services);
});

router.post('/', (req, res) => {
  const { name, duration } = req.body as Service;
  const parsedDuration = Number(duration);
  if (!name || !duration) {
    return res.status(400).json({ message: 'Name and duration are required.' });
  }
  if (isNaN(parsedDuration)) {
    return res.status(403).json({ message: 'Duration must be a number' });
  }
  const newService: Service = {
    id: services.length + 1,
    name,
    duration: parsedDuration,
  };

  services.push(newService);
  res.status(201).json(newService);
});

export default router;
