import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from '@firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import {
  CorreoNoVerificadoError,
  traducirErrorFirebase,
} from '../lib/errores-firebase';

export interface UsuarioSesion {
  uid: string;
  nombre: string | null;
  correo: string | null;
  correoVerificado: boolean;
  fotoURL: string | null;
}

interface SesionContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  errorInicializacion: string | null;
  iniciarSesion: (correo: string, clave: string) => Promise<void>;
  registrarse: (nombre: string, correo: string, clave: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  enviarCorreoRecuperacion: (correo: string) => Promise<void>;
  cambiarClave: (nuevaClave: string) => Promise<void>;
  actualizarNombre: (nuevoNombre: string) => Promise<void>;
  reenviarVerificacion: (correo: string, clave: string) => Promise<void>;
}

const SesionContext = createContext<SesionContextValue | undefined>(undefined);

function convertirUsuario(usuario: User | null): UsuarioSesion | null {
  if (!usuario) {
    return null;
  }

  return {
    uid: usuario.uid,
    nombre: usuario.displayName,
    correo: usuario.email,
    correoVerificado: usuario.emailVerified,
    fotoURL: usuario.photoURL,
  };
}

function usuarioAutenticado(): User {
  const usuario = getFirebaseAuth().currentUser;
  if (!usuario) {
    throw new Error('Debes iniciar sesión para realizar esta acción.');
  }
  return usuario;
}

function lanzarErrorTraducido(error: unknown): never {
  if (error instanceof CorreoNoVerificadoError) {
    throw error;
  }
  throw new Error(traducirErrorFirebase(error));
}

export function SesionProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorInicializacion, setErrorInicializacion] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelarSuscripcion: (() => void) | undefined;
    let desmontado = false;

    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (desmontado) {
          return;
        }
        cancelarSuscripcion = onAuthStateChanged(
          auth,
          (usuarioFirebase) => {
            setUsuario(convertirUsuario(usuarioFirebase));
            setCargando(false);
          },
          (error) => {
            setErrorInicializacion(traducirErrorFirebase(error));
            setCargando(false);
          },
        );
      })
      .catch((error: unknown) => {
        if (!desmontado) {
          setErrorInicializacion(traducirErrorFirebase(error));
          setCargando(false);
        }
      });

    return () => {
      desmontado = true;
      cancelarSuscripcion?.();
    };
  }, []);

  const iniciarSesion = useCallback(
    async (correo: string, clave: string): Promise<void> => {
      try {
        const auth = getFirebaseAuth();
        const credencial = await signInWithEmailAndPassword(auth, correo, clave);
        if (!credencial.user.emailVerified) {
          await signOut(auth);
          throw new CorreoNoVerificadoError();
        }
      } catch (error) {
        lanzarErrorTraducido(error);
      }
    },
    [],
  );

  const registrarse = useCallback(
    async (nombre: string, correo: string, clave: string): Promise<void> => {
      try {
        const auth = getFirebaseAuth();
        const credencial = await createUserWithEmailAndPassword(
          auth,
          correo,
          clave,
        );
        try {
          await updateProfile(credencial.user, { displayName: nombre });
          await sendEmailVerification(credencial.user);
        } catch (error) {
          await signOut(auth);
          throw error;
        }
        await signOut(auth);
      } catch (error) {
        lanzarErrorTraducido(error);
      }
    },
    [],
  );

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await signOut(getFirebaseAuth());
    } catch (error) {
      lanzarErrorTraducido(error);
    }
  }, []);

  const enviarCorreoRecuperacion = useCallback(
    async (correo: string): Promise<void> => {
      try {
        await sendPasswordResetEmail(getFirebaseAuth(), correo);
      } catch (error) {
        lanzarErrorTraducido(error);
      }
    },
    [],
  );

  const cambiarClave = useCallback(
    async (nuevaClave: string): Promise<void> => {
      try {
        await updatePassword(usuarioAutenticado(), nuevaClave);
      } catch (error) {
        lanzarErrorTraducido(error);
      }
    },
    [],
  );

  const actualizarNombre = useCallback(
    async (nuevoNombre: string): Promise<void> => {
      try {
        const usuarioActual = usuarioAutenticado();
        await updateProfile(usuarioActual, { displayName: nuevoNombre });
        setUsuario(convertirUsuario(usuarioActual));
      } catch (error) {
        lanzarErrorTraducido(error);
      }
    },
    [],
  );

  const reenviarVerificacion = useCallback(
    async (correo: string, clave: string): Promise<void> => {
      const auth = getFirebaseAuth();
      try {
        const credencial = await signInWithEmailAndPassword(auth, correo, clave);
        try {
          if (credencial.user.emailVerified) {
            throw new Error('Este correo ya está verificado.');
          }
          await sendEmailVerification(credencial.user);
        } finally {
          await signOut(auth);
        }
      } catch (error) {
        lanzarErrorTraducido(error);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      errorInicializacion,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      enviarCorreoRecuperacion,
      cambiarClave,
      actualizarNombre,
      reenviarVerificacion,
    }),
    [
      usuario,
      cargando,
      errorInicializacion,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      enviarCorreoRecuperacion,
      cambiarClave,
      actualizarNombre,
      reenviarVerificacion,
    ],
  );

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

export function useSesion(): SesionContextValue {
  const context = useContext(SesionContext);
  if (!context) {
    throw new Error('useSesion debe usarse dentro de un SesionProvider.');
  }
  return context;
}
