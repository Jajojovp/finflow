import React from 'react';
import { useAuth } from '@/data/auth';
import { Button, Card, Copy, ErrorText, Title } from './ui';
export default function AccountCard() {
  const { user, busy, error, login, logout, cancel } = useAuth();
  return <Card>
    <Title>{user ? `Hola, ${user.name}.` : 'Tu cuenta, tu espacio.'}</Title>
    {user && <Copy muted>{user.email}</Copy>}
    <Copy muted small>Accede con Google o continúa en modo local. Cada cuenta tiene un espacio separado en este dispositivo; entrar o salir conserva los datos anteriores. No hay sincronización automática.</Copy>
    {busy && <Copy small>Completa el acceso en el navegador y vuelve a FinFlow. La sesión se conserva mientras la app está abierta, hasta ocho horas.</Copy>}
    <ErrorText message={error} />
    <Button title={user ? 'Cerrar sesión' : busy ? 'Esperando a Google…' : 'Continuar con Google'} disabled={busy} onPress={() => void (user ? logout() : login())} />
    {busy && !user && <Button title="Cancelar acceso" secondary onPress={cancel} />}
  </Card>;
}
