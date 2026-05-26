import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {

    try {

      const saved =
        localStorage.getItem(
          'dineflow_user'
        );

      return saved
        ? JSON.parse(saved)
        : null;

    } catch {

      return null;

    }

  });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const token =
      localStorage.getItem(
        'dineflow_token'
      );

    const savedUser =
      localStorage.getItem(
        'dineflow_user'
      );

    if (
      token &&
      savedUser
    ) {

      try {

        setUser(
          JSON.parse(savedUser)
        );

      } catch {

        localStorage.removeItem(
          'dineflow_token'
        );

        localStorage.removeItem(
          'dineflow_user'
        );

      }

    }

    setLoading(false);

  }, []);

  const login = useCallback(

    async (email, password) => {

      const res =
        await authAPI.login({
          email,
          password
        });

      const payload =
        res.data?.data ||
        res.data;

      const token =
        payload?.token;

      const userData =
        payload?.user;

      if (
        !token ||
        !userData
      ) {

        throw new Error(
          'Invalid login response'
        );

      }

      localStorage.setItem(
        'dineflow_token',
        token
      );

      localStorage.setItem(
        'dineflow_user',
        JSON.stringify(
          userData
        )
      );

      setUser(userData);

      return userData;

    },

    []

  );

  const logout = useCallback(() => {

    localStorage.removeItem(
      'dineflow_token'
    );

    localStorage.removeItem(
      'dineflow_user'
    );

    setUser(null);

  }, []);

  const updateUser =
    useCallback(

      (updates) => {

        setUser(prev => {

          const updated = {
            ...prev,
            ...updates
          };

          localStorage.setItem(
            'dineflow_user',
            JSON.stringify(
              updated
            )
          );

          return updated;

        });

      },

      []

    );

  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated:
          !!user
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};

export const useAuth = () => {

  const ctx =
    useContext(
      AuthContext
    );

  if (!ctx) {

    throw new Error(
      'useAuth must be used within AuthProvider'
    );

  }

  return ctx;

};
