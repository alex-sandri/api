import express, { Request as ExpressRequest, Response as ExpressResponse } from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import dotenv from "dotenv";
import Response from "./models/Response";
import Endpoint, { AuthenticatedEndpoint } from "./models/Endpoint";

dotenv.config();

interface ApiConfig
{
    /**
     * @default 3000
     */
    port?: number;
    endpoints: (Endpoint | AuthenticatedEndpoint<any>)[];
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

        config.endpoints.forEach(async endpoint =>
        {
            const method = endpoint.config.method;
            const url = endpoint.config.url;

            switch (method)
            {
                case "DELETE":
                {
                    this.app.delete(url, endpoint.run);

                    break;
                }
                case "GET":
                {
                    this.app.get(url, endpoint.run);

                    break;
                }
                case "POST":
                {
                    this.app.post(url, endpoint.run);

                    break;
                }
                case "PUT":
                {
                    this.app.put(url, endpoint.run);

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

export * from "./models/Response";