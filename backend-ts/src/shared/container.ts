/**
 * Dependency Injection Container Configuration
 * Using tsyringe for constructor injection
 */
import 'reflect-metadata';
import { container } from 'tsyringe';

// Repositories
import { UserRepository } from '../repositories/user.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { SimilarityRepository } from '../repositories/similarity.repository.js';

// Services
import { AuthService } from '../services/auth.service.js';
import { ClassService } from '../services/class.service.js';
import { SubmissionService } from '../services/submission.service.js';
import { StudentDashboardService } from '../services/student-dashboard.service.js';
import { TeacherDashboardService } from '../services/teacher-dashboard.service.js';
import { PlagiarismService } from '../services/plagiarism.service.js';
import { UserService } from '../services/user.service.js';
import { AdminService } from '../services/admin.service.js';

// Register repositories as singletons
container.registerSingleton('UserRepository', UserRepository);
container.registerSingleton('ClassRepository', ClassRepository);
container.registerSingleton('AssignmentRepository', AssignmentRepository);
container.registerSingleton('EnrollmentRepository', EnrollmentRepository);
container.registerSingleton('SubmissionRepository', SubmissionRepository);
container.registerSingleton('SimilarityRepository', SimilarityRepository);

// Register services as singletons
container.registerSingleton('AuthService', AuthService);
container.registerSingleton('ClassService', ClassService);
container.registerSingleton('SubmissionService', SubmissionService);
container.registerSingleton('StudentDashboardService', StudentDashboardService);
container.registerSingleton('TeacherDashboardService', TeacherDashboardService);
container.registerSingleton('PlagiarismService', PlagiarismService);
container.registerSingleton('UserService', UserService);
container.registerSingleton('AdminService', AdminService);

export { container };
