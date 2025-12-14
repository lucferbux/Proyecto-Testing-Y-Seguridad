// api/src/routes/ProjectsRouter.ts
import { Router } from 'express';
import { ProjectsComponent } from '@/components';
import * as jwtConfig from '@/config/middleware/jwtAuth';

/**
 * @constant {express.Router}
 */
const router: Router = Router();

router.get('/', ProjectsComponent.findAll);

// ✅ Required by the assignment: GET /v1/projects/:id
router.get('/:id', ProjectsComponent.findOne);

router.post('/', jwtConfig.isAuthenticated, ProjectsComponent.create);

router.put('/', jwtConfig.isAuthenticated, ProjectsComponent.update);

router.delete('/', jwtConfig.isAuthenticated, ProjectsComponent.remove);

/**
 * @export {express.Router}
 */
export default router;
