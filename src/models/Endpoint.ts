import { Request as ExpressRequest, Response as ExpressResponse } from "express";

import Response from "./Response";

interface EndpointConfig
{
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    callback: (request: ExpressRequest, response: Response) => Promise<void>;
}

interface AuthenticatedEndpointConfig<T>
{
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    callback: (request: ExpressRequest, response: Response, token: T) => Promise<void>;
    retrieveToken: (id: string) => Promise<T>;
}

export default class Endpoint
{
    public constructor(public config: EndpointConfig)
    {}

    public async run(req: ExpressRequest, res: ExpressResponse): Promise<void>
    {
        const response = Response.from(res);

        this.config.callback(req, response);
    }
}

export class AuthenticatedEndpoint<T>
{
    public constructor(public config: AuthenticatedEndpointConfig<T>)
    {}

    public async run(req: ExpressRequest, res: ExpressResponse): Promise<void>
    {
        const response = Response.from(res);

        const token = await this.config.retrieveToken(req.token ?? "");

        if (!token)
        {
            response.unauthorized();

            return;
        }

        /*
        TODO: Check token types

        if (!this.types.includes(token.type))
        {
            response.forbidden();

            return;
        }
        */

        this.config.callback(req, response, token);
    }
}