import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  pending: [JobStatus.running],
  running: [JobStatus.completed, JobStatus.failed],
  completed: [],
  failed: [],
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        title: dto.title.trim(),
        type: dto.type.trim(),
      },
    });
  }

  findAll(status?: string) {
    const where: Prisma.JobWhereInput = {};

    if (status && Object.values(JobStatus).includes(status as JobStatus)) {
      where.status = status as JobStatus;
    }

    return this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, newStatus: JobStatus) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!allowedTransitions[job.status].includes(newStatus)) {
      throw new ConflictException(
        `Invalid transition: ${job.status} -> ${newStatus}`,
      );
    }

    const result = await this.prisma.job.updateMany({
      where: {
        id,
        status: job.status,
      },
      data: {
        status: newStatus,
      },
    });

    if (result.count !== 1) {
      throw new ConflictException(
        'The job was changed by another request. Please refresh and try again.',
      );
    }

    return this.prisma.job.findUnique({ where: { id } });
  }

  async remove(id: string) {
    const result = await this.prisma.job.deleteMany({
      where: { id },
    });

    if (result.count !== 1) {
      throw new NotFoundException('Job not found');
    }

    return { message: 'Job deleted successfully' };
  }
}
