exports.adminMiddleware = (req, res, next) => {
  if (req.user?.role !== "admin" || req.user?.email !== "venombar122@gmail.com") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};