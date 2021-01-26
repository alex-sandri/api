import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import Joi from "joi";

import { ISerializable } from "../common/ISerializable";
import { ApiError } from "./ApiError";
import { Response } from "./Response";

interface BasicEndpointConfig
{
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    schema?: Joi.Schema,
}

interface EndpointConfig<T extends ISerializable> extends BasicEndpointConfig
{
    callback: (request: ExpressRequest, response: Response) => Promise<T | T[] | null>;
}

interface AuthenticatedEndpointConfig<T extends ISerializable, Token> extends BasicEndpointConfig
{
    callback: (request: ExpressRequest, response: Response, token: Token) => Promise<T | T[] | null>;
    retrieveToken: (id: string) => Promise<Token | null>;
}

// TODO: Put duplicated code only in one place
export class Endpoint<T extends ISerializable>
{
    public constructor(public config: EndpointConfig<T>)
    {}

    public async run(req: ExpressRequest, res: ExpressResponse): Promise<void>
    {
        const response = Response.from(res);

        if (this.config.schema)
        {
            const result = this.config.schema.validate(req.body);

            if (result.errors)
            {
                response.body.errors = result.errors.details.map(error => ({ id: error.path.join("."), message: error.message }));

                response.send();

                return;
            }
        }

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
                if (error instanceof ApiError)
                {
                    response.body.errors = [ error ];
                }
                else if (error instanceof Error)
                {
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

        if (this.config.schema)
        {
            const result = this.config.schema.validate(req.body);

            if (result.errors)
            {
                response.body.errors = result.errors.details.map(error => ({ id: error.path.join("."), message: error.message }));

                response.send();

                return;
            }
        }

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
                if (error instanceof ApiError)
                {
                    response.body.errors = [ error ];
                }
                else if (error instanceof Error)
                {
                    response.body.errors = [ { id: "error", message: error.message } ];
                }

                response.send();
            });
    }
}