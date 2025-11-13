// Mock de api-client-factory para evitar problemas con import.meta
export default jest.fn(() => ({
  token: jest.fn(),
  getProjects: jest.fn(),
  postProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  createOrUpdateProject: jest.fn(),
  getDashboardInfo: jest.fn(),
}));
