import ProjectsService from './service';
import { HttpError } from '@/config/error';
import { IProjectsModel } from './model';
import { NextFunction, Request, Response } from 'express';

/**
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise < void >}
 */
export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aboutMeArray: IProjectsModel[] = await ProjectsService.findAll();

    res.status(200).json(aboutMeArray.sort((a, b) => a.timestamp - b.timestamp));
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}

/**
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise < void >}
 */
export async function findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project: IProjectsModel | null = await ProjectsService.findOne(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    res.status(200).json(project);
  } catch (error) {
    // Handle Joi validation errors (invalid ObjectId format)
    if (error.message && (
      error.message.includes('must be a valid') ||
      error.message.includes('fails to match') ||
      error.message.includes('12 bytes') ||
      error.message.includes('24 hex characters')
    )) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(new HttpError(error.message?.status || 500, error.message));
  }
}

/**
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise < void >}
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project: IProjectsModel = await ProjectsService.insert(req.body);

    res.status(201).json(project);
  } catch (error) {
    // Handle Joi validation errors
    if (error.message && (error.message.includes('is required') || error.message.includes('must be'))) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(new HttpError(error.message?.status || 500, error.message));
  }
}

/**
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise < void >}
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ProjectsService.remove(req.body._id);
    delete req.body._id;
    const aboutMe: IProjectsModel = await ProjectsService.insert(req.body);

    res.status(201).json(aboutMe);
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}

/**
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise < void >}
 */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aboutMe: IProjectsModel = await ProjectsService.remove(req.body.id);

    res.status(200).json(aboutMe);
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}
