import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
	neon
} from '@neondatabase/serverless';
dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(cors());
app.use(express.json());
const sql = neon(process.env.DATABASE_URL);
app.get('/api/ping', (req, res) => {
	res.json({
		message: 'pong'
	});
});
app.listen(port, () => {
	console.log(`Backend server is running on http://localhost:${port}`);
});
