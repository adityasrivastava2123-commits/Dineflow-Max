export const tenantMiddleware = (req, res, next) => {
  const tenantId = req.headers["x-tenant-id"] || req.query.restaurant || "default";
  req.tenantId = tenantId;
  next();
};
