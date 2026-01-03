import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuthStore } from '../state/authStore';
import { stripeService } from '../lib/stripeService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

const proFeatures = [
  {
    icon: 'analytics',
    title: 'Insights & Analytics',
    description: 'Advanced tracking, AI insights, and personalized recommendations',
    color: '#8B5CF6',
  },
  {
    icon: 'gift',
    title: 'Raffle Access',
    description: 'Enter exclusive giveaways and win amazing prizes',
    color: '#EC4899',
  },
  {
    icon: 'trophy',
    title: 'Pro Challenges',
    description: 'Create custom challenges and join premium competitions',
    color: '#F59E0B',
  },
];

export default function UpgradeToProModal({ visible, onClose, onUpgrade }: Props) {
  const { user } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    // Create subscription with Payment Sheet (in-app)
    if (!user) {
      Alert.alert('Error', 'Please log in to upgrade to Pro');
      return;
    }

    try {
      setLoading(true);

      // 1. Create subscription with Payment Sheet
      const { subscriptionId, clientSecret } = await stripeService.createSubscriptionPaymentSheet(
        user.id,
        user.email,
        user.username
      );

      if (!clientSecret) {
        throw new Error('Failed to create payment sheet');
      }

      // 2. Initialize Payment Sheet with Card only (Apple Pay/Google Pay disabled until app is deployed)
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Nutragise Pro',
        paymentIntentClientSecret: clientSecret,
        paymentMethodTypes: ['Card'], // Only Card for now
        defaultBillingDetails: {
          name: user.username || user.email?.split('@')[0] || 'User',
          email: user.email,
        },
        returnURL: 'nutrapp://subscription-success',
        allowsDelayedPaymentMethods: false, // Disable Link
        appearance: {
          colors: {
            primary: '#F59E0B',
          },
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('Payment canceled by user');
          return;
        }
        throw new Error(presentError.message);
      }

      // 4. Payment successful!
      console.log('✅ Subscription payment successful:', subscriptionId);
      
      // Close modal and show success
      onClose();
      Alert.alert(
        'Welcome to Pro! 🎉',
        'Your subscription is being activated. You\'ll have Pro access shortly!',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      Alert.alert(
        'Subscription Error',
        error.message || 'Failed to start subscription. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="star" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.title}>Upgrade to Pro</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Features List - Prominent */}
                <View style={styles.featuresContainer}>
                  {proFeatures.map((feature, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.featureItem,
                        index === proFeatures.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
                      ]}
                    >
                      <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                        <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                      </View>
                      <View style={styles.featureTextContainer}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Pricing Section */}
                <View style={styles.pricingContainer}>
                  <View style={styles.pricingBadge}>
                    <Text style={styles.pricingBadgeText}>PRO MEMBERSHIP</Text>
                  </View>
                  <Text style={styles.priceText}>
                    £15<Text style={styles.pricePeriod}>/month</Text>
                  </Text>
                  <Text style={styles.priceSubtext}>Cancel anytime</Text>
                </View>
              </ScrollView>

              {/* Footer - Upgrade Button */}
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={[styles.upgradeButton, loading && styles.upgradeButtonDisabled]}
                  onPress={handleUpgrade}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="star" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.maybeLaterButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.maybeLaterText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 20,
    backgroundColor: 'white',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    maxHeight: 500,
    backgroundColor: 'white',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  pricingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  pricingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
  },
  priceSubtext: {
    fontSize: 12,
    color: '#888',
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

