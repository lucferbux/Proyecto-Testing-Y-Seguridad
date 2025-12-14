// ui/src/context/ProjectContext.tsx
import React, { createContext, ReactNode, useCallback, useMemo, useState } from 'react';
import { Project } from '../model/project';

type ProjectContextType = {
  // Backwards compatible: selected project
  project: Project | undefined;

  // Required by the assignment
  projects: Project[];
  loading: boolean;

  // Actions
  addProject: (newProject: Project) => void;

  // Backwards compatible: clears selected project only (does NOT remove from list)
  removeProject: () => void;

  // Required by the assignment
  deleteProject: (id: string) => void;
  updateProject: (updatedProject: Project) => void;
};

const ProjectContext = createContext<ProjectContextType>({
  project: undefined,
  projects: [],
  loading: false,
  addProject: () => {},
  removeProject: () => {},
  deleteProject: () => {},
  updateProject: () => {}
});

interface Props {
  children: ReactNode;
}

function getProjectId(p: Project): string | undefined {
  // Support both _id and id (some backends use one or the other)
  return (p as any)._id ?? (p as any).id;
}

export function ProjectProvider({ children }: Props) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading] = useState<boolean>(false); // kept for future async work

  const addProject = useCallback((newProject: Project) => {
    const newId = getProjectId(newProject);

    setProjects((prev) => {
      if (!newId) return [...prev, newProject];
      const exists = prev.some((p) => getProjectId(p) === newId);
      return exists ? prev : [...prev, newProject];
    });

    setProject(newProject);
  }, []);

  const removeProject = useCallback(() => {
    setProject(undefined);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => getProjectId(p) !== id));

    setProject((prevSelected) => {
      const selectedId = prevSelected ? getProjectId(prevSelected) : undefined;
      return selectedId === id ? undefined : prevSelected;
    });
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    const updatedId = getProjectId(updatedProject);
    if (!updatedId) {
      // If there's no id, we can't match; do nothing (safe)
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (getProjectId(p) === updatedId ? { ...p, ...updatedProject } : p))
    );

    setProject((prevSelected) => {
      const selectedId = prevSelected ? getProjectId(prevSelected) : undefined;
      return selectedId === updatedId ? { ...prevSelected, ...updatedProject } : prevSelected;
    });
  }, []);

  const value = useMemo(
    () => ({
      project,
      projects,
      loading,
      addProject,
      removeProject,
      deleteProject,
      updateProject
    }),
    [project, projects, loading, addProject, removeProject, deleteProject, updateProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export default ProjectContext;
