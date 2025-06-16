const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");


const setupBullBoard = (app) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [
      new BullAdapter()
     
    ],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
};

module.exports = setupBullBoard;
