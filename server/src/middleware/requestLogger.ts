import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now();
  _res.on("finish", () => {
    const ms = Date.now() - start;
    if (req.path.startsWith("/api/")) {
      console.log(`  ${req.method} ${req.path} ${_res.statusCode} ${ms}ms`);
    }
  });
  next();
}
