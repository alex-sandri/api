import express from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import dotenv from "dotenv";
import Response from "./utilities/Response";

dotenv.config();

// TODO: Add Auth

interface ApiConfig
{
    port?: number;
    endpoints: Endpoint[];
}

interface Endpoint
{
    url: string;
    method: "DELETE" | "GET" | "POST" | "PUT";
    callback: (request: any, response: Response) => Promise<void>;
}

export default class Api
{
    private app: express.Express;

    public constructor(private config: ApiConfig)
    {
        this.app = express();

        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(bearerToken());

        this.app.use(express.json());

        config.endpoints.forEach(endpoint =>
        {
            switch (endpoint.method)
            {
                case "DELETE":
                {
                    this.app.delete(endpoint.url, (req, res) =>
                    {
                        endpoint.callback(req, Response.from(res));
                    });

                    break;
                }
                case "GET":
                {
                    this.app.get(endpoint.url, (req, res) =>
                    {
                        endpoint.callback(req, Response.from(res));
                    });

                    break;
                }
                case "POST":
                {
                    this.app.post(endpoint.url, (req, res) =>
                    {
                        endpoint.callback(req, Response.from(res));
                    });

                    break;
                }
                case "PUT":
                {
                    this.app.put(endpoint.url, (req, res) =>
                    {
                        endpoint.callback(req, Response.from(res));
                    });

                    break;
                }
            }
        });
    }

    public listen(): void
    {
        this.app.listen(this.config.port ?? 3000);
    }
}