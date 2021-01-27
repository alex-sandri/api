import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import Joi from "joi";

import { ISerializable } from "../common/ISerializable";
import { ApiError } from "./ApiError";
import { Response } from "./Response";

interface Context<T>
{
    params: any,
    body: any,
    token: T,
}

interface Config<T extends ISerializable, Token>
{
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    schema?: Joi.Schema,
    callback: (response: Response, context: Context<Token>) => Promise<T | T[] | void>;
    retrieveToken: (id: string) => Promise<Token | null>;
}

export class Endpoint<T extends ISerializable, Token>
{
    public constructor(public config: Config<T, Token>)
    {}

    public async run(req: ExpressRequest, res: ExpressResponse): Promise<void>
    {
        const response = Response.from(res);

        if (this.config.schema)
        {
            const result = this.config.schema.validate(req.body, { abortEarly: false });

            if (result.error)
            {
                response.body.errors = result.error.details.map(error => ({ id: error.path.join("."), message: error.message }));

                response.send();

                return;
            }
        }

        const token = await this.config.retrieveToken(req.token ?? "");

        if (token === null)
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

        const context: Context<Token> = {
            params: req.params,
            body: req.body,
            token,
        };

        this.config
            .callback(response, context)
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

export class UnauthenticatedEndpoint<T extends ISerializable> extends Endpoint<T, undefined>
{
    constructor(config: {
        method: "DELETE" | "GET" | "POST" | "PUT";
        url: string;
        schema?: Joi.Schema,
        callback: (response: Response, context: Context<undefined>) => Promise<T | T[] | void>;
    })
    {
        super({ ...config, retrieveToken: async () => undefined });
    }
}