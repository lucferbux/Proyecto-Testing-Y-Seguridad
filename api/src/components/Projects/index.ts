// api/src/components/Projects/index.ts
import ProjectsService from './service';
import { HttpError } from '@/config/error';
import { IProjectsModel } from './model';
import { NextFunction, Request, Response } from 'express';

function forwardError(error: any, next: NextFunction) {
  if (error instanceof HttpError) {
    return next(error);
  }

  if (typeof error?.status === 'number') {
    return next(new HttpError(error.status, error.message));
  }

  return next(new HttpError(500, error?.message || 'Error'));
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aboutMeArray: IProjectsModel[] = await ProjectsService.findAll();

    res.status(200).json(aboutMeArray.sort((a, b) => a.timestamp - b.timestamp));
  } catch (error) {
    forwardError(error, next);
  }
}

export async function findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aboutMe: IProjectsModel = await ProjectsService.findOne(req.params.id);

    res.status(200).json(aboutMe);
  } catch (error) {
    forwardError(error, next);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aboutMe: IProjectsModel = await ProjectsService.insert(req.body);

    res.status(201).json(aboutMe);
  } catch (error) {
    forwardError(error, next);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ProjectsService.remove(req.body._id);
    delete req.body._id;
    const aboutMe: IProjectsModel = await ProjectsService.insert(req.body);

    res.status(201).json(aboutMe);
  } catch (error) {
    forwardError(error, next);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aboutMe: IProjectsModel = await ProjectsService.remove(req.body.id);

    res.status(200).json(aboutMe);
  } catch (error) {
    forwardError(error, next);
  }
}
