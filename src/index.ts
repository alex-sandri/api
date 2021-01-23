import express from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import dotenv from "dotenv";

dotenv.config();

interface ApiConfig
{
    port?: number;
    endpoints: Endpoint[];
}

interface Endpoint
{
    url: string;
    method: "DELETE" | "GET" | "POST" | "PUT";
    callback: (body: any) => Promise<void>;
}

export default class Api
{
    public constructor(config: ApiConfig)
    {
        const app = express();

        app.use(cors());
        app.use(helmet());
        app.use(bearerToken());

        app.use(express.json());

        config.endpoints.forEach(endpoint =>
        {
            switch (endpoint.method)
            {
                case "DELETE":
                {
                    app.delete(endpoint.url, endpoint.callback);

                    break;
                }
                case "GET":
                {
                    app.get(endpoint.url, endpoint.callback);

                    break;
                }
                case "POST":
                {
                    app.post(endpoint.url, endpoint.callback);

                    break;
                }
                case "PUT":
                {
                    app.put(endpoint.url, endpoint.callback);

                    break;
                }
            }
        });

        app.listen(config.port ?? 3000);
    }
}