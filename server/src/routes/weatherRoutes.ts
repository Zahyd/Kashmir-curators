import { Router } from 'express';
import { getWeatherAlerts } from '../controllers/weatherController';

const router = Router();

router.get('/alerts', getWeatherAlerts);

export default router;
