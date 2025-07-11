import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an avatar image to Supabase Storage
 */
export const uploadAvatar = async (
  userId: string, 
  imageUri: string
): Promise<UploadResult> => {
  try {
    // Get file extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase();
    const fileName = `${userId}/avatar.${fileExt}`;

    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true, // Replace existing avatar
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to upload avatar' 
    };
  }
};

/**
 * Upload a progress photo to Supabase Storage
 */
export const uploadProgressPhoto = async (
  userId: string, 
  goalId: string,
  imageUri: string
): Promise<UploadResult> => {
  try {
    // Get file extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase();
    const timestamp = new Date().getTime();
    const fileName = `${userId}/${goalId}_${timestamp}.${fileExt}`;

    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('progress-photos')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false, // Don't replace, create new file
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(fileName);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to upload progress photo' 
    };
  }
};

/**
 * Delete an avatar from Supabase Storage
 */
export const deleteAvatar = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Delete a progress photo from Supabase Storage
 */
export const deleteProgressPhoto = async (photoUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const userFolder = urlParts[urlParts.length - 2];
    const filePath = `${userFolder}/${fileName}`;

    const { error } = await supabase.storage
      .from('progress-photos')
      .remove([filePath]);

    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Pick an image from the device gallery or camera
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerResult> => {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission to access media library is required');
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio for avatars
    quality: 0.8,
  });

  return result;
};

/**
 * Take a photo with the camera
 */
export const takePhoto = async (): Promise<ImagePicker.ImagePickerResult> => {
  // Request permissions
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission to access camera is required');
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio
    quality: 0.8,
  });

  return result;
}; 