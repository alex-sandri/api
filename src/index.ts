import express from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(bearerToken());

app.use(express.json());



app.listen(3000);