import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import Animated, {
  BounceInDown,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PressableButton } from '../../src/components/PressableButton';
import {
  useSesion,
  type UsuarioSesion,
} from '../../src/context/sesion';
import { SafeAreaView } from '../../src/components/SafeAreaView';

const profileHeaderEntering = BounceInDown.springify().damping(13).delay(60);
const profileFormEntering = FadeInUp.springify().damping(16).delay(160);

export default function EditarPerfilScreen() {
  const { usuario, cargando, actualizarNombre } = useSesion();

  if (cargando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-navy-900">
        <Text className="text-base font-semibold text-white">
          Cargando perfil...
        </Text>
      </SafeAreaView>
    );
  }

  if (!usuario?.correoVerificado) {
    return <Redirect href="/login" />;
  }

  return (
    <EditarPerfilForm
      key={usuario.uid}
      usuario={usuario}
      actualizarNombre={actualizarNombre}
    />
  );
}

interface EditarPerfilFormProps {
  usuario: UsuarioSesion;
  actualizarNombre: (nombre: string) => Promise<void>;
}

function EditarPerfilForm({
  usuario,
  actualizarNombre,
}: EditarPerfilFormProps) {
  const [nombre, setNombre] = useState(usuario.nombre ?? '');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error'>('exito');
  const [guardando, setGuardando] = useState(false);
  const [campoActivo, setCampoActivo] = useState(false);
  const avatarPulse = useSharedValue(0);
  const formShake = useSharedValue(0);
  const formScale = useSharedValue(1);

  useEffect(() => {
    avatarPulse.set(withRepeat(withTiming(1, { duration: 1500 }), -1, true));

    return () => cancelAnimation(avatarPulse);
  }, [avatarPulse]);

  const avatarPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + avatarPulse.value * 0.5,
    transform: [{ scale: 0.9 + avatarPulse.value * 0.22 }],
  }));
  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: formShake.value },
      { scale: formScale.value },
    ],
  }));

  function animateFormError() {
    formShake.set(
      withSequence(
        withTiming(-13, { duration: 60 }),
        withTiming(13, { duration: 60 }),
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 55 }),
        withTiming(0, { duration: 65 }),
      ),
    );
    formScale.set(
      withSequence(
        withSpring(0.97, { damping: 7 }),
        withSpring(1.02, { damping: 7 }),
        withSpring(1, { damping: 9 }),
      ),
    );
  }

  async function handleSave() {
    const nombreNormalizado = nombre.trim().replace(/\s+/g, ' ');
    if (nombreNormalizado.length < 3) {
      animateFormError();
      setTipoMensaje('error');
      setMensaje('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    setGuardando(true);
    setMensaje(null);
    try {
      await actualizarNombre(nombreNormalizado);
      setNombre(nombreNormalizado);
      setTipoMensaje('exito');
      setMensaje('Tu nombre se actualizó correctamente.');
    } catch (error) {
      animateFormError();
      setTipoMensaje('error');
      setMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar tu nombre.',
      );
    } finally {
      setGuardando(false);
    }
  }

  const iniciales =
    nombre
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('') || 'U';

  return (
    <SafeAreaView className="flex-1 bg-navy-900">
      <StatusBar barStyle="light-content" />
      <View className="absolute -right-28 -top-20 h-80 w-80 rounded-full border border-cyan-200/10" />
      <View className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full border border-turquoise-300/10" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <Animated.View
            entering={profileHeaderEntering}
            className="mb-6 overflow-hidden rounded-[30px] border border-white/15 bg-white/5 p-5"
          >
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Feather color="#8DE9E7" name="droplet" size={18} />
                <Text className="ml-2 text-[10px] font-extrabold tracking-[2px] text-cyan-100">
                  EPMAPS · AGUA DE QUITO
                </Text>
              </View>
              <Feather color="#8DE9E7" name="edit-3" size={16} />
            </View>
            <View className="flex-row items-center">
              <View className="mr-4 h-[88px] w-[88px] items-center justify-center">
                <Animated.View
                  className="absolute h-full w-full rounded-[30px] border-2 border-cyan-200/60"
                  style={avatarPulseStyle}
                />
                <Animated.View
                  entering={ZoomIn.springify().damping(10).delay(140)}
                  className="h-[72px] w-[72px] items-center justify-center rounded-[24px] border border-white/20 bg-turquoise-500"
                >
                  <Text className="text-2xl font-extrabold tracking-wide text-white">
                    {iniciales}
                  </Text>
                </Animated.View>
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold tracking-[1.8px] text-cyan-200">
                  MI ESPACIO
                </Text>
                <Text
                  className="mt-1 text-[25px] font-extrabold tracking-tight text-white"
                  numberOfLines={1}
                >
                  {nombre.trim() || usuario.nombre || 'Tu perfil'}
                </Text>
                <Text className="mt-1 text-xs text-slate-300" numberOfLines={1}>
                  {usuario.correo}
                </Text>
                <View className="mt-3 flex-row self-start items-center rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1">
                  <Feather color="#6EE7B7" name="check-circle" size={12} />
                  <Text className="ml-1.5 text-[9px] font-extrabold tracking-wider text-emerald-100">
                    CUENTA VERIFICADA
                  </Text>
                </View>
              </View>
            </View>
            <Text className="mt-5 text-xs leading-[18px] text-slate-300">
              Mantén tus datos institucionales actualizados para identificarte
              en cada jornada de lectura.
            </Text>
          </Animated.View>

          <Animated.View
            entering={profileFormEntering}
            className="rounded-[28px] border border-white/70 bg-[#F8FAFC] p-6 shadow-2xl"
            style={formAnimatedStyle}
          >
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-extrabold tracking-[1.6px] text-cyan-700">
                  DATOS DE CUENTA
                </Text>
                <Text className="mt-1 text-xl font-extrabold tracking-tight text-navy-900">
                  Editar perfil
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100">
                <Feather color="#087F83" name="user" size={19} />
              </View>
            </View>

            <View className="mb-5 rounded-2xl border border-gray-100 bg-white px-4 py-3.5">
              <View className="mb-2 flex-row items-center">
                <Feather color="#087F83" name="mail" size={14} />
                <Text className="ml-2 text-[10px] font-extrabold tracking-wide text-gray-500">
                  CORREO INSTITUCIONAL
                </Text>
              </View>
              <Text className="text-sm font-semibold text-gray-800">
                {usuario.correo}
              </Text>
            </View>

            <View>
              <View className="mb-2 flex-row items-center">
                <Feather color="#087F83" name="user" size={14} />
                <Text className="ml-2 text-[10px] font-extrabold tracking-wide text-gray-700">
                  NOMBRE COMPLETO
                </Text>
              </View>
              <TextInput
                accessibilityLabel="Nombre completo"
                autoCapitalize="words"
                autoComplete="name"
                className={`rounded-2xl border bg-white px-4 py-4 text-base text-gray-900 ${
                  campoActivo
                    ? 'border-cyan-600 bg-cyan-50/40'
                    : 'border-gray-200'
                }`}
                maxLength={100}
                onBlur={() => setCampoActivo(false)}
                onChangeText={(value) => {
                  setNombre(value);
                  setMensaje(null);
                }}
                onFocus={() => setCampoActivo(true)}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                value={nombre}
              />
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">
                  Al menos 3 caracteres.
                </Text>
                <Text className="text-[10px] font-semibold text-gray-400">
                  {nombre.length}/100
                </Text>
              </View>
            </View>

            {mensaje ? (
              <Animated.View
                entering={
                  tipoMensaje === 'exito'
                    ? BounceInDown.duration(500)
                    : FadeInDown.duration(350)
                }
                accessibilityRole="alert"
                className={`mt-4 flex-row items-center rounded-2xl border px-4 py-3 ${
                  tipoMensaje === 'exito'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <Animated.View
                  entering={ZoomIn.delay(80).springify().damping(10)}
                >
                  <Feather
                    color={tipoMensaje === 'exito' ? '#047857' : '#B91C1C'}
                    name={tipoMensaje === 'exito' ? 'check-circle' : 'alert-circle'}
                    size={18}
                  />
                </Animated.View>
                <Text
                  className={`ml-2 flex-1 text-sm leading-5 ${
                    tipoMensaje === 'exito'
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  {mensaje}
                </Text>
              </Animated.View>
            ) : null}

            <PressableButton
              accessibilityLabel="Guardar cambios del perfil"
              className="mt-6 items-center rounded-2xl bg-navy-700 px-4 py-4"
              disabled={guardando}
              onPress={handleSave}
            >
              <View className="flex-row items-center justify-center">
                {guardando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Feather color="#FFFFFF" name="save" size={17} />
                )}
                <Text className="ml-2 text-base font-extrabold tracking-wide text-white">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Text>
              </View>
            </PressableButton>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
