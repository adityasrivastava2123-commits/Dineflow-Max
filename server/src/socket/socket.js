import logger from "../utils/logger.js";

export const socketHandler = (io) => {
  const restaurantNamespaces = {};

  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on("join-restaurant", (restaurantId, userId) => {
      socket.join(`restaurant-${restaurantId}`);
      socket.join(`user-${userId}`);
      logger.info(`User ${userId} joined restaurant ${restaurantId}`);

      io.to(`restaurant-${restaurantId}`).emit("user-joined", {
        userId,
        socketId: socket.id,
        timestamp: new Date(),
      });
    });

    socket.on("join-kitchen", (restaurantId) => {
      socket.join(`kitchen-${restaurantId}`);
      logger.info(`Kitchen staff joined: ${restaurantId}`);
    });

    socket.on("table-status", (restaurantId, tableNumber, status) => {
      io.to(`restaurant-${restaurantId}`).emit("table-updated", {
        tableNumber,
        status,
        timestamp: new Date(),
      });
    });

    socket.on("order-placed", (restaurantId, orderData) => {
      io.to(`kitchen-${restaurantId}`).emit("new-order", orderData);
      io.to(`user-${orderData.customerId}`).emit("order-confirmed", {
        orderId: orderData._id,
        status: "pending",
      });
    });

    socket.on("order-status-change", (restaurantId, orderId, status) => {
      io.to(`restaurant-${restaurantId}`).emit("order-status-updated", {
        orderId,
        status,
        timestamp: new Date(),
      });
    });

    socket.on("call-waiter", (restaurantId, tableNumber) => {
      io.to(`restaurant-${restaurantId}`).emit("waiter-call", {
        tableNumber,
        timestamp: new Date(),
      });
      logger.info(`Waiter called for table ${tableNumber} in restaurant ${restaurantId}`);
    });

    socket.on("request-bill", (restaurantId, tableNumber, orderId) => {
      io.to(`restaurant-${restaurantId}`).emit("bill-request", {
        tableNumber,
        orderId,
        timestamp: new Date(),
      });
    });

    socket.on("table-occupied", (restaurantId, tableNumber, customerId) => {
      io.to(`restaurant-${restaurantId}`).emit("table-status", {
        tableNumber,
        status: "occupied",
        customerId,
      });
    });

    socket.on("table-vacant", (restaurantId, tableNumber) => {
      io.to(`restaurant-${restaurantId}`).emit("table-status", {
        tableNumber,
        status: "vacant",
      });
    });

    socket.on("typing", (restaurantId, userId, isTyping) => {
      io.to(`restaurant-${restaurantId}`).emit("user-typing", {
        userId,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`);
      io.emit("user-disconnected", {
        socketId: socket.id,
        timestamp: new Date(),
      });
    });

    socket.on("error", (error) => {
      logger.error(`Socket error: ${error}`);
    });
  });
};
