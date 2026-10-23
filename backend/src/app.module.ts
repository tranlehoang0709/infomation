import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { MediaModule } from './modules/media/media.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InterestsModule } from './modules/interests/interests.module';
import { EducationsModule } from './modules/educations/educations.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ShareLinksModule } from './modules/share-links/share-links.module';
import { PrismaModule } from './prisma/prisma.module';
import { validateEnvironment } from './config/environment';
import { appConfigProvider } from './config/config.provider';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env', validate: validateEnvironment }),
    PrismaModule,
    AdminUsersModule,
    AuthModule,
    PortfolioModule,
    ProfileModule,
    ExperiencesModule,
    MediaModule,
    ProjectsModule,
    InterestsModule,
    EducationsModule,
    CertificatesModule,
    SkillsModule,
    ShareLinksModule,
    AdminDashboardModule,
  ],
  providers: [appConfigProvider],
})
export class AppModule {}
