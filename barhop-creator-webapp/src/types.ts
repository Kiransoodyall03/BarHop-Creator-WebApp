
export interface User {
  email:         string | null;
  displayName:   string | null; 
  photoURL:      string | null;
  emailVerified: boolean;
  firstName:  string;
  lastName:   string;
  createdAt:  Date | null;
  updatedAt:  Date | null;
  provider: AuthProvider;     
}

export type AuthProvider = "email" | "google";

export type UserProfile = Omit<User, "uid" | "emailVerified" | "provider">;

export interface AuthContextType {
  currentUser: User | null;
  loading:     boolean;
}