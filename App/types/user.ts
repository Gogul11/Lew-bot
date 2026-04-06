export type ApiResponse = {
  status: 0 | 1;
  message: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type StoredUserDetails = {
  userId: string;
  email: string;
  username: string;
  loggedInAt: string;
};
