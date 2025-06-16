const Queue = require('bull');
const { sendEmail } = require('../utils/sendEmail');

const emailQueue = new Queue('emailQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  settings: {
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: 'exponential',
      delay: 36000,
    },
  },
});

emailQueue.process(async (job) => {
  try {
    const { type } = job.data;

    switch (type) {
      case 'register':
        await sendEmail({
          to: job.data.to,
          subject: job.data.subject,
          html: job.data.html
        });
        break;
      case 'welcome':
        await sendEmail({
          to: job.data.to,
          subject: job.data.subject,
          html: job.data.html
        });
        break;


      case 'test-failure':
        throw new Error('This is a test failure for job failure notification email.');

      default:
        console.warn(`Unknown email type: ${type}`);
        throw new Error(`Unknown email type: ${type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Job processing failed:', error);
    throw error;
  }
});

emailQueue.on('completed', (job, result) => {
  console.log(`✅ Job completed for userId: ${job.data.id || 'N/A'}`, result);
});

emailQueue.on('failed', async (job, err) => {
  console.error(`❌ Job failed for userId: ${job.data.userId || 'N/A'}`, err.message);
  await sendFailureNotificationEmail(job, err);
});

emailQueue.on('error', (err) => {
  console.error('Queue error:', err);
});

module.exports = emailQueue;


