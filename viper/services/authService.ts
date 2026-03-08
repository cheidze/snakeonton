
import { UserProfile, TelegramUser } from "../types";

const USERS_KEY = "snakeon_users_v4"; // Version bump to clear old cached data
const CURRENT_USER_KEY = "snakeon_current_user";
const GOOGLE_CLIENT_ID = "152004095182-0094008a0sqfqudtu9s03jp4h6e0l052.apps.googleusercontent.com";

export interface StoredUser extends UserProfile {
  password?: string;
}

export class AuthService {

  // Get all registered users
  public getUsers(): StoredUser[] {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Get currently logged in user
  public getCurrentUser(): UserProfile | null {
    try {
      const user = localStorage.getItem(CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  // --- ADMIN FUNCTIONS ---

  public isAdmin(emailOrName: string, password?: string): boolean {
    return emailOrName === "amidamaru" && password === "Giorgi11";
  }

  public toggleBan(userId: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;

    users[idx].isBanned = !users[idx].isBanned;
    this.saveUsers(users);
    return users[idx].isBanned || false;
  }

  // --- END ADMIN FUNCTIONS ---

  // Helper to fetch IP info (non-blocking)
  private async fetchIpInfo(): Promise<{ ip: string; country: string; city: string }> {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      return {
        ip: data.ip || 'Unknown',
        country: data.country_code || 'WW',
        city: data.city || 'Unknown'
      };
    } catch (e) {
      return { ip: 'Unknown', country: 'WW', city: 'Unknown' };
    }
  }

  public async register(
    email: string,
    username: string,
    password?: string,
    dob?: { day: string; month: string; year: string },
    gender?: 'male' | 'female' | 'other'
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const users = this.getUsers();

    if (users.find(u => u.email === email)) {
      return { success: false, message: "Email already registered." };
    }
    if (users.find(u => u.username === username)) {
      return { success: false, message: "Username taken." };
    }

    const ipInfo = await this.fetchIpInfo();

    const newUser: StoredUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username,
      password,
      dob,
      gender,
      createdAt: Date.now(),
      ip: ipInfo.ip,
      country: ipInfo.country,
      city: ipInfo.city,
      lastLogin: Date.now(),
      isBanned: false,
      termsAccepted: true,
      device: navigator.userAgent
    };

    users.push(newUser);
    this.saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    this.setCurrentUser(safeUser);

    return { success: true, message: "Registration successful!", user: safeUser };
  }

  public async login(email: string, password?: string): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, message: "User not found." };
    }

    if (user.isBanned) {
      return { success: false, message: "ACCOUNT SUSPENDED. Contact Support." };
    }

    // Check password only if user was registered with one (not google only)
    if (user.password && user.password !== password) {
      return { success: false, message: "Invalid password." };
    }

    // Update login info
    const ipInfo = await this.fetchIpInfo();
    user.lastLogin = Date.now();
    user.ip = ipInfo.ip;
    user.country = ipInfo.country;
    user.city = ipInfo.city;

    // Save updates
    const idx = users.findIndex(u => u.id === user.id);
    users[idx] = user;
    this.saveUsers(users);

