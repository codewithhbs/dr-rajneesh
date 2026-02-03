const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");

// ✅ Import your actual queue
const emailQueue = require('./queues/emailQueue');

const setupBullBoard = (app) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  // ✅ Pass valid BullAdapter instances
  createBullBoard({
    queues: [new BullAdapter(emailQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
};

module.exports = setupBullBoard;
