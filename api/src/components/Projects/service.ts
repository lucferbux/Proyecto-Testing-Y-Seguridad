// api/src/components/Projects/service.ts
import Joi from 'joi';
import ProjectModel, { IProjectsModel } from './model';
import ProjectsValidation from './validation';
import { IProjectsService } from './interface';
import { Types } from 'mongoose';
import { HttpError } from '@/config/error';

/**
 * @export
 * @implements {IProjectsModelService}
 */
const ProjectsService: IProjectsService = {
  async findAll(): Promise<IProjectsModel[]> {
    try {
      return await ProjectModel.find(
        {},
        {
          password: 0
        }
      );
    } catch (error: any) {
      throw new HttpError(500, error.message);
    }
  },

  async findOne(id: string): Promise<IProjectsModel> {
    try {
      const validate: Joi.ValidationResult<{ id: string }> = ProjectsValidation.getProject({ id });

      if (validate.error) {
        throw new HttpError(400, validate.error.message);
      }

      const project = await ProjectModel.findOne(
        {
          _id: new Types.ObjectId(id)
        },
        {
          password: 0
        }
      );

      if (!project) {
        throw new HttpError(404, 'Project not found');
      }

      return project;
    } catch (error: any) {
      if (
        error?.name === 'BSONTypeError' ||
        String(error?.message || '').includes('Cast to ObjectId failed')
      ) {
        throw new HttpError(400, 'Cast to ObjectId failed');
      }
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, error.message);
    }
  },

  async insert(body: IProjectsModel): Promise<IProjectsModel> {
    try {
      const validate: Joi.ValidationResult<IProjectsModel> = ProjectsValidation.createProject(body);

      if (validate.error) {
        throw new HttpError(400, validate.error.message);
      }

      const project: IProjectsModel = await ProjectModel.create(body);

      return project;
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, error.message);
    }
  },

  async remove(id: string): Promise<IProjectsModel> {
    try {
      const validate: Joi.ValidationResult<{ id: string }> = ProjectsValidation.removeProject({
        id
      });

      if (validate.error) {
        throw new HttpError(400, validate.error.message);
      }

      const project: IProjectsModel = await ProjectModel.findOneAndRemove({
        _id: new Types.ObjectId(id)
      });

      if (!project) {
        throw new HttpError(404, 'Project not found');
      }

      return project;
    } catch (error: any) {
      if (
        error?.name === 'BSONTypeError' ||
        String(error?.message || '').includes('Cast to ObjectId failed')
      ) {
        throw new HttpError(400, 'Cast to ObjectId failed');
      }
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, error.message);
    }
  }
};

export default ProjectsService;
