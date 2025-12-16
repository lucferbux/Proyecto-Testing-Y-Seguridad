import UserModel from '../components/User/model';

/**
 * Limpia todas las colecciones de la base de datos
 */
export const clearDatabase = async () => {
  const collections = UserModel.db.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Crea usuarios de prueba
 */
export async function seedUsers(users: Array<{ email: string; password: string }>) {
  const createdUsers = [];
  
  for (const user of users) {
    const created = await UserModel.create(user);
    createdUsers.push(created);
  }
  
  return createdUsers;
}