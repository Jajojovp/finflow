import React from 'react';
import { Linking } from 'react-native';
import { Button, Card, Copy, Title } from './ui';
export default function AccountCard() {
  return <Card><Title>Tu cuenta de FinFlow.</Title><Copy muted small>Abre la web oficial para acceder con Google. Esta vista de desarrollo conserva sus propios datos locales.</Copy><Button title="Abrir FinFlow con Google" onPress={() => void Linking.openURL('https://finflow.sysora.io/auth/index.php?action=login')} /></Card>;
}
