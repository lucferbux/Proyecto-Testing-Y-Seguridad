import { createContext, ReactNode, useCallback, useState } from 'react';
import { Project } from '../model/project';

type ProjectcontextType = {
  projects: Project[];
  currentProject: Project | undefined;
  loading: boolean;
  addProject: (newProject: Project) => void;
  deleteProject: (id: string) => void;
  updateProject: (project: Project) => void;
  setCurrentProject: (newProject: Project) => void;
  clearCurrentProject: () => void;
};

const ProjectContext = createContext<ProjectcontextType>({
  projects: [],
  currentProject: undefined,
  loading: false,
  addProject: () => {},
  deleteProject: () => {},
  updateProject: () => {},
  setCurrentProject: () => {},
  clearCurrentProject: () => {}
});

interface Props {
  children: ReactNode;
}

export function ProjectProvider({ children }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const addProject = useCallback(
    (newProject: Project) => {
      setProjects((prev) => [...prev, newProject]);
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== id));
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
    );
  }, []);

  const setCurrentProject = useCallback(
    (newProject: Project) => {
      setCurrentProjectState(newProject);
    },
    []
  );

  const clearCurrentProject = useCallback(() => {
    setCurrentProjectState(undefined);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        loading,
        addProject,
        deleteProject,
        updateProject,
        setCurrentProject,
        clearCurrentProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectContext;
