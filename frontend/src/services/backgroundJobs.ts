export type JobType = 'import' | 'recalculation' | 'scoring' | 'data_cleanup' | 'report_generation';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'paused';

export interface BackgroundJob {
  id: string;
  type: JobType;
  name: string;
  userId: string;
  tenantId: string;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  failedItems: number;
  result?: {
    summary: string;
    recordsCreated: number;
    recordsUpdated: number;
    recordsDeleted: number;
    duration: number; // milliseconds
  };
  error?: string;
  logsUrl?: string;
  estimatedTimeRemaining: number; // seconds
  retryCount: number;
  maxRetries: number;
}

export interface JobQueue {
  totalQueued: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
}

export interface JobLog {
  jobId: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

class BackgroundJobsService {
  private jobs: Map<string, BackgroundJob> = new Map();
  private jobLogs: Map<string, JobLog[]> = new Map();
  private queue: string[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Pre-load some completed jobs
    const mockJobs: BackgroundJob[] = [
      {
        id: 'job-1',
        type: 'import',
        name: 'Import Q1 Leads',
        userId: 'user-1',
        tenantId: 'tenant-1',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        progress: 100,
        totalItems: 500,
        processedItems: 500,
        failedItems: 12,
        result: {
          summary: 'Import completed successfully',
          recordsCreated: 450,
          recordsUpdated: 38,
          recordsDeleted: 0,
          duration: 24000,
        },
        retryCount: 0,
        maxRetries: 3,
        estimatedTimeRemaining: 0,
      },
      {
        id: 'job-2',
        type: 'scoring',
        name: 'Lead Score Recalculation',
        userId: 'user-1',
        tenantId: 'tenant-1',
        status: 'completed',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 23.9 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 23.8 * 60 * 60 * 1000),
        progress: 100,
        totalItems: 2500,
        processedItems: 2500,
        failedItems: 0,
        result: {
          summary: 'Scoring completed successfully',
          recordsCreated: 0,
          recordsUpdated: 2500,
          recordsDeleted: 0,
          duration: 7200000,
        },
        retryCount: 0,
        maxRetries: 3,
        estimatedTimeRemaining: 0,
      },
      {
        id: 'job-3',
        type: 'recalculation',
        name: 'Monthly Deal Value Recalculation',
        userId: 'user-2',
        tenantId: 'tenant-1',
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 2.98 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2.95 * 60 * 60 * 1000),
        progress: 100,
        totalItems: 1200,
        processedItems: 1200,
        failedItems: 2,
        result: {
          summary: 'Recalculation completed',
          recordsCreated: 0,
          recordsUpdated: 1198,
          recordsDeleted: 0,
          duration: 10800000,
        },
        retryCount: 1,
        maxRetries: 3,
        estimatedTimeRemaining: 0,
      },
      {
        id: 'job-4',
        type: 'data_cleanup',
        name: 'Duplicate Contact Cleanup',
        userId: 'user-1',
        tenantId: 'tenant-1',
        status: 'processing',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        startedAt: new Date(Date.now() - 4 * 60 * 1000),
        progress: 45,
        totalItems: 1500,
        processedItems: 675,
        failedItems: 3,
        estimatedTimeRemaining: 180,
        retryCount: 0,
        maxRetries: 3,
      },
    ];

    mockJobs.forEach(job => {
      this.jobs.set(job.id, job);
      this.jobLogs.set(job.id, this.generateMockLogs(job.id));
    });

