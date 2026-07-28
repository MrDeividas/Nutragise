/**
 * Thin redirect — Store lives inside the Rewards hub (Raffle screen).
 */
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function StoreScreen() {
  const navigation = useNavigation() as any;

  useEffect(() => {
    navigation.replace('Raffle', { tab: 'store' });
  }, [navigation]);

  return null;
}
