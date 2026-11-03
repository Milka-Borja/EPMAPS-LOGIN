const mensajesAuth: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya está registrado.',
  'auth/expired-action-code': 'El enlace expiró. Solicita uno nuevo.',
  'auth/invalid-action-code': 'El enlace ya no es válido. Solicita uno nuevo.',
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/invalid-email': 'Ingresa un correo electrónico válido.',
  'auth/missing-email': 'Ingresa tu correo electrónico.',
  'auth/missing-password': 'Ingresa tu contraseña.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión.',
  'auth/operation-not-allowed':
    'Este método de acceso no está habilitado. Contacta al administrador.',
  'auth/requires-recent-login':
    'Vuelve a iniciar sesión para realizar esta acción.',
  'auth/too-many-requests':
    'Se realizaron demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/uid-already-exists': 'No se pudo crear esta cuenta.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al administrador.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/wrong-password': 'El correo o la contraseña son incorrectos.',
};

export class CorreoNoVerificadoError extends Error {
  constructor() {
    super('Debes verificar tu correo institucional antes de ingresar');
    this.name = 'CorreoNoVerificadoError';
  }
}

export function traducirErrorFirebase(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('auth/')
  ) {
    return (
      mensajesAuth[error.code] ??
      'No se pudo completar la autenticación. Intenta nuevamente.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}
