import express, { Request as ExpressRequest, Response as ExpressResponse } from "express";
import cors from "cors";
import helmet from "helmet";
import bearerToken from "express-bearer-token";
import { Endpoint, AuthenticatedEndpoint } from "./models/Endpoint";

interface ApiConfig
{
    /**
     * @default 3000
     */
    port?: number;
    endpoints: (Endpoint<any> | AuthenticatedEndpoint<any, any>)[];
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

            const handler = async (req: ExpressRequest, res: ExpressResponse) =>
            {
                await endpoint.run(req, res);
            }

            switch (method)
            {
                case "DELETE":
                {
                    this.app.delete(url, handler);

                    break;
                }
                case "GET":
                {
                    this.app.get(url, handler);

                    break;
                }
                case "POST":
                {
                    this.app.post(url, handler);

                    break;
                }
                case "PUT":
                {
                    this.app.put(url, handler);

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
export * from "./models/Endpoint";
export * from "./common/ISerializable";