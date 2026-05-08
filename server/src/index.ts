import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import packageRoutes from './routes/packageRoutes';
import hotelRoutes from './routes/hotelRoutes';
import cabRoutes from './routes/cabRoutes';
import testimonialRoutes from './routes/testimonialRoutes';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import faqRoutes from './routes/faqRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/packages', packageRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/cabs', cabRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/faqs', faqRoutes);

app.get('/', (req, res) => {
  res.send('Kashmir Curators API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
