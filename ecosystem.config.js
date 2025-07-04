module.exports = {
  apps: [
    {
      name: "next-app-rkm",
      script: "npm",
      args: "start",
      cwd: "/root/dr.rkm/client", // ✅ Correct absolute path
      instances: "1", 
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3900
      }
    }
  ]
};

