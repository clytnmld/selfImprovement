import express from 'express';
import serviceRoutes from './routes/serviceRoutes';
import stylistRoutes from './routes/stylistRoutes';
import customerRoutes from './routes/customerRoutes';
import bookingRoutes from './routes/bookingRoutes';

const app = express();
const port = 3000;

// middleware to parse JSON request body
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.send('Salon Booking API is running 💇‍♀️');
});
app.use('/services', serviceRoutes);
app.use('/stylists', stylistRoutes);
app.use('/customer', customerRoutes);
app.use('/booking', bookingRoutes);
// start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
