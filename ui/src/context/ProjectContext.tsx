import React from 'react';
import { createContext, ReactNode, useCallback, useState } from 'react';
import { Project } from '../model/project';

type ProjectContextType = {
  projects: Project[];
  loading: boolean;
  addProject: (newProject: Project) => void;
  deleteProject: (id: string) => void;
  updateProject: (updatedProject: Project) => void;
  // Legacy support for Dashboard.tsx
  project: Project | undefined;
  removeProject: () => void;
};

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  loading: false,
  addProject: () => {},
  deleteProject: () => {},
  updateProject: () => {},
  // Legacy support
  project: undefined,
  removeProject: () => {}
});

interface Props {
  children: ReactNode;
}

export function ProjectProvider({ children }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading] = useState<boolean>(false);
  // Legacy: single project for Dashboard.tsx compatibility
  const [project, setProject] = useState<Project | undefined>(undefined);

  const addProject = useCallback((newProject: Project) => {
    setProjects((prev) => [...prev, newProject]);
    // Legacy support: also set single project
    setProject(newProject);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== id));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
    );
  }, []);

  // Legacy support for Dashboard.tsx
  const removeProject = useCallback(() => {
    setProject(undefined);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        addProject,
        deleteProject,
        updateProject,
        // Legacy support
        project,
        removeProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectContext;
