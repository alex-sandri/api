import { Request as ExpressRequest, Response as ExpressResponse } from "express";

import { ISerializable } from "../common/ISerializable";
import { Response } from "./Response";

interface EndpointConfig<T extends ISerializable>
{
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    callback: (request: ExpressRequest, response: Response) => Promise<T | T[] | null>;
}

interface AuthenticatedEndpointConfig<T extends ISerializable, Token>
{
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    callback: (request: ExpressRequest, response: Response, token: Token) => Promise<T | T[] | null>;
    retrieveToken: (id: string) => Promise<Token | null>;
}

export class Endpoint<T extends ISerializable>
{
    public constructor(public config: EndpointConfig<T>)
    {}

    public async run(req: ExpressRequest, res: ExpressResponse): Promise<void>
    {
        const response = Response.from(res);

        this.config
            .callback(req, response)
            .then(async data =>
            {
                if (data)
                {
                    if (Array.isArray(data))
                    {
                        const responseData: any[] = [];

                        for (const element of data)
                        {
                            responseData.push(await element.serialize());
                        }

                        response.body.data = responseData;
                    }
                    else
                    {
                        response.body.data = await data.serialize();
                    }
                }

                response.send();
            })
            .catch(error =>
            {
                if (error instanceof Error)
                {
                    // TODO: Create ApiError class to replace the generic Error
                    // TODO: id must be in the format aaa/bbb/ccc, example: user/password/wrong
                    response.body.errors = [ { id: "error", message: error.message } ];
                }

                response.send();
            });
    }
}

export class AuthenticatedEndpoint<T extends ISerializable, Token>
{
    public constructor(public config: AuthenticatedEndpointConfig<T, Token>)
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

        this.config
            .callback(req, response, token)
            .then(async data =>
            {
                if (data)
                {
                    if (Array.isArray(data))
                    {
                        const responseData: any[] = [];

                        for (const element of data)
                        {
                            responseData.push(await element.serialize());
                        }

                        response.body.data = responseData;
                    }
                    else
                    {
                        response.body.data = await data.serialize();
                    }
                }

                response.send();
            })
            .catch(error =>
            {
                if (error instanceof Error)
                {
                    // TODO: Create ApiError class to replace the generic Error
                    // TODO: id must be in the format aaa/bbb/ccc, example: user/password/wrong
                    response.body.errors = [ { id: "error", message: error.message } ];
                }

                response.send();
            });
    }
}