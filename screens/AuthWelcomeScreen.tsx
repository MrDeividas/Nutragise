import React from 'react';
import WelcomeStep from '../components/onboarding/flow/WelcomeStep';

export default function AuthWelcomeScreen({ navigation }: any) {
  return (
    <WelcomeStep
      onStart={() => navigation.navigate('SignUp')}
      onHaveAccount={() => navigation.navigate('SignIn')}
      ctaLabel="Sign up"
    />
  );
}
