export type UserProfile = {
  name: string;
  email: string;
  role: string;
  timezone: string;
};

const userProfileMock: UserProfile = {
  name: 'Antonio Calderon',
  email: 'antioniocraft@gmail.com',
  role: 'Admin',
  timezone: 'GMT-6',
};

export async function getUserProfile(): Promise<UserProfile> {
  // TODO: Replace with real API call when backend is available.
  // Example: return (await apiClient.get('/users/me')).data;
  return Promise.resolve(userProfileMock);
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  // TODO: Replace with real API call when backend is available.
  // Example: return (await apiClient.put('/users/me', profile)).data;
  Object.assign(userProfileMock, profile);
  return Promise.resolve({ ...userProfileMock });
}
