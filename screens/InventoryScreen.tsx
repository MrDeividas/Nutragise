/**
 * Thin redirect — Inventory lives inside the Rewards hub (Raffle screen).
 */
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function InventoryScreen() {
  const navigation = useNavigation() as any;

  useEffect(() => {
    navigation.replace('Raffle', { tab: 'inventory' });
  }, [navigation]);

  return null;
}
