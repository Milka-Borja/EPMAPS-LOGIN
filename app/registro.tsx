import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PasswordStrengthIndicator } from '../src/components/PasswordStrengthIndicator';
import { PressableButton } from '../src/components/PressableButton';
import { SafeAreaView } from '../src/components/SafeAreaView';
import { WaterPulse } from '../src/components/WaterPulse';
import { useSesion } from '../src/context/sesion';

const registrationHeaderEntering = BounceInDown.springify().damping(13);
const registrationCardEntering = FadeInDown.springify().damping(16).delay(120);
const registrationFieldsEntering = [
  FadeInDown.delay(220).duration(550),
  FadeInDown.delay(300).duration(550),
  FadeInDown.delay(380).duration(550),
  FadeInDown.delay(460).duration(550),
];

export default function RegistroScreen() {
  const { registrarse, errorInicializacion } = useSesion();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [registroCompletado, setRegistroCompletado] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewHeight = useRef(0);
  const scrollOffset = useRef(0);
  const registrationCardTop = useRef(0);
  const fieldsContainerTop = useRef(0);
  const passwordFieldLayout = useRef({ top: 0, height: 0 });
  const confirmationFieldLayout = useRef({ top: 0, height: 0 });
  const keyboardVisible = useRef(false);
  const pendingFieldLayout = useRef<{ top: number; height: number } | null>(
    null,
  );
  const formShake = useSharedValue(0);
  const formScale = useSharedValue(1);
  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: formShake.value },
      { scale: formScale.value },
    ],
  }));

  function scrollFocusedFieldIntoView() {
    const field = pendingFieldLayout.current;
    if (!field || scrollViewHeight.current === 0) {
      return;
    }

    const fieldTop = registrationCardTop.current + fieldsContainerTop.current + field.top;
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

  function animateFormError() {
    formShake.set(
      withSequence(
        withTiming(-14, { duration: 60 }),
        withTiming(14, { duration: 60 }),
        withTiming(-9, { duration: 55 }),
        withTiming(9, { duration: 55 }),
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

  async function handleRegister() {
    setMensajeError(null);
    if (clave !== confirmacion) {
      animateFormError();
      setMensajeError('Las contraseñas no coinciden.');
      return;
    }
    if (!nombre.trim()) {
      animateFormError();
      setMensajeError('Ingresa tu nombre completo.');
      return;
    }

    setRegistrando(true);
    try {
      await registrarse(nombre.trim(), correo.trim(), clave);
      setRegistroCompletado(true);
    } catch (error) {
      animateFormError();
      setMensajeError(
        error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
      );
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-900">
      <StatusBar barStyle="light-content" />
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
            paddingVertical: 32,
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
            entering={registrationHeaderEntering}
            className="mb-6 flex-row items-center"
          >
            <WaterPulse size="small" />
            <View className="ml-4 flex-1">
              <Text className="mb-1 text-[10px] font-extrabold tracking-[1.8px] text-cyan-200">
                EPMAPS · AGUA DE QUITO
              </Text>
              <Text className="text-3xl font-extrabold tracking-tight text-white">
                Crear cuenta
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-300">
                Un acceso seguro para el equipo de campo.
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            entering={registrationCardEntering}
            className="rounded-[28px] border border-white/70 bg-[#F8FAFC] p-6 shadow-2xl"
            onLayout={(event) => {
              registrationCardTop.current = event.nativeEvent.layout.y;
            }}
            style={formAnimatedStyle}
          >
            {registroCompletado ? (
              <Animated.View entering={ZoomIn.springify().damping(12)}>
                <Animated.View
                  entering={ZoomIn.delay(100).springify().damping(9)}
                  className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100"
                >
                  <Feather color="#047857" name="check" size={32} />
                </Animated.View>
                <Text className="text-[26px] font-extrabold tracking-tight text-navy-900">
                  Revisa tu correo
                </Text>
                <Text className="mt-2 text-sm leading-5 text-gray-600">
                  Enviamos un enlace de verificación a {correo}. Confirma tu
                  cuenta antes de iniciar sesión.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="mt-6 items-center rounded-xl bg-navy-700 px-4 py-4 active:opacity-80"
                  onPress={() => router.replace('/login')}
                >
                  <Text className="text-base font-bold text-white">
                    Ir al inicio de sesión
                  </Text>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <View
                  className="gap-4"
                  onLayout={(event) => {
                    fieldsContainerTop.current = event.nativeEvent.layout.y;
                  }}
                >
                  <Animated.View entering={registrationFieldsEntering[0]}>
                    <Text className="mb-2 text-sm font-semibold text-gray-700">
                      Nombre completo
                    </Text>
                    <TextInput
                      accessibilityLabel="Nombre completo"
                      autoCapitalize="words"
                      autoComplete="name"
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
                      onChangeText={setNombre}
                      placeholder="Tu nombre"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                      value={nombre}
                    />
                  </Animated.View>
                  <Animated.View entering={registrationFieldsEntering[1]}>
                    <Text className="mb-2 text-sm font-semibold text-gray-700">
                      Correo institucional
                    </Text>
                    <TextInput
                      accessibilityLabel="Correo institucional"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
                      keyboardType="email-address"
                      onChangeText={setCorreo}
                      placeholder="nombre@epmaps.gob.ec"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                      value={correo}
                    />
                  </Animated.View>
                  <Animated.View
                    entering={registrationFieldsEntering[2]}
                    onLayout={(event) => {
                      passwordFieldLayout.current = {
                        top: event.nativeEvent.layout.y,
                        height: event.nativeEvent.layout.height,
                      };
                    }}
                  >
                    <Text className="mb-2 text-sm font-semibold text-gray-700">
                      Contraseña
                    </Text>
                    <TextInput
                      accessibilityLabel="Contraseña"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
                      onChangeText={setClave}
                      onFocus={() => revealField(passwordFieldLayout.current)}
                      placeholder="Crea una contraseña"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="next"
                      secureTextEntry
                      value={clave}
                    />
                    <PasswordStrengthIndicator password={clave} />
                  </Animated.View>
                  <Animated.View
                    entering={registrationFieldsEntering[3]}
                    onLayout={(event) => {
                      confirmationFieldLayout.current = {
                        top: event.nativeEvent.layout.y,
                        height: event.nativeEvent.layout.height,
                      };
                    }}
                  >
                    <Text className="mb-2 text-sm font-semibold text-gray-700">
                      Confirmar contraseña
                    </Text>
                    <TextInput
                      accessibilityLabel="Confirmar contraseña"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900"
                      onChangeText={setConfirmacion}
                      onFocus={() =>
                        revealField(confirmationFieldLayout.current)
                      }
                      onSubmitEditing={handleRegister}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor="#9CA3AF"
                      returnKeyType="go"
                      secureTextEntry
                      value={confirmacion}
                    />
                  </Animated.View>
                </View>

                {mensajeError || errorInicializacion ? (
                  <Animated.View
                    entering={BounceInDown.duration(500)}
                    accessibilityRole="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <Text className="text-sm leading-5 text-red-700">
                      {mensajeError ?? errorInicializacion}
                    </Text>
                  </Animated.View>
                ) : null}

                <PressableButton
                  accessibilityLabel="Crear cuenta"
                  className="mt-6 items-center rounded-2xl bg-navy-700 px-4 py-4"
                  disabled={registrando || Boolean(errorInicializacion)}
                  onPress={handleRegister}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-base font-extrabold tracking-wide text-white">
                      {registrando ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Text>
                    {registrando ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                        size="small"
                        style={{ marginLeft: 8 }}
                      />
                    ) : (
                      <View className="ml-2">
                        <Feather
                          color="#FFFFFF"
                          name="arrow-up-right"
                          size={17}
                        />
                      </View>
                    )}
                  </View>
                </PressableButton>
              </>
            )}
          </Animated.View>

          {!registroCompletado ? (
            <View className="mt-6 flex-row justify-center">
              <Text className="text-sm text-white/80">
                ¿Ya tienes cuenta?{' '}
              </Text>
              <Link asChild href="/login">
                <Text className="text-sm font-bold text-cyan-200">
                  Inicia sesión
                </Text>
              </Link>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
