import express, { Request as ExpressRequest, Response as ExpressResponse } from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import dotenv from "dotenv";
import Response from "./models/Response";

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
    callback: (request: ExpressRequest, response: Response) => Promise<void>;

    checkAuth?: (token: string, response: Response) => Promise<boolean>;
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
            const handler = async (req: ExpressRequest, res: ExpressResponse) =>
            {
                const response = Response.from(res);

                if (endpoint.checkAuth)
                {
                    const allow = await endpoint.checkAuth(req.token ?? "", response);

                    if (!allow)
                    {
                        return;
                    }
                }

                endpoint.callback(req, response);
            }

            switch (endpoint.method)
            {
                case "DELETE":
                {
                    this.app.delete(endpoint.url, handler);

                    break;
                }
                case "GET":
                {
                    this.app.get(endpoint.url, handler);

                    break;
                }
                case "POST":
                {
                    this.app.post(endpoint.url, handler);

                    break;
                }
                case "PUT":
                {
                    this.app.put(endpoint.url, handler);

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