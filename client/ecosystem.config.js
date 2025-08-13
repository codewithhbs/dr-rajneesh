module.exports = {
  apps: [
    {
      name: "dr-rajneesh",
      script: "npm",
      args: "start",
      cwd: "/root/dr-rajneesh/client",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