    // Add some queued jobs
    this.queue = ['job-5', 'job-6'];
  }

  /**
   * Submit a job to the queue
   */
  submitJob(
    type: JobType,
    name: string,
    userId: string,
    tenantId: string,
    totalItems: number
  ): BackgroundJob {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: BackgroundJob = {
      id: jobId,
      type,
      name,
      userId,
      tenantId,
      status: 'queued',
      createdAt: new Date(),
      progress: 0,
      totalItems,
      processedItems: 0,
      failedItems: 0,
      retryCount: 0,
      maxRetries: 3,
      estimatedTimeRemaining: Math.ceil(totalItems / 10), // estimate ~10 items/sec
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    this.jobLogs.set(jobId, [{ jobId, timestamp: new Date(), level: 'info', message: 'Job queued' }]);

    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): BackgroundJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get jobs for a user
   */
  getUserJobs(userId: string): BackgroundJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get tenant jobs
   */
  getTenantJobs(tenantId: string): BackgroundJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get queue status
   */
  getQueueStatus(): JobQueue {
    const allJobs = Array.from(this.jobs.values());
    const today = new Date().toDateString();

    return {
      totalQueued: this.queue.length,
      activeJobs: allJobs.filter(j => j.status === 'processing').length,
      completedToday: allJobs.filter(
        j => j.status === 'completed' && j.completedAt?.toDateString() === today
      ).length,
      failedToday: allJobs.filter(
        j => j.status === 'failed' && j.completedAt?.toDateString() === today
      ).length,
    };
  }

  /**
   * Get job logs
   */
  getJobLogs(jobId: string): JobLog[] {
    return this.jobLogs.get(jobId) || [];
  }

  /**
   * Simulate job progress
   */
  async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();

    this.addLog(jobId, 'info', `Processing ${job.type} job with ${job.totalItems} items`);

    // Simulate processing
    while (job.processedItems < job.totalItems && job.status === 'processing') {
      const batchSize = Math.min(50, job.totalItems - job.processedItems);

      // Simulate 98% success rate
      const failedInBatch = Math.floor(batchSize * 0.02);
      job.processedItems += batchSize - failedInBatch;
      job.failedItems += failedInBatch;

      job.progress = Math.round((job.processedItems / job.totalItems) * 100);
      job.estimatedTimeRemaining = Math.max(0, job.estimatedTimeRemaining - 5);

      if (job.progress % 20 === 0) {
        this.addLog(job.id, 'info', `Processing: ${job.progress}% complete (${job.processedItems}/${job.totalItems})`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (job.status === 'processing') {
      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      job.result = {
        summary: `${job.type} completed successfully`,
        recordsCreated: Math.floor(job.processedItems * 0.3),
        recordsUpdated: Math.floor(job.processedItems * 0.65),
        recordsDeleted: Math.floor(job.processedItems * 0.05),
        duration: (job.completedAt.getTime() - (job.startedAt?.getTime() || 0)),
      };

      this.addLog(jobId, 'info', `Job completed successfully. ${job.failedItems} items failed.`);
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();
    this.addLog(jobId, 'info', 'Job cancelled by user');
    return true;
  }

  /**
   * Pause a job
   */
  pauseJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'processing') {
      return false;
    }

    job.status = 'paused';
    this.addLog(jobId, 'info', 'Job paused');
    return true;
  }

  /**
   * Resume a paused job
   */
  async resumeJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') {
      return false;
    }

    this.addLog(jobId, 'info', 'Job resumed');
    await this.processJob(jobId);
    return true;
  }

  /**
   * Add log entry
   */
  private addLog(jobId: string, level: JobLog['level'], message: string): void {
    if (!this.jobLogs.has(jobId)) {
      this.jobLogs.set(jobId, []);
    }

    this.jobLogs.get(jobId)!.push({
      jobId,
      timestamp: new Date(),
      level,
      message,
    });
  }

  /**
   * Generate mock logs for a job
   */
  private generateMockLogs(jobId: string): JobLog[] {
    const messages = [
      'Job queued for processing',
      'Starting job execution',
      'Processing batch 1/10',
      'Processing batch 2/10',
      'Processing batch 5/10',
      'Processing batch 10/10',
      'Validating results',
      'Job completed successfully',
    ];

    return messages.map((msg, idx) => ({
      jobId,
      timestamp: new Date(Date.now() - (messages.length - idx) * 1000),
      level: msg.includes('error') ? 'error' : 'info',
      message: msg,
    }));
  }

  /**
   * Get job statistics by type
   */
  getJobStats(tenantId: string) {
    const jobs = this.getTenantJobs(tenantId);

    return {
      byType: {
        import: jobs.filter(j => j.type === 'import').length,
        recalculation: jobs.filter(j => j.type === 'recalculation').length,
        scoring: jobs.filter(j => j.type === 'scoring').length,
        data_cleanup: jobs.filter(j => j.type === 'data_cleanup').length,
        report_generation: jobs.filter(j => j.type === 'report_generation').length,
      },
      byStatus: {
        completed: jobs.filter(j => j.status === 'completed').length,
        processing: jobs.filter(j => j.status === 'processing').length,
        queued: jobs.filter(j => j.status === 'queued').length,
        failed: jobs.filter(j => j.status === 'failed').length,
        paused: jobs.filter(j => j.status === 'paused').length,
      },
      totalProcessedItems: jobs.reduce((sum, j) => sum + j.processedItems, 0),
      totalFailedItems: jobs.reduce((sum, j) => sum + j.failedItems, 0),
    };
  }
}

export const backgroundJobsService = new BackgroundJobsService();
