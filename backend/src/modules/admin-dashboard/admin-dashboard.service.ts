import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: bigint) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        profile: { select: { id: true } },
        _count: { select: { educations: true, certificates: true, experiences: true, skills: true, projects: true, interests: true, mediaAssets: true } },
      },
    });
    if (!portfolio) throw new NotFoundException('Portfolio for this account was not found.');

    const portfolioId = portfolio.id;
    const [educationsVisible, certificatesVisible, experiencesVisible, skillsVisible, projectsVisible, interestsVisible] = await Promise.all([
      this.prisma.education.count({ where: { portfolioId, isVisible: true } }),
      this.prisma.certificate.count({ where: { portfolioId, isVisible: true } }),
      this.prisma.experience.count({ where: { portfolioId, isVisible: true } }),
      this.prisma.skill.count({ where: { portfolioId, isVisible: true } }),
      this.prisma.project.count({ where: { portfolioId, isVisible: true } }),
      this.prisma.interest.count({ where: { portfolioId, isVisible: true } }),
    ]);

    return {
      portfolio: { title: portfolio.title, isPublished: portfolio.isPublished },
      sections: {
        profile: { total: portfolio.profile ? 1 : 0, visible: portfolio.profile && portfolio.isPublished ? 1 : 0 },
        educations: { total: portfolio._count.educations, visible: educationsVisible },
        certificates: { total: portfolio._count.certificates, visible: certificatesVisible },
        experiences: { total: portfolio._count.experiences, visible: experiencesVisible },
        skills: { total: portfolio._count.skills, visible: skillsVisible },
        projects: { total: portfolio._count.projects, visible: projectsVisible },
        interests: { total: portfolio._count.interests, visible: interestsVisible },
        media: { total: portfolio._count.mediaAssets },
      },
      system: { database: 'connected' as const },
    };
  }
}
