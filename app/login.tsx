import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Animated, {
  BounceInDown,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from '../src/components/SafeAreaView';
import { WaterPulse } from '../src/components/WaterPulse';
import { useSesion } from '../src/context/sesion';
import { CorreoNoVerificadoError } from '../src/lib/errores-firebase';
import { PressableButton } from '../src/components/PressableButton';

const brandEntering = FadeInDown.duration(800).delay(40);
const heroEntering = BounceInDown.springify().damping(14).delay(100);
const loginCardEntering = FadeInUp.springify().damping(16).delay(220);
const emailEntering = FadeInDown.delay(360).duration(650);
const passwordEntering = FadeInDown.delay(460).duration(650);

export default function LoginScreen() {
  const {
    usuario,
    cargando,
    errorInicializacion,
    iniciarSesion,
    enviarCorreoRecuperacion,
    reenviarVerificacion,
  } = useSesion();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [correoNoVerificado, setCorreoNoVerificado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [campoActivo, setCampoActivo] = useState<'correo' | 'clave' | null>(
    null,
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewHeight = useRef(0);
  const scrollOffset = useRef(0);
  const loginCardTop = useRef(0);
  const fieldsContainerTop = useRef(0);
  const emailFieldLayout = useRef({ top: 0, height: 0 });
  const passwordFieldLayout = useRef({ top: 0, height: 0 });
  const keyboardVisible = useRef(false);
  const pendingFieldLayout = useRef<{ top: number; height: number } | null>(
    null,
  );
  const shake = useSharedValue(0);
  const cardScale = useSharedValue(1);

  function scrollFocusedFieldIntoView() {
    const field = pendingFieldLayout.current;
    if (!field || scrollViewHeight.current === 0) {
      return;
    }

    const fieldTop = loginCardTop.current + fieldsContainerTop.current + field.top;
    const fieldBottom = fieldTop + field.height;
    const visibleTop = scrollOffset.current;
    const visibleBottom = visibleTop + scrollViewHeight.current;
    let nextOffset = visibleTop;

    if (fieldBottom + 24 > visibleBottom) {
      nextOffset = fieldBottom + 24 - scrollViewHeight.current;
    } else if (fieldTop < visibleTop + 16) {
      nextOffset = Math.max(0, fieldTop - 16);
    }

    if (nextOffset !== visibleTop) {
      scrollViewRef.current?.scrollTo({ y: nextOffset, animated: true });
    }
    pendingFieldLayout.current = null;
  }

  function revealField(layout: { top: number; height: number }) {
    pendingFieldLayout.current = layout;
    if (keyboardVisible.current) {
      requestAnimationFrame(scrollFocusedFieldIntoView);
    }
  }

  useEffect(() => {
    if (usuario?.correoVerificado) {
      router.replace('/(tabs)/buscar');
    }
  }, [usuario]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisible.current = true;
      if (pendingFieldLayout.current) {
        requestAnimationFrame(scrollFocusedFieldIntoView);
      }
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisible.current = false;
      pendingFieldLayout.current = null;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: cardScale.value }],
  }));

  async function handleLogin() {
    setMensajeError(null);
    setMensajeExito(null);
    setCorreoNoVerificado(false);
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), clave);
      router.replace('/(tabs)/buscar');
    } catch (error) {
      shake.set(
        withSequence(
          withTiming(-16, { duration: 65 }),
          withTiming(16, { duration: 65 }),
          withTiming(-11, { duration: 55 }),
          withTiming(11, { duration: 55 }),
          withTiming(0, { duration: 65 }),
        ),
      );
      cardScale.set(
        withSequence(
          withSpring(0.96, { damping: 7 }),
          withSpring(1.025, { damping: 6 }),
          withSpring(1, { damping: 9 }),
        ),
      );
      setCorreoNoVerificado(error instanceof CorreoNoVerificadoError);
      setMensajeError(
        error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleResendVerification() {
    setMensajeError(null);
    setMensajeExito(null);
    setEnviando(true);
    try {
      await reenviarVerificacion(correo.trim(), clave);
      setMensajeExito('Enviamos un nuevo enlace de verificación a tu correo.');
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : 'No se pudo reenviar el correo de verificación.',
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handlePasswordRecovery() {
    setMensajeError(null);
    setMensajeExito(null);
    setEnviando(true);
    try {
      await enviarCorreoRecuperacion(correo.trim());
      setMensajeExito('Si el correo está registrado, recibirás instrucciones para recuperar tu clave.');
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el correo de recuperación.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-900">
      <StatusBar barStyle="light-content" />
      <View className="absolute -left-24 -top-24 h-80 w-80 rounded-full border border-cyan-200/10" />
      <View className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full border border-turquoise-300/10" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 28,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          bounces={false}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => {
            scrollViewHeight.current = event.nativeEvent.layout.height;
          }}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <Animated.View
            entering={brandEntering}
            className="mb-6 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <WaterPulse size="small" />
              </View>
              <View>
                <Text className="text-base font-extrabold tracking-[2px] text-white">
                  EPMAPS
                </Text>
                <Text className="mt-0.5 text-[10px] font-semibold tracking-[2px] text-cyan-200">
                  AGUA DE QUITO
                </Text>
              </View>
            </View>
            <View className="flex-row items-center rounded-full border border-white/15 bg-white/5 px-3 py-2">
              <View className="mr-2 h-2 w-2 rounded-full bg-[#8DE9E7]" />
              <Text className="text-[10px] font-bold tracking-wider text-cyan-50">
                QUITO · ECUADOR
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={heroEntering}
            className="mb-6 flex-row items-center rounded-[28px] border border-white/10 bg-white/5 px-4 py-4"
          >
            <WaterPulse />
            <View className="ml-4 flex-1">
              <Text className="mb-2 self-start rounded-md bg-cyan-300/10 px-2 py-1 text-[9px] font-extrabold tracking-[1.4px] text-cyan-100">
                OPERACIÓN DE LECTURAS
              </Text>
              <Text className="text-[27px] font-extrabold leading-[31px] tracking-tight text-white">
                Tu jornada,
              </Text>
              <Text className="text-[27px] font-extrabold leading-[31px] tracking-tight text-cyan-200">
                en movimiento.
              </Text>
              <Text className="mt-2 text-xs leading-[18px] text-slate-300">
                Registra, consulta y sincroniza desde tu ruta.
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={loginCardEntering}
            className="rounded-[28px] border border-white/70 bg-[#F8FAFC] p-6 shadow-2xl"
            onLayout={(event) => {
              loginCardTop.current = event.nativeEvent.layout.y;
            }}
            style={cardAnimatedStyle}
          >
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-[10px] font-extrabold tracking-[1.8px] text-cyan-700">
                ACCESO DE PERSONAL
              </Text>
              <Feather color="#087F83" name="shield" size={16} />
            </View>
            <Text className="mt-2 text-[26px] font-extrabold tracking-tight text-navy-900">
              Qué bueno verte.
            </Text>
            <Text className="mt-1 text-sm leading-5 text-gray-600">
              Ingresa con tu cuenta institucional para continuar.
            </Text>

            <View
              className="mt-5 gap-4"
              onLayout={(event) => {
                fieldsContainerTop.current = event.nativeEvent.layout.y;
              }}
            >
              <Animated.View
                entering={emailEntering}
                onLayout={(event) => {
                  emailFieldLayout.current = {
                    top: event.nativeEvent.layout.y,
                    height: event.nativeEvent.layout.height,
                  };
                }}
              >
                <Text className="mb-2 text-xs font-bold tracking-wide text-gray-700">
                  CORREO INSTITUCIONAL
                </Text>
                <TextInput
                  accessibilityLabel="Correo institucional"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  className={`rounded-2xl border bg-white px-4 py-4 text-base text-gray-900 ${
                    campoActivo === 'correo'
                      ? 'border-cyan-600 bg-cyan-50/40'
                      : 'border-gray-200'
                  }`}
                  keyboardType="email-address"
                  onBlur={() => setCampoActivo(null)}
                  onChangeText={setCorreo}
                  onFocus={() => {
                    setCampoActivo('correo');
                    revealField(emailFieldLayout.current);
                  }}
                  placeholder="nombre@epmaps.gob.ec"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                  value={correo}
                />
              </Animated.View>

              <Animated.View
                entering={passwordEntering}
                onLayout={(event) => {
                  passwordFieldLayout.current = {
                    top: event.nativeEvent.layout.y,
                    height: event.nativeEvent.layout.height,
                  };
                }}
              >
                <Text className="mb-2 text-xs font-bold tracking-wide text-gray-700">
                  CONTRASEÑA
                </Text>
                <TextInput
                  accessibilityLabel="Contraseña"
                  autoCapitalize="none"
                  autoComplete="password"
                  className={`rounded-2xl border bg-white px-4 py-4 text-base text-gray-900 ${
                    campoActivo === 'clave'
                      ? 'border-cyan-600 bg-cyan-50/40'
                      : 'border-gray-200'
                  }`}
                  onBlur={() => setCampoActivo(null)}
                  onChangeText={setClave}
                  onSubmitEditing={handleLogin}
                  onFocus={() => {
                    setCampoActivo('clave');
                    revealField(passwordFieldLayout.current);
                  }}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="go"
                  secureTextEntry
                  value={clave}
                />
              </Animated.View>
            </View>

            {mensajeError ? (
              <Animated.View
                entering={BounceInDown.duration(500)}
                accessibilityRole="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <Text className="text-sm leading-5 text-red-700">
                  {mensajeError}
                </Text>
              </Animated.View>
            ) : null}
            {errorInicializacion ? (
              <View
                accessibilityRole="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <Text className="text-sm leading-5 text-red-700">
                  {errorInicializacion}
                </Text>
              </View>
            ) : null}
            {mensajeExito ? (
              <Animated.View
                entering={BounceInDown.duration(550)}
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <Text className="text-sm leading-5 text-emerald-700">
                  {mensajeExito}
                </Text>
              </Animated.View>
            ) : null}

            {correoNoVerificado ? (
              <Pressable
                accessibilityRole="button"
                className="mt-4 items-center rounded-xl border border-turquoise-600 px-4 py-3"
                disabled={
                  enviando ||
                  Boolean(errorInicializacion) ||
                  !correo.trim() ||
                  !clave
                }
                onPress={handleResendVerification}
              >
                <Text className="text-center text-sm font-bold text-navy-700">
                  Reenviar correo de verificación
                </Text>
              </Pressable>
            ) : null}

            <PressableButton
              accessibilityLabel="Iniciar sesión"
              className="mt-5 items-center rounded-2xl bg-navy-700 px-4 py-4"
              disabled={enviando || cargando || Boolean(errorInicializacion)}
              onPress={handleLogin}
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-base font-extrabold tracking-wide text-white">
                  {enviando ? 'Conectando...' : 'Iniciar sesión'}
                </Text>
                {!enviando ? (
                  <View className="ml-2">
                    <Feather
                      color="#FFFFFF"
                      name="arrow-up-right"
                      size={17}
                    />
                  </View>
                ) : null}
              </View>
            </PressableButton>

            <Pressable
              accessibilityRole="button"
              className="mt-4 self-center rounded-lg px-3 py-2"
              disabled={enviando}
              onPress={handlePasswordRecovery}
            >
              <Text className="text-sm font-bold text-navy-700">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </Animated.View>

          <View className="mt-5 flex-row justify-center">
            <Text className="text-sm text-slate-300">
              ¿Aún no tienes cuenta?{' '}
            </Text>
            <Link asChild href="/registro">
              <Text className="text-sm font-extrabold text-cyan-200">
                Regístrate
              </Text>
            </Link>
          </View>
          <Text className="mt-4 text-center text-[10px] font-semibold tracking-[1.5px] text-slate-500">
            MEDIDORES  ·  LECTURAS  ·  SINCRONIZACIÓN
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
