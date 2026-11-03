import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

type NivelFortaleza = 'Debil' | 'Media' | 'Fuerte';

function evaluarFortaleza(clave: string): {
  nivel: NivelFortaleza;
  progreso: number;
  color: string;
} {
  const tieneMinuscula = /[a-z]/.test(clave);
  const tieneMayuscula = /[A-Z]/.test(clave);
  const tieneNumero = /\d/.test(clave);
  const tieneSimbolo = /[^A-Za-z0-9]/.test(clave);

  if (
    clave.length >= 8 &&
    tieneMinuscula &&
    tieneMayuscula &&
    tieneNumero &&
    tieneSimbolo
  ) {
    return { nivel: 'Fuerte', progreso: 100, color: '#10B981' };
  }

  if (clave.length >= 8 && /[A-Za-z]/.test(clave) && tieneNumero) {
    return { nivel: 'Media', progreso: 66, color: '#EAB308' };
  }

  return { nivel: 'Debil', progreso: 33, color: '#EF4444' };
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const { nivel, progreso, color } = evaluarFortaleza(password);
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progreso}%`, { duration: 250 }),
    backgroundColor: withTiming(color, { duration: 250 }),
  }));

  if (!password) {
    return null;
  }

  return (
    <View
      accessible
      accessibilityLabel={`Seguridad de la contraseña: ${nivel}`}
      className="mt-2 gap-2"
    >
      <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <Animated.View className="h-full rounded-full" style={animatedStyle} />
      </View>
      <Text
        className={`text-xs font-semibold ${
          nivel === 'Fuerte'
            ? 'text-emerald-600'
            : nivel === 'Media'
              ? 'text-yellow-600'
              : 'text-red-500'
        }`}
      >
        {nivel}
      </Text>
    </View>
  );
}