    const { password: _, ...safeUser } = user;
    this.setCurrentUser(safeUser);
    return { success: true, message: "Login successful", user: safeUser };
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) return null;

    // Check if username is being updated and if it's taken by someone else
    if (updates.username) {
      const taken = users.find(u => u.username === updates.username && u.id !== id);
      if (taken) return null; // Username taken
    }

    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    this.saveUsers(users);

    const { password: _, ...safeUser } = updatedUser;
    this.setCurrentUser(safeUser);
    return safeUser;
  }

  private setCurrentUser(user: UserProfile) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  public async loginWithGoogle(): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    return new Promise((resolve) => {
      // Check if Google script is loaded
      if (typeof window !== 'undefined' && (window as any).google && (window as any).google.accounts) {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.access_token) {
                try {
                  // Fetch user info from Google
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                      'Authorization': `Bearer ${tokenResponse.access_token}`
                    }
                  });

                  if (!userInfoRes.ok) throw new Error('Failed to fetch user info');

                  const googleData = await userInfoRes.json();

                  // Process user data
                  const googleEmail = googleData.email;
                  const googleId = "google_" + googleData.sub; // sub is the unique google ID
                  const googlePicture = googleData.picture;

                  const users = this.getUsers();
                  let user = users.find(u => u.id === googleId || u.email === googleEmail);
                  let safeUser: UserProfile;

                  if (!user) {
                    const ipInfo = await this.fetchIpInfo();
                    // New Google User
                    const newUser: StoredUser = {
                      id: googleId,
                      email: googleEmail,
                      username: "", // Triggers profile completion
                      picture: googlePicture,
                      createdAt: Date.now(),
                      ip: ipInfo.ip,
                      country: ipInfo.country,
                      city: ipInfo.city,
                      lastLogin: Date.now(),
                      isBanned: false,
                      termsAccepted: true,
                      device: navigator.userAgent
                    };
                    users.push(newUser);
                    this.saveUsers(users);
                    safeUser = newUser;
                  } else {
                    if (user.isBanned) {
                      resolve({ success: false, message: "ACCOUNT SUSPENDED." });
                      return;
                    }

                    // Existing User - update picture if needed
                    if (!user.picture && googlePicture) {
                      user.picture = googlePicture;
                    }

                    // Update Login Stats
                    const ipInfo = await this.fetchIpInfo();
                    user.ip = ipInfo.ip;
                    user.lastLogin = Date.now();

                    // Update stored user
                    const idx = users.findIndex(u => u.id === user!.id);
                    if (idx !== -1) users[idx] = user;
                    this.saveUsers(users);

                    const { password: _, ...u } = user;
                    safeUser = u;
                  }

                  this.setCurrentUser(safeUser);
                  resolve({ success: true, message: "Google Login Successful", user: safeUser });
                } catch (err) {
                  console.error("Error fetching Google user info:", err);
                  resolve({ success: false, message: "Failed to retrieve Google profile." });
                }
              } else {
                resolve({ success: false, message: "Google sign-in cancelled." });
              }
            },
            error_callback: (err: any) => {
              console.error("Google Auth Error:", err);
              resolve({ success: false, message: "Google Authorization failed." });
            }
          });

          client.requestAccessToken();

        } catch (e) {
          console.error("Google SDK Init Error:", e);
          resolve({ success: false, message: "Could not initialize Google Sign-In." });
        }
      } else {
        // Fallback to simulation if real script fails to load (e.g. no internet or adblock)
        this.loginWithGoogleSimulation().then(resolve);
      }
    });
  }

  // Fallback simulation for when real API is blocked or offline
  private async loginWithGoogleSimulation(): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const mockEmail = "pilot_guest_" + Math.floor(Math.random() * 1000) + "@gmail.com";
    const googleAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockEmail}&backgroundColor=b6e3f4`;

    const users = this.getUsers();
    const googleId = "google_sim_" + Date.now();
    const ipInfo = await this.fetchIpInfo();

    const newUser: StoredUser = {
      id: googleId,
      email: mockEmail,
      username: "",
      picture: googleAvatar,
      createdAt: Date.now(),
      ip: ipInfo.ip,
      country: ipInfo.country,
      city: ipInfo.city,
      isBanned: false,
      lastLogin: Date.now(),
      termsAccepted: true,
      device: navigator.userAgent
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    return { success: true, message: "Simulated Google Login (SDK unavailable)", user: newUser };
  }

  public logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // --- TELEGRAM LOGIN ---

  /**
   * Auto-login or register using Telegram WebApp init data.
   * No password required — Telegram identity is trusted.
   * For production: validate initData on your backend.
   */
  public async loginWithTelegram(tgUser: TelegramUser, startParam?: string | null): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const users = this.getUsers();
    const telegramId = `tg_${tgUser.id}`;

    let user = users.find(u => u.telegramId === telegramId || u.id === telegramId);

    if (user) {
      if (user.isBanned) {
        return { success: false, message: 'ACCOUNT SUSPENDED.' };
      }
      // Update Telegram profile data
      user.telegramUsername = tgUser.username;
      user.telegramPhoto = tgUser.photo_url;
      user.lastLogin = Date.now();
      const idx = users.findIndex(u => u.id === user!.id);
      users[idx] = user;
      this.saveUsers(users);
      this.setCurrentUser(user);
      return { success: true, message: 'Telegram login successful', user };
    }

    // New user — auto-register
    const ipInfo = await this.fetchIpInfo();
    // prioritize first_name + last_name, fallback to tgUser.username or ID
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
    const username = fullName || tgUser.username || `Player_${tgUser.id}`;
    const referralCode = `ref_${telegramId}`;

    const newUser: StoredUser = {
      id: telegramId,
      email: `${telegramId}@telegram.local`,
      username,
      picture: tgUser.photo_url,
      telegramId,
      telegramUsername: tgUser.username,
      telegramPhoto: tgUser.photo_url,
      referralCode,
      referredBy: startParam && startParam.startsWith('ref_') ? startParam : undefined,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isBanned: false,
      termsAccepted: true,
      ip: ipInfo.ip,
      country: ipInfo.country,
      city: ipInfo.city,
      device: navigator.userAgent,
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return { success: true, message: 'Telegram registration successful', user: newUser };
  }

  // --- TON WALLET LINKING ---

  /**
   * Link (or unlink) a TON wallet address to a user profile.
   */
  public setTonAddress(userId: string, address: string | null): UserProfile | null {
    return this.updateUser(userId, {
      tonAddress: address ?? undefined,
      tonConnectedAt: address ? Date.now() : undefined,
    });
  }
}

export const authService = new AuthService();