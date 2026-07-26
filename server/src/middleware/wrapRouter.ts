import { Router, Request, Response, NextFunction } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export function wrapRouter(): Router {
  const router = Router();
  const methods = ["get", "post", "put", "patch", "delete"] as const;
  const original: any = {};

  methods.forEach((method) => {
    original[method] = router[method].bind(router);
    (router as any)[method] = (path: string, ...handlers: AsyncHandler[]) => {
      const wrapped = handlers.map((fn) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
      });
      return original[method](path, ...wrapped);
    };
  });

  return router;
}
